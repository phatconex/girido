// @ts-nocheck
import { test } from 'vitest'; import assert from 'node:assert/strict';
import GG from './logic.js';
const good = () => ({ app: 'giri-garden', version: 1, exportedAt: '2026-11-14T08:30:00+07:00',
  projects: [{ id: 'p1', name: 'Học IELTS', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'Listening', order: 1 }] }],
  todos: [{ id: 't1', workId: 'w1', text: 'Nghe', date: '2026-11-14', done: true, doneAt: '2026-11-14T08:12:00+07:00' },
          { id: 't2', workId: 'w1', text: 'Đọc', date: '2026-12-01', done: false, doneAt: null }],
  days: { '2026-11-14': { kind: 'sen', planted: true, mood: 4 } } });
test('xuất rồi nhập lại ra đúng dữ liệu cũ', () => {
  const r = GG.validateImport(good()); assert.equal(r.ok, true);
  assert.deepEqual(r.summary, { projects: 1, works: 1, todos: 2, trees: 1 });
  const out = GG.exportData(r.state, '2026-11-15T00:00:00+07:00');
  assert.equal(out.app, 'giri-garden'); assert.equal(out.version, 1); assert.equal(out.exportedAt, '2026-11-15T00:00:00+07:00');
  const again = GG.validateImport(JSON.parse(JSON.stringify(out)));
  assert.deepEqual(again.state, r.state);
});
test('từ chối file hỏng', () => {
  const bad = (edit) => { const o = good(); edit(o); const r = GG.validateImport(o); assert.equal(r.ok, false); assert.equal(typeof r.error, 'string'); return r.error; };
  assert.equal(GG.validateImport(null).ok, false); assert.equal(GG.validateImport([]).ok, false);
  bad(o => { o.app = 'khac'; }); bad(o => { o.version = 2; });
  assert.match(bad(o => { o.todos[1].workId = 'w9'; }), /w9/);
  bad(o => { o.todos[0].date = '14/11/2026'; }); bad(o => { o.todos[0].date = '2026-02-31'; });
  bad(o => { o.todos[1].id = 't1'; });
  bad(o => { o.days['2026-11-14'].mood = 7; }); bad(o => { o.days['2026-11-14'].kind = 'hoa-la'; });
  bad(o => { o.days['hom-nay'] = {}; }); bad(o => { o.projects[0].name = ''; }); bad(o => { delete o.todos; });
  bad(o => { o.todos[0].done = 'yes'; }); bad(o => { o.projects.push(o.projects[0]); });
});
test('chia theo tháng rồi ghép lại', () => {
  const s = GG.validateImport(good()).state, parts = GG.splitState(s);
  assert.deepEqual(Object.keys(parts.months).sort(), ['2026-11', '2026-12']);
  assert.equal(parts.months['2026-11'].todos.length, 1); assert.equal(parts.months['2026-12'].days['2026-11-14'], undefined);
  assert.deepEqual(GG.joinState(parts), s);
  assert.deepEqual(GG.joinState({ projects: null, months: {} }), GG.emptyState());
});
