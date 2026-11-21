import { test, expect } from 'vitest';
import GG from './logic';
import type { State } from './logic';
import { toRows, fromRows } from '../data/rows';

const D = '2026-11-21';
const seed = (): State => ({
  projects: [{ id: 'p1', name: 'Marketing', createdAt: D, works: [{ id: 'w1', name: 'W', order: 1 }] }],
  todos: [],
  days: {},
  notes: [],
});

test('việc trong project thêm được mà chưa hẹn ngày; việc lẻ thì bắt buộc có ngày', () => {
  let st = GG.addTodo(seed(), { workId: 'w1', text: 'Viết kế hoạch', date: '' });
  st = GG.addTodo(st, { workId: '', projectId: 'p1', text: 'Việc chung', date: '' });
  expect(st.todos.map((t) => t.date)).toEqual(['', '']);
  expect(GG.addTodo(st, { workId: '', text: 'Việc lẻ', date: '' })).toBe(st);
  expect(GG.addTodo(st, { workId: 'w1', text: 'x', date: 'sai' })).toBe(st);
});

test('việc chưa hẹn ngày không thuộc ngày nào, không bị coi là trễ, nhưng vẫn tính vào project', () => {
  const st = GG.addTodo(seed(), { workId: 'w1', text: 'Viết kế hoạch', date: '' });
  expect(GG.todosOn(st, D)).toEqual([]);
  expect(GG.dayProgress(st, D).total).toBe(0);
  expect(GG.overdue(st, '2099-01-01')).toEqual([]);
  expect(GG.projectStats(st, 'p1')).toEqual({ total: 1, done: 0, pct: 0 });
  expect(GG.workStats(st, 'w1').total).toBe(1);
});

test('đặt ngày sau, rồi bỏ ngày đi; việc lẻ không bỏ ngày được', () => {
  let st = GG.addTodo(seed(), { workId: 'w1', text: 'Viết kế hoạch', date: '' });
  const id = st.todos[0].id;
  st = GG.updateTodo(st, id, { date: D });
  expect(GG.todosOn(st, D)).toHaveLength(1);
  st = GG.updateTodo(st, id, { date: '' });
  expect(st.todos[0].date).toBe('');
  let loose = GG.addTodo(seed(), { workId: '', text: 'Lẻ', date: D });
  expect(GG.updateTodo(loose, loose.todos[0].id, { date: '' })).toBe(loose);
});

test('tick việc chưa hẹn ngày được, và không làm ảnh hưởng tới cây hôm nay', () => {
  let st = GG.addTodo(seed(), { workId: 'w1', text: 'Viết kế hoạch', date: '' });
  st = GG.toggleTodo(st, st.todos[0].id, 'x');
  expect(st.todos[0].done).toBe(true);
  expect(GG.canPlant(st, D, D).reason).toBe('no-todos');
});

test('đi qua xuất nhập và các dòng Supabase vẫn giữ "chưa hẹn ngày"', () => {
  const st = GG.addTodo(seed(), { workId: 'w1', text: 'Viết kế hoạch', date: '' });
  const r = GG.validateImport(JSON.parse(JSON.stringify(GG.exportData(st, 'now'))));
  expect(r.ok && r.state).toEqual(st);
  expect(toRows(st).todos[0].date).toBeNull();
  expect(fromRows(toRows(st))).toEqual(st);
  expect(GG.validateImport({ app: 'giri-garden', version: 1, projects: [], todos: [{ id: 't', workId: '', text: 'x', date: '', done: false }], days: {} }).ok).toBe(false);
});
