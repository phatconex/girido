import test from 'node:test'; import assert from 'node:assert/strict';
import GG from '../src/logic.js';
import GGStore from '../src/store.js';

function fakeDb(seed = {}) {
  const docs = new Map(Object.entries(seed)), log = [], docSubs = {}, colSubs = [];
  const snap = (path, pending) => ({ id: path.split('/').pop(), exists: docs.has(path), data: () => docs.get(path), metadata: { fromCache: !!db.fromCache, hasPendingWrites: !!pending } });
  const colSnap = (pending) => ({ docs: [...docs.keys()].filter(p => p.startsWith('months/')).sort().map(p => snap(p, pending)), metadata: { fromCache: !!db.fromCache, hasPendingWrites: !!pending } });
  const db = {
    docs, log, failNext: false,
    doc(path) {
      return {
        get: async () => snap(path),
        set: async (body) => { if (db.failNext) { db.failNext = false; throw { code: 'unavailable', message: 'x' }; } log.push(['set', path]); docs.set(path, JSON.parse(JSON.stringify(body))); },
        delete: async () => { log.push(['delete', path]); docs.delete(path); },
        onSnapshot(next) { (docSubs[path] = docSubs[path] || []).push(next); return () => {}; },
      };
    },
    collection(path) { return { get: async () => colSnap(), onSnapshot(next) { colSubs.push(next); return () => {}; } }; },
    remote(path, body) {
      if (body === null) docs.delete(path); else docs.set(path, body);
      (docSubs[path] || []).forEach(fn => fn(snap(path)));
      if (path.startsWith('months/')) colSubs.forEach(fn => fn(colSnap()));
    },
  };
  return db;
}
const todo = (id, date) => ({ id, workId: 'w1', text: id, date, done: false, doneAt: null });
const projects = { projects: [{ id: 'p1', name: 'P', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'W', order: 1 }] }] };
const seeded = () => fakeDb({ 'app/projects': projects, 'months/2026-11': { todos: [todo('a', '2026-11-13')], days: { '2026-11-13': { mood: 3 } } } });
function make(db) {
  const seen = { changes: [], status: [] };
  const store = GGStore.create({ db, delay: 0, onChange: s => seen.changes.push(s), onStatus: s => seen.status.push(s) });
  return { store, seen };
}

test('tải state từ kho', async () => {
  const db = seeded(), { store, seen } = make(db);
  await store.ready;
  assert.equal(store.state().projects[0].name, 'P');
  assert.equal(store.state().todos[0].id, 'a');
  assert.equal(store.state().days['2026-11-13'].mood, 3);
  assert.equal(seen.status.at(-1), 'saved');
  assert.equal(db.log.length, 0);
});
test('chỉ ghi tài liệu đã đổi', async () => {
  const db = seeded(), { store } = make(db);
  await store.ready;
  store.apply(s => GG.addTodo(s, { workId: 'w1', text: 'mới', date: '2026-11-14' }));
  await store.flush();
  assert.deepEqual(db.log, [['set', 'months/2026-11']]);
  assert.equal(db.docs.get('months/2026-11').todos.length, 2);
});
test('gộp nhiều thay đổi liên tiếp thành một lần ghi', async () => {
  const db = seeded(), { store, seen } = make(db);
  await store.ready;
  for (const text of ['x', 'y', 'z']) store.apply(s => GG.addTodo(s, { workId: 'w1', text, date: '2026-11-14' }));
  assert.equal(seen.changes.length, 3 + 1);          // một lần lúc tải, ba lần apply
  await store.flush();
  assert.equal(db.log.length, 1);
  assert.equal(seen.status.at(-1), 'saved');
});
test('ghi lỗi rồi thử lại', async () => {
  const db = seeded(), { store, seen } = make(db);
  await store.ready;
  db.failNext = true;
  store.apply(s => GG.addTodo(s, { workId: 'w1', text: 'mới', date: '2026-11-14' }));
  await store.flush();
  assert.equal(seen.status.at(-1), 'error');
  assert.equal(store.state().todos.length, 2);
  assert.equal(db.docs.get('months/2026-11').todos.length, 1);
  store.retry(); await store.flush();
  assert.equal(seen.status.at(-1), 'saved');
  assert.equal(db.docs.get('months/2026-11').todos.length, 2);
});
test('không có kho', async () => {
  const { store, seen } = make(null);
  await store.ready;
  assert.equal(seen.status.at(-1), 'offline');
  store.apply(s => GG.addProject(s, 'P', '2026-11-14'));
  await store.flush();
  assert.equal(store.state().projects.length, 1);
  assert.equal(seen.status.at(-1), 'offline');
});
test('thay đổi từ máy khác', async () => {
  const db = seeded(), { store, seen } = make(db);
  await store.ready;
  const before = seen.changes.length;
  db.remote('months/2026-11', { todos: [todo('a', '2026-11-13'), todo('b', '2026-11-14')], days: {} });
  assert.equal(seen.changes.length, before + 1);
  assert.deepEqual(store.state().todos.map(t => t.id), ['a', 'b']);
  await store.flush();
  assert.equal(db.log.length, 0);                    // không ghi ngược lại thứ vừa nhận
});
test('replaceAll xóa tháng thừa', async () => {
  const db = seeded(); db.docs.set('months/2026-10', { todos: [todo('o', '2026-10-01')], days: {} });
  const { store } = make(db);
  await store.ready;
  await store.replaceAll({ projects: projects.projects, todos: [todo('n', '2026-11-20')], days: {} });
  assert.equal(db.docs.has('months/2026-10'), false);
  assert.deepEqual(db.docs.get('months/2026-11').todos.map(t => t.id), ['n']);
});
test('tháng rỗng bị xóa khỏi kho', async () => {
  const db = seeded(); db.docs.set('months/2026-12', { todos: [todo('d', '2026-12-01')], days: {} });
  const { store } = make(db);
  await store.ready;
  store.apply(s => GG.deleteTodo(s, 'd'));
  await store.flush();
  assert.deepEqual(db.log, [['delete', 'months/2026-12']]);
});
test('tải lỗi thì không ghi đè kho bằng dữ liệu rỗng', async () => {
  const db = seeded(); const realDoc = db.doc.bind(db); let broken = true;
  db.doc = (p) => { const d = realDoc(p); const get = d.get; d.get = async () => { if (broken) throw { code: 'unavailable', message: 'x' }; return get(); }; return d; };
  const { store, seen } = make(db);
  await store.ready;
  assert.equal(seen.status.at(-1), 'error');
  store.apply(s => GG.addProject(s, 'Mới', '2026-11-14'));
  await store.flush();
  assert.equal(db.log.length, 0);
  broken = false; store.retry(); await store.ready; await store.flush();
  assert.equal(seen.status.at(-1), 'saved');
  assert.equal(store.state().projects[0].name, 'P');
});
test('bản chụp một nửa không kéo nửa kia về bản cũ', async () => {
  const db = seeded(), { store } = make(db);
  await store.ready;
  store.apply(s => GG.addTodo(s, { workId: 'w1', text: 'mới', date: '2026-11-14' }));
  await store.flush();                                         // tháng 11 trong kho giờ có 2 việc
  db.remote('app/projects', { projects: [{ ...projects.projects[0], name: 'Đổi tên từ máy khác' }] });
  assert.equal(store.state().projects[0].name, 'Đổi tên từ máy khác');
  assert.deepEqual(store.state().todos.map(t => t.text), ['a', 'mới']);   // việc vừa thêm không được biến mất
  await store.flush();
  assert.equal(db.docs.get('months/2026-11').todos.length, 2);
});
test('bản chụp đến lúc đang bận được ghi nhận, không bị quên', async () => {
  const db = seeded(), { store } = make(db);
  await store.ready;
  store.apply(s => GG.addProject(s, 'Project thứ hai', '2026-11-14'));     // đang bận: chưa ghi
  db.remote('months/2026-12', { todos: [todo('z', '2026-12-02')], days: {} });   // máy khác thêm tháng 12
  await store.flush();
  db.remote('app/projects', db.docs.get('app/projects'));                    // bản chụp xác nhận của chính mình
  assert.deepEqual(store.state().todos.map(t => t.id), ['a', 'z']);
  assert.equal(store.state().projects.length, 2);
  await store.flush();
  assert.equal(db.docs.has('months/2026-12'), true);                         // không xóa nhầm tháng của máy khác
});
test('bản chụp chưa chắc chắn (fromCache) bị bỏ qua', async () => {
  const db = seeded(), { store } = make(db);
  await store.ready;
  db.fromCache = true;
  db.remote('months/2026-11', { todos: [], days: {} });
  assert.equal(store.state().todos.length, 1);
});
test('replaceAll báo kết quả lưu', async () => {
  const db = seeded(), { store } = make(db);
  await store.ready;
  db.failNext = true;
  assert.equal(await store.replaceAll({ projects: projects.projects, todos: [todo('n', '2026-11-20')], days: {} }), 'error');
  store.retry(); await store.flush();
  assert.equal(await store.replaceAll({ projects: projects.projects, todos: [todo('m', '2026-11-21')], days: {} }), 'saved');
});
