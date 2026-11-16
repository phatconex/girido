import { test, expect } from 'vitest';
import GG from '../lib/logic';
import type { State } from '../lib/logic';
import type { Repo } from './repo';
import { createStore } from './store';
import { createLocalRepo } from './localRepo';

const seed = (): State => ({
  projects: [{ id: 'p1', name: 'P', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'W', order: 1 }] }],
  todos: [{ id: 'a', workId: 'w1', text: 'a', date: '2026-11-13', done: false, doneAt: null }],
  days: {},
});
function fakeRepo(initial: State = seed()) {
  const repo = {
    kind: 'supabase' as const, kept: initial, saves: [] as [State, State][], failLoad: false, failSave: false, gate: null as Promise<void> | null,
    async load() { if (repo.failLoad) throw new Error('x'); return repo.kept; },
    async save(prev: State, next: State) {
      if (repo.gate) await repo.gate;
      if (repo.failSave) throw new Error('x');
      repo.saves.push([prev, next]); repo.kept = next;
    },
  };
  return repo satisfies Repo & Record<string, unknown>;
}
const add = (text: string) => (s: State) => GG.addTodo(s, { workId: 'w1', text, date: '2026-11-14' });

test('tải xong thì có dữ liệu và trạng thái đã lưu', async () => {
  const s = createStore(fakeRepo(), { delay: 0 });
  expect(s.get().status).toBe('loading');
  await s.ready;
  expect(s.state().todos).toHaveLength(1);
  expect(s.get().status).toBe('saved');
});

test('sửa thì lưu, và lần lưu sau tính từ bản đã lưu trước', async () => {
  const repo = fakeRepo(), s = createStore(repo, { delay: 0 });
  await s.ready;
  s.apply(add('b'));
  expect(s.get().status).toBe('saving');
  await s.flush();
  expect(s.get().status).toBe('saved');
  s.apply(add('c'));
  await s.flush();
  expect(repo.saves).toHaveLength(2);
  expect(repo.saves[1][0]).toBe(repo.saves[0][1]);
  expect(repo.kept.todos.map((t) => t.text)).toEqual(['a', 'b', 'c']);
});

test('hàm không đổi gì thì không lưu', async () => {
  const repo = fakeRepo(), s = createStore(repo, { delay: 0 });
  await s.ready;
  s.apply((x) => x);
  await s.flush();
  expect(repo.saves).toHaveLength(0);
});

test('lưu hỏng thì báo lỗi, thử lại thì ghi đủ', async () => {
  const repo = fakeRepo(), s = createStore(repo, { delay: 0 });
  await s.ready;
  repo.failSave = true;
  s.apply(add('b'));
  await s.flush();
  expect(s.get().status).toBe('error');
  s.apply(add('c'));
  await s.flush();
  repo.failSave = false;
  await s.retry();
  expect(s.get().status).toBe('saved');
  expect(repo.kept.todos.map((t) => t.text)).toEqual(['a', 'b', 'c']);
});

test('sửa trong lúc đang lưu thì lưu tiếp lần nữa', async () => {
  const repo = fakeRepo(), s = createStore(repo, { delay: 0 });
  await s.ready;
  let open!: () => void;
  repo.gate = new Promise<void>((r) => { open = r; });
  s.apply(add('b'));
  const first = s.flush();
  s.apply(add('c'));
  repo.gate = null; open();
  await first; await s.flush(); await new Promise((r) => setTimeout(r, 5)); await s.flush();
  expect(repo.kept.todos.map((t) => t.text)).toEqual(['a', 'b', 'c']);
  expect(s.get().status).toBe('saved');
});

test('tải hỏng thì không ghi đè lên kho; tải lại được thì lấy bản trong kho', async () => {
  const repo = fakeRepo();
  repo.failLoad = true;
  const s = createStore(repo, { delay: 0 });
  await s.ready;
  expect(s.get().status).toBe('load-error');
  s.apply((x) => GG.addProject(x, 'Mới', '2026-11-14'));
  await s.flush();
  expect(repo.saves).toHaveLength(0);
  repo.failLoad = false;
  await s.retry(); await new Promise((r) => setTimeout(r, 5)); await s.flush();
  expect(s.get().status).toBe('saved');
  expect(repo.saves).toHaveLength(0);
  expect(s.state().projects.map((p) => p.name)).toEqual(['P']);
});

test('refresh lấy thay đổi từ máy khác, nhưng không đè lên việc đang chờ lưu', async () => {
  const repo = fakeRepo(), s = createStore(repo, { delay: 50 });
  await s.ready;
  repo.kept = add('từ máy khác')(repo.kept);
  await s.refresh();
  expect(s.state().todos.map((t) => t.text)).toEqual(['a', 'từ máy khác']);
  s.apply(add('đang gõ'));
  repo.kept = GG.emptyState();
  await s.refresh();
  expect(s.state().todos.map((t) => t.text)).toEqual(['a', 'từ máy khác', 'đang gõ']);
  await s.flush();
});

test('thay toàn bộ dữ liệu trả về trạng thái sau khi lưu', async () => {
  const repo = fakeRepo(), s = createStore(repo, { delay: 0 });
  await s.ready;
  expect(await s.replaceAll(GG.emptyState())).toBe('saved');
  expect(repo.kept.todos).toEqual([]);
});

test('kho trên máy: lưu rồi mở lại vẫn còn', async () => {
  const mem = new Map<string, string>();
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  const s = createStore(createLocalRepo(storage), { delay: 0 });
  await s.ready;
  s.apply((x) => GG.addProject(x, 'Ở máy', '2026-11-14'));
  await s.flush();
  const again = createStore(createLocalRepo(storage), { delay: 0 });
  await again.ready;
  expect(again.state().projects.map((p) => p.name)).toEqual(['Ở máy']);
});

test('kho trên máy: dữ liệu hỏng thì báo lỗi tải chứ không xóa', async () => {
  const mem = new Map<string, string>([['girido-state-v1', '{"app":"khác"}']]);
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  const s = createStore(createLocalRepo(storage), { delay: 0 });
  await s.ready;
  expect(s.get().status).toBe('load-error');
  s.apply((x) => GG.addProject(x, 'x', '2026-11-14'));
  await s.flush();
  expect(mem.get('girido-state-v1')).toBe('{"app":"khác"}');
});
