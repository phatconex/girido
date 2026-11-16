import { test, expect } from 'vitest';
import GG from './logic';
import type { State } from './logic';
import { diff, toRows, fromRows } from '../data/rows';

const D1 = '2026-11-15', D2 = '2026-11-16';
const seed = (): State => ({
  projects: [{ id: 'p1', name: 'P', createdAt: D1, works: [{ id: 'w1', name: 'W', order: 1 }] }],
  todos: [{ id: 'a', workId: 'w1', text: 'a', date: D2, done: false, doneAt: null }],
  days: {},
});
const loose = (st: State) => st.todos.filter((t) => t.workId === '');

test('thêm được việc lẻ không cần project, và nó chỉ thuộc đúng ngày đã chọn', () => {
  const st = GG.addTodo(GG.emptyState(), { workId: '', text: '  Mua sữa ', date: D2 });
  expect(st.todos).toHaveLength(1);
  expect(st.todos[0]).toMatchObject({ workId: '', text: 'Mua sữa', date: D2, done: false });
  expect(GG.todosOn(st, D2)).toHaveLength(1);
  expect(GG.todosOn(st, GG.addDays(D2, 1))).toEqual([]);        // không lặp lại sang ngày sau
  expect(GG.addTodo(st, { workId: 'khong-co', text: 'x', date: D2 })).toBe(st);
});

test('việc lẻ tính vào việc của ngày: xong hết mới trồng được cây', () => {
  let st = GG.addTodo(seed(), { workId: '', text: 'Mua sữa', date: D2 });
  st = GG.toggleTodo(st, 'a', 'x');
  expect(GG.canPlant(st, D2, D2)).toMatchObject({ ok: false, remaining: 1 });
  st = GG.toggleTodo(st, loose(st)[0].id, 'x');
  expect(GG.canPlant(st, D2, D2).ok).toBe(true);
});

test('việc lẻ trễ thì hiện ở việc trễ và mang sang hôm nay được; sửa, xóa như việc thường', () => {
  let st = GG.addTodo(seed(), { workId: '', text: 'Mua sữa', date: D1 });
  const id = loose(st)[0].id;
  expect(GG.overdue(st, D2).map((t) => t.id)).toEqual([id]);
  st = GG.carryOver(st, [id], D2);
  expect(loose(st)[0].date).toBe(D2);
  st = GG.updateTodo(st, id, { text: 'Mua trà', workId: '' });
  expect(loose(st)[0].text).toBe('Mua trà');
  expect(GG.deleteTodo(st, id).todos).toHaveLength(1);
});

test('xóa project không đụng tới việc lẻ', () => {
  const st = GG.deleteProject(GG.addTodo(seed(), { workId: '', text: 'Mua sữa', date: D2 }), 'p1');
  expect(st.todos.map((t) => t.text)).toEqual(['Mua sữa']);
});

test('pomodoro cộng dồn cho đúng việc', () => {
  let st = GG.addTodo(seed(), { workId: '', text: 'Mua sữa', date: D2 });
  const id = loose(st)[0].id;
  st = GG.addPomo(GG.addPomo(GG.addPomo(st, id), id), 'a');
  expect(st.todos.map((t) => t.pomos || 0)).toEqual([1, 2]);
  expect(GG.addPomo(st, 'khong-co')).toBe(st);
});

test('xuất rồi nhập lại, và đi qua các dòng Supabase, vẫn giữ việc lẻ và số pomodoro', () => {
  let st = GG.addTodo(seed(), { workId: '', text: 'Mua sữa', date: D2 });
  st = GG.addPomo(st, loose(st)[0].id);
  const r = GG.validateImport(JSON.parse(JSON.stringify(GG.exportData(st, 'now'))));
  expect(r.ok && r.state).toEqual(st);
  expect(fromRows(toRows(st))).toEqual(st);
  const row = toRows(st).todos[1];
  expect(row).toMatchObject({ work_id: null, pomos: 1, text: 'Mua sữa' });
  expect(diff(seed(), st).todos.upsert.map((t) => t.work_id)).toEqual([null]);
});
