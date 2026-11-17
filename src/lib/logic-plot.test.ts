import { test, expect } from 'vitest';
import GG from './logic';
import type { State } from './logic';
import { toRows, fromRows } from '../data/rows';

const MK = '2026-11', D = MK + '-17';
const seed = (): State => ({
  projects: [],
  todos: [{ id: 'a', workId: '', text: 'a', date: D, done: true, doneAt: 'x' }],
  days: { [MK + '-03']: { kind: 'sen', planted: true }, [MK + '-05']: { kind: 'mai', planted: true }, [MK + '-09']: { mood: 3 } },
  notes: [],
});
const at = (st: State, slot: number) => GG.monthLayout(st, MK)[slot];

test('cây chưa nhớ ô thì đứng ở ô theo số ngày; ngày chưa trồng thì không có cây', () => {
  const cells = GG.monthLayout(seed(), MK);
  expect(cells).toHaveLength(36);
  expect(cells[2]).toEqual({ day: 3, kind: 'sen' });
  expect(cells[4]).toEqual({ day: 5, kind: 'mai' });
  expect(cells.filter(Boolean)).toHaveLength(2);
});

test('trồng cây hôm nay vào ô mình chọn', () => {
  const st = GG.plant(seed(), D, D, 30);
  expect(st.days[D]).toMatchObject({ planted: true, slot: 30 });
  expect(at(st, 30)).toMatchObject({ day: 17 });
  expect(at(st, 16)).toBeNull();                      // không còn nằm ở ô theo số ngày
});

test('chọn ô đã có cây hoặc ô ngoài khu đất thì app tự xếp chỗ', () => {
  for (const slot of [2, 99, -1, 1.5]) {
    const st = GG.plant(seed(), D, D, slot);
    expect(st.days[D].planted).toBe(true);
    expect(st.days[D].slot).toBeUndefined();
    expect(at(st, 16)).toMatchObject({ day: 17 });
  }
});

test('cây chọn đúng ô theo số ngày của một cây cũ thì cây cũ nhường sang ô trống đầu tiên', () => {
  const st = GG.plant(seed(), D, D, 2 + 2);          // ô số 4 đang là của ngày 5 → không trồng đè được
  expect(st.days[D].slot).toBeUndefined();
  let s2 = seed(); delete s2.days[MK + '-05'];
  s2 = GG.plant(s2, D, D, 4);
  s2 = { ...s2, days: { ...s2.days, [MK + '-05']: { kind: 'mai', planted: true } } };   // cây cũ không nhớ ô, ô theo ngày của nó đã bị chiếm
  expect(at(s2, 4)).toMatchObject({ day: 17 });
  expect(at(s2, 0)).toMatchObject({ day: 5 });
});

test('dời cây sang ô trống, và đổi chỗ hai cây', () => {
  let st = GG.moveTree(seed(), MK, 2, 20);
  expect(at(st, 20)).toMatchObject({ day: 3 });
  expect(at(st, 2)).toBeNull();
  st = GG.moveTree(st, MK, 20, 4);                   // ô 4 có cây ngày 5: đổi chỗ
  expect(at(st, 4)).toMatchObject({ day: 3 });
  expect(at(st, 20)).toMatchObject({ day: 5 });
  expect(GG.moveTree(st, MK, 10, 11)).toBe(st);       // ô không có cây
  expect(GG.moveTree(st, MK, 4, 4)).toBe(st);
  expect(GG.moveTree(st, MK, 4, 99)).toBe(st);
});

test('cây quay về chờ rồi trồng lại thì chọn chỗ mới được', () => {
  let st = GG.plant(seed(), D, D, 30);
  st = GG.settleToday(GG.toggleTodo(st, 'a', 'x'), D);
  expect(st.days[D].planted).toBe(false);
  st = GG.plant(GG.toggleTodo(st, 'a', 'x'), D, D, 12);
  expect(at(st, 12)).toMatchObject({ day: 17 });
  expect(at(st, 30)).toBeNull();
});

test('ô trồng cây đi qua xuất nhập và các dòng Supabase vẫn giữ nguyên; ô sai thì file bị từ chối', () => {
  const st = GG.plant(seed(), D, D, 30);
  const r = GG.validateImport(JSON.parse(JSON.stringify(GG.exportData(st, 'now'))));
  expect(r.ok && r.state).toEqual(st);
  expect(fromRows(toRows(st))).toEqual(st);
  expect(toRows(st).days.find((d) => d.date === D)).toMatchObject({ slot: 30 });
  expect(GG.validateImport({ app: 'giri-garden', version: 1, projects: [], todos: [], days: { [D]: { planted: true, slot: 40 } } }).ok).toBe(false);
});
