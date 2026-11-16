import test from 'node:test'; import assert from 'node:assert/strict';
import GG from '../src/logic.js';
const T = (id, date, done) => ({ id, workId: 'w1', text: id, date, done, doneAt: done ? date + 'T08:00:00+07:00' : null });
const base = (todos, days = {}) => ({ projects: [{ id: 'p1', name: 'P', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'W', order: 1 }] }], todos, days });
test('ngày', () => {
  assert.equal(GG.todayStr(new Date(2026, 10, 14, 23, 59)), '2026-11-14');
  assert.equal(GG.addDays('2026-11-30', 1), '2026-12-01');
  assert.deepEqual(GG.weekOf('2026-11-14'), ['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-15']);
  assert.equal(GG.daysInMonth('2028-02'), 29);
  assert.equal(GG.shiftMonth('2026-01', -1), '2025-12');
  assert.equal(GG.shiftMonth('2026-12', 1), '2027-01');
});
test('cấp của cây', () => {
  assert.deepEqual([[0,4],[1,4],[24,4],[25,4],[50,4],[74,4],[75,4],[99,4],[100,4],[0,0]].map(a => GG.stageFor(...a)), [0,1,1,2,3,3,4,4,5,0]);
  assert.deepEqual(GG.dayProgress(base([T('a','2026-11-14',true),T('b','2026-11-14',false),T('c','2026-11-14',false)]), '2026-11-14'), { total: 3, done: 1, pct: 33 });
});
test('điều kiện trồng', () => {
  const d = '2026-11-14', s = base([T('a', d, true), T('b', d, false)]);
  assert.deepEqual(GG.canPlant(s, d, d), { ok: false, reason: 'remaining', remaining: 1 });
  assert.equal(GG.canPlant(base([]), d, d).reason, 'no-todos');
  const all = base([T('a', d, true)]);
  assert.equal(GG.canPlant(all, d, d).ok, true);
  assert.equal(GG.canPlant(all, d, '2026-11-15').reason, 'past');
  assert.equal(GG.canPlant(all, '2026-11-16', '2026-11-15').reason, 'future');
  const p = GG.plant(all, d, d);
  assert.deepEqual(p.days[d], { kind: 'tron', planted: true });
  assert.equal(GG.canPlant(p, d, d).reason, 'planted');
  assert.equal(all.days[d], undefined);
  assert.equal(GG.plant(s, d, d), s);
});
test('loại cây mặc định và chuỗi ngày', () => {
  const s = base([], { '2026-11-11': { kind: 'sen', planted: true }, '2026-11-12': { kind: 'mai', planted: true }, '2026-11-13': { kind: 'tre', planted: true }, '2026-11-14': { mood: 3 } });
  assert.equal(GG.kindFor(s, '2026-11-14'), 'tre');
  assert.equal(GG.kindFor(base([]), '2026-11-14'), 'tron');
  assert.equal(GG.streak(s, '2026-11-14'), 3);
  assert.equal(GG.streak(s, '2026-11-15'), 0);
  const days = GG.monthDays(s, '2026-11');
  assert.equal(days.length, 30); assert.equal(days[10], 'sen'); assert.equal(days[13], null);
  assert.deepEqual(GG.monthMoods(s, '2026-11'), [3]);
});
