import { test, expect } from 'vitest';
import GG from './logic';
import type { State } from './logic';
import { diff, toRows, fromRows } from '../data/rows';

const D = '2026-11-17';
const seed = (): State => ({
  projects: [{ id: 'p1', name: 'EDNIX', createdAt: D, works: [{ id: 'w1', name: 'W', order: 1 }] }, { id: 'p2', name: 'Khác', createdAt: D, works: [] }],
  todos: [{ id: 'a', workId: '', text: 'Lên plan', date: D, done: false, doneAt: null }],
  days: {},
  notes: [],
});
const todo = (st: State, id = 'a') => st.todos.find((t) => t.id === id)!;

test('mục con: thêm, tick hết thì việc tự xong, bỏ tick một mục thì việc chưa xong', () => {
  let st = GG.addSub(GG.addSub(seed(), 'a', ' Bước 1 ', 'n1'), 'a', 'Bước 2', 'n1');
  const [s1, s2] = todo(st).subs!;
  expect([s1.text, s2.text, s1.done]).toEqual(['Bước 1', 'Bước 2', false]);
  st = GG.toggleSub(st, 'a', s1.id, 'n2');
  expect(todo(st).done).toBe(false);
  st = GG.toggleSub(st, 'a', s2.id, 'n3');
  expect(todo(st)).toMatchObject({ done: true, doneAt: 'n3' });
  st = GG.toggleSub(st, 'a', s1.id, 'n4');
  expect(todo(st)).toMatchObject({ done: false, doneAt: null });
  expect(GG.addSub(st, 'a', '   ', 'n')).toBe(st);
  expect(GG.toggleSub(st, 'a', 'khong-co', 'n')).toBe(st);
});

test('mục con: tick việc cha là xong hết mục con; thêm mục mới vào việc đã xong thì việc mở lại', () => {
  let st = GG.addSub(GG.addSub(seed(), 'a', 'x', 'n'), 'a', 'y', 'n');
  st = GG.toggleTodo(st, 'a', 'n1');
  expect(todo(st).subs!.every((s) => s.done)).toBe(true);
  st = GG.addSub(st, 'a', 'z', 'n2');
  expect(todo(st).done).toBe(false);
});

test('mục con: đổi tên, xóa; xóa mục chưa xong cuối cùng thì việc xong; xóa hết thì không còn danh sách', () => {
  let st = GG.addSub(GG.addSub(seed(), 'a', 'x', 'n'), 'a', 'y', 'n');
  const [s1, s2] = todo(st).subs!;
  st = GG.renameSub(st, 'a', s1.id, 'x mới');
  expect(todo(st).subs![0].text).toBe('x mới');
  st = GG.toggleSub(st, 'a', s1.id, 'n1');
  st = GG.deleteSub(st, 'a', s2.id, 'n2');
  expect(todo(st)).toMatchObject({ done: true, doneAt: 'n2' });
  st = GG.deleteSub(st, 'a', s1.id, 'n3');
  expect(todo(st).subs).toBeUndefined();
});

test('việc nằm thẳng trong project: thêm được, tính vào tiến độ project, xóa project thì mất theo, việc lẻ thì không', () => {
  let st = GG.addTodo(seed(), { workId: '', projectId: 'p2', text: 'Việc của project', date: D });
  expect(GG.directTodos(st, 'p2').map((t) => t.text)).toEqual(['Việc của project']);
  expect(GG.directTodos(st, 'p1')).toEqual([]);
  expect(GG.projectStats(st, 'p2')).toEqual({ total: 1, done: 0, pct: 0 });
  st = GG.toggleTodo(st, GG.directTodos(st, 'p2')[0].id, 'n');
  expect(GG.projectStats(st, 'p2').pct).toBe(100);
  expect(GG.addTodo(st, { workId: '', projectId: 'khong-co', text: 'x', date: D })).toBe(st);
  st = GG.deleteProject(st, 'p2');
  expect(st.todos.map((t) => t.id)).toEqual(['a']);
});

test('ghi chú: thêm, sửa, ghim, xóa, và thứ tự hiển thị', () => {
  let st = GG.addNote(seed(), ' Ý tưởng 1 ', '2026-11-17T01:00:00.000Z');
  st = GG.addNote(st, 'Ý tưởng 2', '2026-11-17T02:00:00.000Z');
  expect(GG.addNote(st, '  ', 'x')).toBe(st);
  const [n1, n2] = st.notes;
  expect(GG.sortNotes(st).map((n) => n.text)).toEqual(['Ý tưởng 2', 'Ý tưởng 1']);
  st = GG.pinNote(st, n1.id);
  expect(GG.sortNotes(st).map((n) => n.text)).toEqual(['Ý tưởng 1', 'Ý tưởng 2']);
  st = GG.pinNote(st, n1.id);
  expect(st.notes[0].pinned).toBeUndefined();
  st = GG.updateNote(st, n1.id, 'Ý tưởng 1 sửa', '2026-11-17T03:00:00.000Z');
  expect(GG.sortNotes(st)[0]).toMatchObject({ text: 'Ý tưởng 1 sửa', createdAt: '2026-11-17T01:00:00.000Z', updatedAt: '2026-11-17T03:00:00.000Z' });
  expect(GG.updateNote(st, n1.id, 'Ý tưởng 1 sửa', 'sau')).toBe(st);          // không đổi chữ thì không đổi gì
  st = GG.deleteNote(st, n2.id);
  expect(st.notes).toHaveLength(1);
  expect(GG.deleteNote(st, 'khong-co')).toBe(st);
});

test('xuất rồi nhập lại, và đi qua các dòng Supabase, vẫn giữ mục con, việc của project và ghi chú', () => {
  let st = GG.addTodo(seed(), { workId: '', projectId: 'p2', text: 'Trực tiếp', date: D });
  st = GG.toggleSub(GG.addSub(GG.addSub(st, 'a', 'x', 'n'), 'a', 'y', 'n'), 'a', todo(GG.addSub(st, 'a', 'x', 'n')).subs![0].id, 'n');
  st = GG.pinNote(GG.addNote(st, 'Ghi chú', '2026-11-17T01:00:00.000Z'), GG.addNote(st, 'Ghi chú', 'x').notes[0].id);
  st = GG.addNote(st, 'Ghi chú', '2026-11-17T01:00:00.000Z');
  st = GG.pinNote(st, st.notes[0].id);
  const r = GG.validateImport(JSON.parse(JSON.stringify(GG.exportData(st, 'now'))));
  expect(r.ok && r.state).toEqual(st);
  expect(fromRows(toRows(st))).toEqual(st);
  const rows = toRows(st);
  expect(rows.todos.find((t) => t.text === 'Trực tiếp')).toMatchObject({ work_id: null, project_id: 'p2' });
  expect(rows.todos.find((t) => t.id === 'a')).toMatchObject({ project_id: null, subs: [{ text: 'x' }, { text: 'y' }] });
  expect(rows.notes[0]).toMatchObject({ body: 'Ghi chú', pinned: true });
  const c = diff(st, GG.deleteNote(st, st.notes[0].id));
  expect(c.notes.remove).toEqual([st.notes[0].id]);
  expect(c.todos.upsert).toEqual([]);
});

test('file cũ không có notes, subs, projectId vẫn đọc được; file sai thì báo lỗi', () => {
  const old = GG.validateImport({ app: 'giri-garden', version: 1, projects: [], todos: [], days: {} });
  expect(old.ok && old.state.notes).toEqual([]);
  const bad = (todo: object) => GG.validateImport({ app: 'giri-garden', version: 1, projects: [], todos: [{ id: 't', workId: '', text: 'x', date: D, done: false, ...todo }], days: {} }).ok;
  expect(bad({ projectId: 'khong-co' })).toBe(false);
  expect(bad({ subs: [{ id: 's', text: '', done: false }] })).toBe(false);
  expect(bad({ subs: [{ id: 's', text: 'ok', done: true }] })).toBe(true);
});
