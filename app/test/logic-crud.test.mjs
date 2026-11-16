import test from 'node:test'; import assert from 'node:assert/strict';
import GG from '../src/logic.js';
test('project, công việc, việc', () => {
  let s = GG.addProject(GG.emptyState(), '  Học IELTS ', '2026-11-01');
  assert.equal(s.projects[0].name, 'Học IELTS');
  assert.equal(GG.addProject(s, '   ', '2026-11-01'), s);
  const p = s.projects[0].id;
  s = GG.addWork(GG.addWork(s, p, 'Listening'), p, 'Reading');
  assert.deepEqual(s.projects[0].works.map(w => w.order), [1, 2]);
  const w = s.projects[0].works[0].id;
  s = GG.addTodo(s, { workId: w, text: 'Nghe Test 1', date: '2026-11-14' });
  const t = s.todos[0].id;
  assert.equal(GG.workStats(s, w).status, 'new');
  s = GG.toggleTodo(s, t, '2026-11-14T08:00:00+07:00');
  assert.equal(s.todos[0].doneAt, '2026-11-14T08:00:00+07:00');
  assert.deepEqual(GG.workStats(s, w), { total: 1, done: 1, status: 'done' });
  assert.deepEqual(GG.projectStats(s, p), { total: 1, done: 1, pct: 100 });
  s = GG.toggleTodo(s, t, '2026-11-14T09:00:00+07:00');
  assert.equal(s.todos[0].done, false); assert.equal(s.todos[0].doneAt, null);
  assert.equal(GG.addTodo(s, { workId: 'khong-co', text: 'x', date: '2026-11-14' }), s);
  s = GG.updateTodo(s, t, { text: ' Nghe Test 2 ', date: '2026-11-15', done: true });
  assert.equal(s.todos[0].text, 'Nghe Test 2'); assert.equal(s.todos[0].date, '2026-11-15'); assert.equal(s.todos[0].done, false);
  assert.equal(GG.updateTodo(s, t, { date: '2026-13-01' }), s);
  s = GG.renameWork(GG.renameProject(s, p, 'IELTS 7.0'), w, 'Nghe');
  assert.equal(GG.findWork(s, w).project.name, 'IELTS 7.0'); assert.equal(GG.findWork(s, w).work.name, 'Nghe');
  s = GG.deleteWork(s, w);
  assert.equal(s.todos.length, 0); assert.equal(s.projects[0].works.length, 1);
});
test('việc trễ và mang sang', () => {
  let s = GG.addProject(GG.emptyState(), 'P', '2026-11-01'); s = GG.addWork(s, s.projects[0].id, 'W');
  const w = s.projects[0].works[0].id;
  s = GG.addTodo(s, { workId: w, text: 'b', date: '2026-11-13' });
  s = GG.addTodo(s, { workId: w, text: 'a', date: '2026-11-12' });
  s = GG.addTodo(s, { workId: w, text: 'c', date: '2026-11-14' });
  assert.deepEqual(GG.overdue(s, '2026-11-14').map(t => t.text), ['a', 'b']);
  s = GG.carryOver(s, [GG.overdue(s, '2026-11-14')[0].id], '2026-11-14');
  assert.deepEqual(GG.overdue(s, '2026-11-14').map(t => t.text), ['b']);
  assert.equal(GG.todosOn(s, '2026-11-14').length, 2);
});
test('xóa không làm mất cây đã trồng', () => {
  let s = GG.addProject(GG.emptyState(), 'P', '2026-11-01'); s = GG.addWork(s, s.projects[0].id, 'W');
  const w = s.projects[0].works[0].id, d = '2026-11-14';
  s = GG.addTodo(s, { workId: w, text: 'a', date: d }); s = GG.toggleTodo(s, s.todos[0].id, d + 'T08:00:00+07:00');
  s = GG.plant(s, d, d); s = GG.deleteProject(s, s.projects[0].id);
  assert.equal(s.todos.length, 0); assert.equal(s.days[d].planted, true);
  assert.deepEqual(GG.dayProgress(s, d), { total: 0, done: 0, pct: 0 });
  assert.equal(GG.canPlant(s, d, d).reason, 'planted');
});
test('loại cây khóa sau khi trồng, cảm xúc ghi đè', () => {
  const d = '2026-11-14';
  let s = GG.setKind(GG.emptyState(), d, 'sen'); assert.equal(s.days[d].kind, 'sen');
  assert.equal(GG.setKind(s, d, 'hoa-la'), s);
  s = { ...s, days: { [d]: { kind: 'sen', planted: true } } };
  assert.equal(GG.setKind(s, d, 'mai'), s);
  s = GG.setMood(GG.setMood(s, d, 2), d, 5); assert.equal(s.days[d].mood, 5);
  assert.equal(GG.setMood(s, d, 6), s);
});
test('đã trồng hôm nay mà còn việc chưa xong thì cây quay về đang lớn', () => {
  const d = '2026-11-15';
  let s = GG.addProject(GG.emptyState(), 'P', '2026-11-01'); s = GG.addWork(s, s.projects[0].id, 'W');
  const w = s.projects[0].works[0].id;
  s = GG.addTodo(s, { workId: w, text: 'a', date: d }); s = GG.toggleTodo(s, s.todos[0].id, d + 'T08:00:00+07:00');
  s = GG.setKind(s, d, 'sen'); s = GG.setMood(s, d, 4); s = GG.plant(s, d, d);
  assert.equal(GG.settleToday(s, d), s);                                   // xong hết: giữ nguyên, cùng một đối tượng
  // thêm việc mới sau khi trồng
  const added = GG.settleToday(GG.addTodo(s, { workId: w, text: 'b', date: d }), d);
  assert.equal(added.days[d].planted, false);
  assert.equal(added.days[d].kind, 'sen'); assert.equal(added.days[d].mood, 4);   // loại cây và cảm xúc không mất
  assert.equal(GG.canPlant(added, d, d).reason, 'remaining');
  assert.equal(s.days[d].planted, true);                                   // state cũ không bị sửa
  // bỏ tick sau khi trồng
  const unticked = GG.settleToday(GG.toggleTodo(s, s.todos[0].id, d + 'T09:00:00+07:00'), d);
  assert.equal(unticked.days[d].planted, false);
  // xong lại thì trồng lại được
  const again = GG.plant(GG.toggleTodo(unticked, unticked.todos[0].id, d + 'T10:00:00+07:00'), d, d);
  assert.equal(again.days[d].planted, true);
  // ngày đã qua: cây ở lại dù thêm việc chưa xong vào ngày đó
  const past = GG.addTodo(s, { workId: w, text: 'c', date: d });
  assert.equal(GG.settleToday(past, '2026-11-16'), past);
  // hôm nay đã trồng rồi xóa hết việc: cây ở lại
  const emptied = GG.deleteTodo(s, s.todos[0].id);
  assert.equal(GG.settleToday(emptied, d), emptied);
  // chưa trồng: không đụng gì
  const fresh = GG.addTodo(GG.addWork(GG.addProject(GG.emptyState(), 'P', d), 'x', 'y'), { workId: 'x', text: 'a', date: d });
  assert.equal(GG.settleToday(fresh, d), fresh);
});
