import { test, expect } from 'vitest';
import GG from '../lib/logic';
import type { State } from '../lib/logic';
import { diff, toRows, fromRows, isEmpty } from './rows';

const base = (): State => ({
  projects: [{ id: 'p1', name: 'P', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'W', order: 1 }, { id: 'w2', name: 'V', order: 2 }] }],
  todos: [
    { id: 'a', workId: 'w1', text: 'a', date: '2026-11-13', done: true, doneAt: '2026-11-13T01:00:00.000Z' },
    { id: 'b', workId: 'w1', text: 'b', date: '2026-11-14', done: false, doneAt: null },
    { id: 'c', workId: 'w2', text: 'c', date: '2026-11-14', done: false, doneAt: null },
  ],
  days: { '2026-11-13': { kind: 'sen', planted: true, mood: 4 }, '2026-11-14': { mood: 2 } },
});

test('state đi qua các dòng rồi quay về vẫn như cũ', () => {
  expect(fromRows(toRows(base()))).toEqual(base());
});

test('hai state giống nhau thì không có gì để ghi', () => {
  expect(isEmpty(diff(base(), base()))).toBe(true);
});

test('tick một việc chỉ ghi lại đúng việc đó', () => {
  const next = GG.toggleTodo(base(), 'b', '2026-11-14T02:00:00.000Z');
  const c = diff(base(), next);
  expect(c.todos.upsert.map((r) => r.id)).toEqual(['b']);
  expect(c.todos.upsert[0]).toMatchObject({ done: true, done_at: '2026-11-14T02:00:00.000Z', work_id: 'w1' });
  expect(c.todos.remove).toEqual([]);
  expect(isEmpty({ ...c, todos: { upsert: [], remove: [] } })).toBe(true);
});

test('xóa một việc không làm ghi lại các việc đứng sau', () => {
  const c = diff(base(), GG.deleteTodo(base(), 'a'));
  expect(c.todos.remove).toEqual(['a']);
  expect(c.todos.upsert).toEqual([]);
});

test('xóa project thì xóa cả công việc và việc bên trong', () => {
  const c = diff(base(), GG.deleteProject(base(), 'p1'));
  expect(c.projects.remove).toEqual(['p1']);
  expect(c.works.remove).toEqual(['w1', 'w2']);
  expect(c.todos.remove).toEqual(['a', 'b', 'c']);
});

test('thêm việc, đổi tên công việc, trồng cây và chọn cảm xúc', () => {
  let next = GG.addTodo(base(), { workId: 'w2', text: 'mới', date: '2026-11-14' });
  next = GG.renameWork(next, 'w2', 'Đổi tên');
  next = GG.setMood(next, '2026-11-15', 5);
  const c = diff(base(), next);
  expect(c.todos.upsert).toHaveLength(1);
  expect(c.todos.upsert[0]).toMatchObject({ text: 'mới', work_id: 'w2', pos: 3 });
  expect(c.works.upsert).toEqual([{ id: 'w2', project_id: 'p1', name: 'Đổi tên', sort: 2 }]);
  expect(c.days.upsert).toEqual([{ date: '2026-11-15', kind: null, planted: false, mood: 5 }]);
  expect(c.projects.upsert).toEqual([]);
});

test('việc trỏ tới công việc không còn thì bị bỏ khi đọc về', () => {
  const rows = toRows(base());
  rows.works = rows.works.filter((w) => w.id !== 'w2');
  expect(fromRows(rows).todos.map((t) => t.id)).toEqual(['a', 'b']);
});
