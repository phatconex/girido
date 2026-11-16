# Giri Garden App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng app todolist Giri Garden thành một trang artifact: việc theo project, mỗi ngày xong hết việc thì trồng một cây vào khu đất tháng, có lọ cảm xúc, tự lưu vào kho `db` và xuất, nhập JSON.

**Architecture:** Mã nguồn tách thành nhiều file nhỏ trong `app/src/`, một script build ghép chúng cùng `bundle.css`, `bundle.js` của design system và khối biến màu sinh từ `tokens.json` thành một file HTML duy nhất. Mọi phép tính nằm trong `logic.js` là hàm thuần, không đụng DOM, kiểm thử bằng Node. `store.js` bọc kho `db` của artifact và tự lùi về bộ nhớ khi kho không dùng được. Các màn hình chỉ đọc state và gọi hàm trong `logic.js` qua `store.apply`.

**Tech Stack:** HTML, CSS, JavaScript thuần (không framework, không thư viện ngoài). Node 24 cho build và `node --test`. Khả năng artifact: `db`, `downloads`.

**Spec:** `docs/giri-garden-design.md`. Người thực hiện đọc cả hai.

## Global Constraints

- Một file HTML đầu ra: `app/dist/giri-garden.html`. Không có `<!doctype>`, `<html>`, `<head>`, `<body>`; mở đầu bằng `<title>Giri Garden</title>`, `<meta name="claude:viewport-fit-sides" content="cover">`, thẻ `<link>` phông, rồi `<style>`.
- Chỉ tải ngoài: `https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap`. Dòng `@import` ở đầu `bundle.css` phải bị bỏ khi nhúng và thay bằng thẻ `<link>` đó.
- Không viết lại component đã có trong `giri-design-system/project/components/bundle.css` và `bundle.js`. Đọc `components/<Tên>/README.md` và `preview.html` trước khi dùng một component.
- Biến màu sinh từ `tokens.json` theo ba khối: `:root{…sáng…}`, `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){…tối…;color-scheme:dark}}`, `:root[data-theme="dark"]{…tối…;color-scheme:dark}`. Token có `value` là chuỗi thì dùng chung cho cả hai chế độ. Thêm `--font-display`, `--font-body` từ `type.families` và mọi token của `spacing`, `radius`, `shadow`, `duration`, `easing`.
- `body` có `background: var(--bg)`. Lề ngang `padding-left: max(16px, env(safe-area-inset-left, 0px))` và tương tự bên phải trên một lớp bọc ngoài cùng. Trang không cuộn ngang ở chiều rộng 400px.
- Toàn bộ chữ giao diện là tiếng Việt, xưng "mình" (Giri), gọi "bạn". Không emoji. Nút ghi đúng hành động.
- Không dùng `alert`, `confirm`, `prompt`, `<a download>`, `window.print`. Xác nhận vẽ trong trang.
- Nội dung người dùng nhập luôn đưa vào DOM bằng `textContent`, không bằng `innerHTML`.
- Mọi ô nhập và nút có `id` ổn định. Tôn trọng `prefers-reduced-motion` (lớp `.gg` của bundle đã lo cho phần bên trong nó; gốc app phải mang lớp `gg`).
- Ngày là chuỗi `YYYY-MM-DD` theo giờ máy. Khóa tháng là `YYYY-MM`.
- Thư mục làm việc không phải kho git, nên kế hoạch không có bước commit.
- Chạy kiểm thử: `node --test app/test/` từ thư mục gốc của phiên làm việc (thư mục chứa `app/`, `docs/`, `giri-design-system/`).

## Review Focus

1. File JSON nhập vào có việc trỏ tới công việc không tồn tại, ngày sai dạng, `mood` ngoài 1 đến 5, hoặc `kind` lạ: phải từ chối cả file với thông báo nói rõ lỗi đầu tiên, dữ liệu hiện tại không đổi. (Task 4)
2. Kho `db` trả `null`, hoặc một lần ghi bị từ chối (`quota_exceeded`, `unavailable`): app vẫn chạy bằng bộ nhớ, hiện dải "Chưa lưu được", xuất JSON vẫn dùng được, và lần ghi sau thành công thì dải biến mất. (Task 5)
3. Trang mở qua nửa đêm: "hôm nay" phải đổi theo, nút trồng không được trồng vào ngày hôm qua. (Task 7)
4. Xóa project hoặc công việc có việc thuộc ngày đã trồng: cây vẫn còn, phần trăm của ngày tính lại từ các việc còn lại, không lỗi khi ngày đó hết việc. (Task 3)
5. Nội dung việc rất dài hoặc chứa ký tự HTML như `<b>`: hiện nguyên văn, tự xuống dòng, không làm trang cuộn ngang. (Task 7)

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `app/build.mjs` | Ghép mọi thứ thành `app/dist/giri-garden.html`; xuất `buildTokensCss(tokens)` và `build()` |
| `app/src/logic.js` | Hàm thuần trên state; gắn vào `globalThis.GG` và `module.exports` |
| `app/src/store.js` | Bọc kho `db`, lùi về bộ nhớ; `GGStore.create(...)` |
| `app/src/shell.js` | Khung app: định tuyến theo `#hash`, thanh điều hướng, hộp xác nhận, thông báo, dải trạng thái lưu, chế độ sáng tối |
| `app/src/screen-today.js` | Màn hình Hôm nay và bảng chọn cây |
| `app/src/screen-projects.js` | Danh sách project, một project, một công việc |
| `app/src/screen-garden.js` | Khu đất tháng và khu vườn lớn |
| `app/src/screen-mood.js` | Lọ cảm xúc |
| `app/src/screen-settings.js` | Xuất, nhập JSON, chế độ sáng tối |
| `app/src/app.css` | Kiểu dáng riêng của app (tiền tố `ga-`), dựng từ token |
| `app/test/*.test.mjs` | Kiểm thử Node cho build, logic, store |

Dạng của `state` (dùng ở mọi task; trùng với file JSON xuất ra trừ ba khóa `app`, `version`, `exportedAt`):

```js
{ projects: [{ id, name, createdAt, works: [{ id, name, order }] }],
  todos: [{ id, workId, text, date, done, doneAt }],   // doneAt: chuỗi ISO hoặc null
  days: { "2026-11-14": { kind, planted, mood } } }    // mỗi khóa có thể thiếu
```

Mọi hàm đổi state trả về state mới, không sửa state cũ.

---

### Task 1: Build và khối biến màu

**Files:**
- Create: `app/build.mjs`, `app/src/logic.js` (rỗng: chỉ `globalThis.GG = {}`), `app/src/app.css` (rỗng), `app/src/shell.js` (chỉ gắn một `div#app.gg` ghi "Giri Garden")
- Test: `app/test/build.test.mjs`

**Interfaces:**
- Produces: `buildTokensCss(tokens: object): string`; `build(): Promise<string>` (ghi file và trả về nội dung). Thứ tự ghép script: `bundle.js`, `logic.js`, `store.js`, `shell.js`, `screen-*.js` (theo tên), cuối cùng dòng `GGShell.start()`. File nguồn nào chưa tồn tại thì bỏ qua.

- [ ] **Step 1: Viết kiểm thử thất bại**

```js
import test from 'node:test'; import assert from 'node:assert/strict';
import { buildTokensCss, build } from '../build.mjs';
const tokens = { color: { tokens: [
  { name: 'bg', value: { light: '#f1f8fd', dark: '#0e1b2a' } }, { name: 'water-500', value: '#9dd2f8' } ] },
  type: { families: { display: '"Baloo 2", sans-serif' } },
  spacing: { tokens: [{ name: 'space-4', value: '16px' }] }, radius: { tokens: [] },
  shadow: { tokens: [{ name: 'press-water', value: { light: '0 4px 0 #3d8fd6', dark: '0 4px 0 #3a86c8' } }] },
  duration: { tokens: [] }, easing: { tokens: [] } };
test('ba khối theme', () => {
  const css = buildTokensCss(tokens);
  assert.match(css, /:root\{[^}]*--bg:#f1f8fd;[^}]*--water-500:#9dd2f8;[^}]*--space-4:16px;[^}]*--font-display:"Baloo 2", sans-serif;/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\)\{[^}]*--bg:#0e1b2a;[^}]*--press-water:0 4px 0 #3a86c8;[^}]*color-scheme:dark/);
  assert.match(css, /:root\[data-theme="dark"\]\{[^}]*--bg:#0e1b2a;/);
  assert.doesNotMatch(css.split('@media')[1], /--water-500/);   // token dùng chung không lặp lại trong khối tối
});
test('trang ghép đúng khung', async () => {
  const html = await build();
  assert.ok(html.startsWith('<title>Giri Garden</title>'));
  assert.doesNotMatch(html, /<!doctype|<html|<body|@import/i);
  assert.match(html, /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Baloo\+2/);
  assert.match(html, /claude:viewport-fit-sides/);
  assert.match(html, /window\.Giri = /);             // bundle.js đã nhúng
  assert.match(html, /\.gg-btn \{/);                 // bundle.css đã nhúng
  assert.doesNotMatch(html.replace(/<script>[\s\S]*?<\/script>/g, m => m.slice(8, -9)), /<\/script/i);
});
```

- [ ] **Step 2:** Chạy `node --test app/test/build.test.mjs`. Mong đợi: FAIL, không tìm thấy `../build.mjs`.
- [ ] **Step 3:** Viết `app/build.mjs` với hai hàm trên. Đường dẫn design system: `giri-design-system/project/` tính từ thư mục cha của `app/`. Thêm vào `<style>` dòng `body{margin:0;background:var(--bg)}`. Chạy trực tiếp `node app/build.mjs` thì gọi `build()` và in kích thước file.
- [ ] **Step 4:** Chạy lại kiểm thử. Mong đợi: PASS cả hai.

### Task 2: Logic ngày, tiến độ, trồng cây

**Files:**
- Modify: `app/src/logic.js`
- Test: `app/test/logic-day.test.mjs`

**Interfaces:**
- Produces (trên `GG`): `emptyState()`, `todayStr(d?: Date): string`, `addDays(date, n): string`, `weekOf(date): string[7]` (thứ Hai trước), `monthKey(date): string`, `daysInMonth(monthKey): number`, `todosOn(state, date): todo[]`, `dayProgress(state, date): {total, done, pct}` (`pct` nguyên, làm tròn xuống; 0 khi `total` là 0), `stageFor(pct, total): 0..5`, `kindFor(state, date): string`, `canPlant(state, date, today): {ok, reason, remaining}` với `reason` thuộc `'ok' | 'no-todos' | 'remaining' | 'planted' | 'past' | 'future'`, `plant(state, date, today): state`, `streak(state, today): number`, `monthDays(state, monthKey): (string|null)[]`, `monthMoods(state, monthKey): number[]`.

- [ ] **Step 1: Viết kiểm thử thất bại**

```js
import test from 'node:test'; import assert from 'node:assert/strict';
import GG from '../src/logic.js';
const T = (id, date, done) => ({ id, workId: 'w1', text: id, date, done, doneAt: done ? date + 'T08:00:00+07:00' : null });
const base = (todos, days = {}) => ({ projects: [{ id: 'p1', name: 'P', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'W', order: 1 }] }], todos, days });
test('ngày', () => {
  assert.equal(GG.todayStr(new Date(2026, 10, 14, 23, 59)), '2026-11-14');
  assert.equal(GG.addDays('2026-11-30', 1), '2026-12-01');
  assert.deepEqual(GG.weekOf('2026-11-14'), ['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-15']);
  assert.equal(GG.daysInMonth('2028-02'), 29);
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
  assert.equal(all.days[d], undefined);                         // state cũ không bị sửa
  assert.equal(GG.plant(s, d, d), s);                           // chưa đủ điều kiện thì trả lại nguyên state
});
test('loại cây mặc định và chuỗi ngày', () => {
  const s = base([], { '2026-11-11': { kind: 'sen', planted: true }, '2026-11-12': { kind: 'mai', planted: true }, '2026-11-13': { kind: 'tre', planted: true }, '2026-11-14': { mood: 3 } });
  assert.equal(GG.kindFor(s, '2026-11-14'), 'tre');             // loại của lần trồng gần nhất
  assert.equal(GG.kindFor(base([]), '2026-11-14'), 'tron');
  assert.equal(GG.streak(s, '2026-11-14'), 3);                  // hôm nay chưa trồng: tính đến hôm qua
  assert.equal(GG.streak(s, '2026-11-15'), 0);
  const days = GG.monthDays(s, '2026-11');
  assert.equal(days.length, 30); assert.equal(days[10], 'sen'); assert.equal(days[13], null);
  assert.deepEqual(GG.monthMoods(s, '2026-11'), [3]);
});
```

- [ ] **Step 2:** Chạy `node --test app/test/logic-day.test.mjs`. Mong đợi: FAIL, `GG.todayStr is not a function`.
- [ ] **Step 3:** Viết các hàm trên trong `app/src/logic.js`. File kết thúc bằng `globalThis.GG = GG; if (typeof module !== 'undefined') module.exports = GG;` để chạy được cả trong trình duyệt và Node.
- [ ] **Step 4:** Chạy lại. Mong đợi: PASS.

### Task 3: Logic thêm, sửa, xóa và việc trễ

**Files:**
- Modify: `app/src/logic.js`
- Test: `app/test/logic-crud.test.mjs`

**Interfaces:**
- Produces: `newId(prefix): string`; `addProject(state, name, today)`, `renameProject(state, id, name)`, `deleteProject(state, id)`; `addWork(state, projectId, name)` (`order` = lớn nhất + 1), `renameWork(state, id, name)`, `deleteWork(state, id)`; `addTodo(state, {workId, text, date})`, `updateTodo(state, id, patch)` (chỉ nhận `text`, `date`, `workId`), `toggleTodo(state, id, nowIso)`, `deleteTodo(state, id)`; `setKind(state, date, kind)`, `setMood(state, date, level)`; `overdue(state, today): todo[]` (xếp theo ngày tăng dần); `carryOver(state, ids, today)`; `workStats(state, workId): {total, done, status}` với `status` thuộc `'new' | 'now' | 'done'`; `projectStats(state, projectId): {total, done, pct}`; `findWork(state, workId): {project, work} | null`.
- Tên và nội dung được cắt khoảng trắng hai đầu; chuỗi rỗng sau khi cắt thì hàm trả lại nguyên state.

- [ ] **Step 1: Viết kiểm thử thất bại**

```js
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
  s = { ...s, days: { [d]: { kind: 'sen', planted: true } } };
  assert.equal(GG.setKind(s, d, 'mai'), s);
  s = GG.setMood(GG.setMood(s, d, 2), d, 5); assert.equal(s.days[d].mood, 5);
  assert.equal(GG.setMood(s, d, 6), s);
});
```

- [ ] **Step 2:** Chạy `node --test app/test/logic-crud.test.mjs`. Mong đợi: FAIL, `GG.addProject is not a function`.
- [ ] **Step 3:** Viết các hàm trên trong `app/src/logic.js`. `newId` dùng `crypto.randomUUID()` cắt 8 ký tự đầu, có tiền tố.
- [ ] **Step 4:** Chạy `node --test app/test/`. Mong đợi: PASS toàn bộ.

### Task 4: Xuất, nhập và chia theo tháng

**Files:**
- Modify: `app/src/logic.js`
- Test: `app/test/logic-io.test.mjs`

**Interfaces:**
- Produces: `KINDS: string[]` (19 khóa: `tron thong bach giot dua xuongrong bui tan tre sen huongduong mai dao phuong xoai cam chuoi dudu thanhlong`); `exportData(state, nowIso): object` (thêm `app: 'giri-garden'`, `version: 1`, `exportedAt`); `validateImport(obj): {ok: true, state, summary: {projects, works, todos, trees}} | {ok: false, error: string}`; `splitState(state): {projects: {projects}, months: {[monthKey]: {todos, days}}}`; `joinState(parts): state`.
- Thông báo lỗi của `validateImport` bằng tiếng Việt và nêu vị trí, ví dụ `Việc thứ 3 trỏ tới công việc "w9" không có trong file.`

- [ ] **Step 1: Viết kiểm thử thất bại**

```js
import test from 'node:test'; import assert from 'node:assert/strict';
import GG from '../src/logic.js';
const good = () => ({ app: 'giri-garden', version: 1, exportedAt: '2026-11-14T08:30:00+07:00',
  projects: [{ id: 'p1', name: 'Học IELTS', createdAt: '2026-11-01', works: [{ id: 'w1', name: 'Listening', order: 1 }] }],
  todos: [{ id: 't1', workId: 'w1', text: 'Nghe', date: '2026-11-14', done: true, doneAt: '2026-11-14T08:12:00+07:00' },
          { id: 't2', workId: 'w1', text: 'Đọc', date: '2026-12-01', done: false, doneAt: null }],
  days: { '2026-11-14': { kind: 'sen', planted: true, mood: 4 } } });
test('xuất rồi nhập lại ra đúng dữ liệu cũ', () => {
  const r = GG.validateImport(good()); assert.equal(r.ok, true);
  assert.deepEqual(r.summary, { projects: 1, works: 1, todos: 2, trees: 1 });
  const again = GG.validateImport(JSON.parse(JSON.stringify(GG.exportData(r.state, '2026-11-15T00:00:00+07:00'))));
  assert.deepEqual(again.state, r.state);
});
test('từ chối file hỏng', () => {
  const bad = (edit) => { const o = good(); edit(o); const r = GG.validateImport(o); assert.equal(r.ok, false); assert.equal(typeof r.error, 'string'); return r.error; };
  assert.equal(GG.validateImport(null).ok, false); assert.equal(GG.validateImport([]).ok, false);
  bad(o => { o.app = 'khac'; }); bad(o => { o.version = 2; });
  assert.match(bad(o => { o.todos[1].workId = 'w9'; }), /w9/);
  bad(o => { o.todos[0].date = '14/11/2026'; }); bad(o => { o.todos[0].date = '2026-02-31'; });
  bad(o => { o.todos[1].id = 't1'; });                       // trùng id
  bad(o => { o.days['2026-11-14'].mood = 7; }); bad(o => { o.days['2026-11-14'].kind = 'hoa-la'; });
  bad(o => { o.days['hom-nay'] = {}; }); bad(o => { o.projects[0].name = ''; }); bad(o => { delete o.todos; });
});
test('chia theo tháng rồi ghép lại', () => {
  const s = GG.validateImport(good()).state, parts = GG.splitState(s);
  assert.deepEqual(Object.keys(parts.months).sort(), ['2026-11', '2026-12']);
  assert.equal(parts.months['2026-11'].todos.length, 1); assert.equal(parts.months['2026-12'].days['2026-11-14'], undefined);
  assert.deepEqual(GG.joinState(parts), s);
  assert.deepEqual(GG.joinState({ projects: null, months: {} }), GG.emptyState());
});
```

- [ ] **Step 2:** Chạy `node --test app/test/logic-io.test.mjs`. Mong đợi: FAIL, `GG.validateImport is not a function`.
- [ ] **Step 3:** Viết các hàm trên. `joinState` xếp `todos` theo khóa tháng rồi theo thứ tự trong tháng, để ghép lại ra đúng thứ tự cũ khi dữ liệu đã theo thứ tự ngày; kiểm thử dùng dữ liệu như vậy.
- [ ] **Step 4:** Chạy `node --test app/test/`. Mong đợi: PASS toàn bộ.

### Task 5: Kho dữ liệu

**Files:**
- Create: `app/src/store.js`
- Test: `app/test/store.test.mjs`

**Interfaces:**
- Consumes: `GG.splitState`, `GG.joinState`, `GG.emptyState`.
- Produces: `GGStore.create({ db, onChange, onStatus, delay = 300 })` trả về `{ ready: Promise<void>, state(), apply(fn: state => state): void, replaceAll(state): Promise<void>, retry(): void, flush(): Promise<void> }`. `db` là không gian `db` của artifact hoặc `null`.
- Bố cục trong kho: tài liệu `app/projects` có thân `{projects: [...]}`; mỗi tháng một tài liệu `months/<YYYY-MM>` có thân `{todos: [...], days: {...}}`.
- `onStatus(status)` với `status` thuộc `'saved' | 'saving' | 'error' | 'offline'`. `db` là `null` thì luôn `'offline'`.
- `apply` đổi state ngay, gọi `onChange(state)` ngay, rồi sau `delay` mili giây ghi bằng `set` những tài liệu có thân khác lần ghi trước (so bằng `JSON.stringify`); tháng không còn việc và không còn ngày nào thì `delete`. Ghi lỗi thì `'error'`, giữ danh sách cần ghi; `retry()` ghi lại.
- Đăng ký `onSnapshot` trên `app/projects` và trên `collection('months')`. Bản chụp có `metadata.hasPendingWrites` là `true`, hoặc đến trong lúc còn thay đổi chưa ghi, thì bỏ qua; ngoài ra thì ghép lại state và gọi `onChange`.

- [ ] **Step 1: Viết kiểm thử thất bại.** Trong file kiểm thử, viết một `fakeDb()` tối giản: giữ một `Map` đường dẫn sang thân; `doc(path)` có `get`, `set`, `delete`, `onSnapshot`; `collection('months')` có `get` và `onSnapshot` trả `{docs: [{id, exists: true, data()}]}`; có cờ `failNext` làm lần `set` kế tiếp bị từ chối với `{code: 'unavailable'}`; và `fakeDb.remote(path, body)` để giả một thay đổi từ máy khác (gọi các hàm nghe với `metadata.hasPendingWrites = false`). Các kiểm thử:

```js
test('tải state từ kho', async () => { /* nạp sẵn app/projects và months/2026-11; sau await store.ready: store.state() bằng GG.joinState của chúng; status cuối là 'saved' */ });
test('chỉ ghi tài liệu đã đổi', async () => { /* apply thêm một việc ngày 2026-11-14; await store.flush(); đúng một lần set, vào 'months/2026-11'; app/projects không bị ghi */ });
test('gộp nhiều thay đổi liên tiếp thành một lần ghi', async () => { /* ba lần apply liên tiếp vào cùng tháng; flush; một lần set */ });
test('ghi lỗi rồi thử lại', async () => { /* failNext = true; apply; flush; status 'error'; state vẫn có thay đổi; retry(); flush; status 'saved'; kho có dữ liệu */ });
test('không có kho', async () => { /* db: null; ready xong; status 'offline'; apply vẫn đổi state và gọi onChange */ });
test('thay đổi từ máy khác', async () => { /* fakeDb.remote('months/2026-11', thân mới); onChange được gọi với state mới */ });
test('replaceAll xóa tháng thừa', async () => { /* kho có 2026-10 và 2026-11; replaceAll(state chỉ có 2026-11); kho không còn months/2026-10 */ });
test('tháng rỗng bị xóa khỏi kho', async () => { /* xóa việc cuối cùng của 2026-12 khi tháng đó không có ngày nào; flush; có một lần delete 'months/2026-12' */ });
```

Mỗi kiểm thử trên viết thành mã chạy được với các `assert` cụ thể cho đúng điều ghi trong chú thích, dùng `delay: 0`.

- [ ] **Step 2:** Chạy `node --test app/test/store.test.mjs`. Mong đợi: FAIL, không tìm thấy `../src/store.js`.
- [ ] **Step 3:** Viết `app/src/store.js`, cuối file `globalThis.GGStore = GGStore; if (typeof module !== 'undefined') module.exports = GGStore;`. Trong Node, file tự `require('./logic.js')` khi `globalThis.GG` chưa có.
- [ ] **Step 4:** Chạy `node --test app/test/`. Mong đợi: PASS toàn bộ.

### Task 6: Khung app

**Files:**
- Modify: `app/src/shell.js`, `app/src/app.css`

**Interfaces:**
- Consumes: `GGStore.create`, `GG.todayStr`.
- Produces: `GGShell.start()`; `GGShell.register(name, { title, render(root, ctx), nav?: {label, order} })` với `ctx = { state, store, today, params, go(hash), confirm({title, body, yes, danger}): Promise<boolean>, toast(text), rerender() }`; `GGShell.go(hash)`. Mỗi `screen-*.js` tự đăng ký; `start()` chạy sau cùng.
- Định tuyến: `location.hash` dạng `#ten` hoặc `#ten-thamso` (ví dụ `#project-p1a2b3c4`, `#cong-viec-w1a2b3c4`, `#khu-vuon-2026-10`); phần sau tên đã đăng ký dài nhất là `params`. Không có hash thì `#hom-nay`.
- `start()`: lấy `db = await claude.use('db')` nếu có `window.claude`, ngược lại `null`; tạo store; vẽ lại màn hình hiện tại mỗi khi `onChange`; giữ `today` và cứ 30 giây cùng mỗi lần trang được lấy lại tiêu điểm thì tính lại, đổi ngày thì vẽ lại.
- Lớp CSS riêng: `ga-shell` (lớp bọc ngoài, rộng tối đa 480px trên điện thoại, 960px từ 900px trở lên, căn giữa), `ga-nav` (thanh dưới cố định, nền `sand-100`, cạnh trên `sand-500`, cộng `env(safe-area-inset-bottom)`), `ga-nav__item` (mục đang mở có nền `water-500`), `ga-dialog` (lớp phủ và một `gg-card` ở giữa, hai nút), `ga-toast`, `ga-status` (dải "Chưa lưu được" nền `ember-100`, chữ `ember-500`, có nút `gg-btn--ghost` "Thử lại").
- Chế độ sáng tối: đọc `localStorage['gg-theme']` (`'light' | 'dark'` hoặc không có), bọc trong `try/catch`; đặt hoặc gỡ `data-theme` trên `document.documentElement`. Xuất `GGShell.setTheme(value | null)`.

- [ ] **Step 1:** Viết `shell.js` và `app.css` theo giao diện trên. Thêm một màn hình tạm `hom-nay` chỉ ghi ngày hôm nay để kiểm tra khung.
- [ ] **Step 2:** Chạy `node app/build.mjs && node --test app/test/`. Mong đợi: build xong, kiểm thử PASS.
- [ ] **Step 3: Kiểm tra trong trình duyệt.** Chạy `python3 -m http.server 8765 --directory app/dist` ở nền, mở `http://localhost:8765/giri-garden.html`. Mong đợi: thấy ngày hôm nay, thanh điều hướng dưới cùng, dải "Chưa lưu được" (vì không có kho), không có lỗi trong console. Gọi `GGShell.setTheme('dark')` trong console thì nền đổi sang tối. Thu hẹp còn 400px thì không cuộn ngang.

### Task 7: Màn hình Hôm nay

**Files:**
- Create: `app/src/screen-today.js`
- Modify: `app/src/app.css`

**Interfaces:**
- Consumes: `GGShell.register`, `ctx`; `GG.weekOf`, `addDays`, `todosOn`, `dayProgress`, `stageFor`, `kindFor`, `canPlant`, `plant`, `overdue`, `carryOver`, `addTodo`, `updateTodo`, `toggleTodo`, `deleteTodo`, `setKind`, `findWork`, `streak`; `Giri.mascot`, `Giri.plant`, `Giri.rain`, `Giri.burst`, `Giri.kinds`, `Giri.groups`, `Giri.stages`.
- Produces: màn hình `hom-nay` (mục điều hướng "Hôm nay", thứ tự 1). `params` là một ngày thì chọn ngày đó, ngược lại chọn hôm nay.

Bố cục theo mục 6.1 của spec, từ trên xuống: cảnh rừng `gg-forest` chứa ngày, nút bánh răng tới `#cai-dat`, `gg-talk` (Giri và bong bóng có `gg-tag` "Giri"), cây của ngày đang chọn trong `gg-plantbox`; `gg-days` kèm hai nút lùi và tiến tuần; một `gg-card` có tên loại cây, tên cấp, phần trăm, `gg-progress--lg` và nút `gg-btn--ghost` "Đổi cây" (chỉ khi ngày đang chọn là hôm nay và chưa trồng); dải "Việc trễ" (chỉ khi `overdue` khác rỗng và đang chọn hôm nay) với từng việc tick được, nút "Mang sang hôm nay" cho từng việc và "Mang tất cả sang"; danh sách `gg-todo` của ngày, mỗi dòng có chip tên project; hàng thêm việc `gg-addrow` gồm ô nhập, ô chọn công việc và nút cộng; nút trồng `gg-btn--leaf gg-btn--lg`.

Các điểm đã chốt:
- Giri: `sad` khi có việc trễ; `sleepy` khi ngày đang chọn không có việc; `cheer` trong 2 giây sau mỗi lần tick và khi ngày đã đủ điều kiện trồng; `munch` trong lúc mưa rơi; còn lại `happy`.
- Tick: gọi `Giri.burst(ô tick, 'drops')`; nếu là việc của ngày đang chọn thì `Giri.rain(khung cây)`, sau 520ms vẽ lại cây, thêm lớp `is-grown` khi cấp tăng. Hiệu ứng không chặn lần tick kế tiếp.
- Dấu trên `gg-day`: `is-done` khi ngày đó đã trồng cây.
- Chữ trên nút trồng theo `canPlant(...).reason`: `ok` "Trồng vào khu đất"; `remaining` "Còn N việc nữa" (khóa); `no-todos` "Thêm việc để trồng cây" (khóa); `planted` "Đã trồng hôm nay" (khóa); `past` dòng chữ "Ngày này đã qua" hoặc "Đã trồng" thay cho nút; `future` dòng chữ "Chưa tới ngày".
- Bấm trồng: `store.apply(s => GG.plant(s, today, today))`, rồi `ctx.go('#khu-vuon')` kèm tham số báo ngày vừa trồng (đặt `sessionStorage['gg-fresh'] = today`, bọc `try/catch`; Task 9 đọc và xóa).
- Ô chọn công việc là `<select>` có `<optgroup>` theo project; nhớ lựa chọn gần nhất trong `localStorage['gg-last-work']`. Chưa có công việc nào thì thay hàng thêm việc bằng nút "Tạo project đầu tiên" tới `#project`.
- Chạm vào chữ của một việc mở `ga-dialog` sửa: ô nội dung, ô ngày (`<input type="date">`), nút "Lưu" và nút `gg-btn--clay` "Xóa việc".
- Bảng chọn cây là một `ga-dialog` chứa `gg-tabs` ba nhóm và `gg-seeds` theo `components/SeedPicker/README.md`; nút xác nhận ghi "Trồng " + tên loại viết thường; bấm thì `setKind` rồi đóng.
- Lần đầu mở app (không có project): bong bóng của Giri chào và giới thiệu một câu, khu vực danh sách chỉ có nút "Tạo project đầu tiên".

- [ ] **Step 1:** Viết `screen-today.js` và phần CSS cần thêm (`ga-late`, `ga-add`, `ga-edit`).
- [ ] **Step 2:** Chạy `node app/build.mjs && node --test app/test/`. Mong đợi: PASS.
- [ ] **Step 3: Kiểm tra trong trình duyệt** (chế độ bộ nhớ). Trong console tạo dữ liệu: một project, một công việc, ba việc hôm nay, một việc hôm qua chưa xong, một việc có nội dung `<b>` + 300 ký tự liền nhau. Mong đợi: Giri buồn và có dải việc trễ; việc dài hiện nguyên văn `<b>`, tự xuống dòng, trang không cuộn ngang ở 400px; tick từng việc thì cây lên cấp theo ngưỡng 25, 50, 75, 100; nút trồng đổi chữ đúng theo bảng trên; chọn hôm qua thì nút trồng thành dòng "Ngày này đã qua".
- [ ] **Step 4: Kiểm tra qua nửa đêm.** Trong console đổi `Date` giả sang ngày mai rồi phát sự kiện `focus` trên `window`. Mong đợi: tiêu đề ngày và ô `is-today` đổi sang ngày mai, việc chưa xong của hôm nay chuyển vào dải việc trễ, nút trồng tính theo ngày mới.

### Task 8: Màn hình Project

**Files:**
- Create: `app/src/screen-projects.js`
- Modify: `app/src/app.css`

**Interfaces:**
- Consumes: `GG.addProject`, `renameProject`, `deleteProject`, `addWork`, `renameWork`, `deleteWork`, `addTodo`, `toggleTodo`, `projectStats`, `workStats`, `findWork`.
- Produces: hai tên màn hình cho ba chế độ xem: `project` (mục điều hướng "Project", thứ tự 2; không tham số là danh sách, có tham số là một project) và `cong-viec` (tham số là id công việc).

- Danh sách: mỗi project một `gg-card` bấm được, có `gg-title`, chip "N việc còn lại", `gg-progress--leaf` theo `projectStats`. Cuối danh sách là `gg-addrow` với ô nhập có placeholder "Project mới của bạn tên gì?" và nút cộng. Chưa có project thì Giri (`sleepy`) kèm bong bóng mời tạo.
- Một project: đầu trang có nút quay lại và tên; `gg-works` theo `components/WorkRow/README.md` với `gg-work__meta` ghi "4 / 9 việc", lớp `is-done` hoặc `is-now` theo `workStats(...).status`; `gg-addrow` thêm công việc; hai nút `gg-btn--ghost` "Đổi tên" và `gg-btn--clay` "Xóa project".
- Một công việc: đầu trang có nút quay lại về project của nó; các việc gom theo ngày, ngày mới nhất trước, mỗi nhóm có `gg-label` ghi ngày dạng "Thứ Bảy, 14/11"; `gg-addrow` gồm ô nội dung, ô ngày (mặc định hôm nay) và nút cộng; "Đổi tên", "Xóa công việc".
- Xóa hỏi qua `ctx.confirm` với thân ghi rõ số việc sẽ mất, ví dụ "Xóa project này cùng 12 việc bên trong? Cây đã trồng vẫn còn." và `danger: true`.
- Id trong hash không còn tồn tại thì quay về danh sách.

- [ ] **Step 1:** Viết `screen-projects.js` và CSS cần thêm (`ga-head` cho đầu trang có nút quay lại).
- [ ] **Step 2:** Chạy `node app/build.mjs && node --test app/test/`. Mong đợi: PASS.
- [ ] **Step 3: Kiểm tra trong trình duyệt.** Tạo một project, hai công việc, vài việc ở hai ngày khác nhau; tick hết việc của một công việc. Mong đợi: thẻ của công việc đó ghi "Xong", công việc kia "Đang làm" hoặc không có thẻ; thanh phần trăm của project đúng; xóa công việc hiện hộp xác nhận với đúng số việc; mở `#project-khongco` thì về danh sách.

### Task 9: Màn hình Khu vườn

**Files:**
- Create: `app/src/screen-garden.js`
- Modify: `giri-design-system/project/components/bundle.js` (hàm `trail`), `giri-design-system/project/components/GardenTrail/README.md`

**Interfaces:**
- Consumes: `GG.monthDays`, `monthKey`, `streak`, `daysInMonth`; `Giri.plot(days, {today, fresh, size})`, `Giri.trail(months, {per, size})`, `Giri.burst`.
- Produces: màn hình `khu-vuon` (mục "Khu vườn", thứ tự 3; tham số là khóa tháng, mặc định tháng của hôm nay) và `khu-vuon-lon`.
- Sửa bundle: trong `trail`, mỗi phần tử `months` nhận thêm khóa tùy chọn `key`; tấm biển thành `<button class="gg-sign" data-month="KEY">` khi có `key`, giữ `<span>` khi không có. Thêm vào `bundle.css` ngay sau luật `.gg-sign`: `button.gg-sign { border: 0; cursor: pointer; }`.

- Khu đất tháng: nền `gg-forest`; hàng trên gồm nút lùi tháng, `gg-display` "Tháng 11" (năm khác năm nay thì "Tháng 11, 2025"), nút tiến tháng (khóa ở tháng hiện tại); `Giri.plot` rộng theo khung, `today` chỉ truyền khi đang xem tháng hiện tại; một `gg-card` ghi "13 / 30 cây trong tháng", chip `gg-chip--sun` "Chuỗi N ngày" (ẩn khi N là 0), `gg-progress--leaf`, và nút `gg-btn--ghost` "Khu vườn lớn".
- Đọc `sessionStorage['gg-fresh']`: nếu là một ngày thuộc tháng đang xem thì truyền làm `fresh`, gọi `Giri.burst(cây .is-new, 'confetti')`, rồi xóa khóa.
- Chạm `g.gg-pl-tree` hoặc `.gg-pl-slot` có `data-day`: tới `#hom-nay-<ngày đó>`.
- Khu vườn lớn: mọi tháng có ít nhất một cây, mới nhất trước, `name` là "Tháng 11" hoặc "Tháng 11, 2025", `key` là khóa tháng; chip tổng số cây. Chạm biển tới `#khu-vuon-<khóa tháng>`. Chưa có cây nào thì Giri kèm bong bóng "Xong hết việc hôm nay là có cây đầu tiên."

- [ ] **Step 1:** Sửa `trail` trong bundle và README của GardenTrail (thêm một dòng mô tả `key` và `data-month`).
- [ ] **Step 2:** Viết `screen-garden.js`.
- [ ] **Step 3:** Chạy `node app/build.mjs && node --test app/test/`. Mong đợi: PASS.
- [ ] **Step 4: Kiểm tra trong trình duyệt.** Từ màn hình Hôm nay tick hết việc rồi bấm trồng. Mong đợi: chuyển sang Khu vườn, cây nảy lên ở ô của hôm nay kèm confetti, số cây tăng một; tải lại trang thì cây không nảy lại; lùi một tháng thì nút tiến bật; chạm một ô đất thì về Hôm nay với ngày đó; khu vườn lớn có biển tháng bấm được.

### Task 10: Màn hình Cảm xúc

**Files:**
- Create: `app/src/screen-mood.js`

**Interfaces:**
- Consumes: `GG.monthMoods`, `setMood`, `monthKey`; `Giri.jarLive(el, levels, size)` trả về `{add, setLast, count}`; `Giri.orb`, `Giri.feelings`.
- Produces: màn hình `cam-xuc` (mục "Cảm xúc", thứ tự 4; tham số là khóa tháng).

- Bố cục theo `components/MoodJar/README.md`: hàng tên tháng với nút lùi, tiến; lọ; một `gg-card` có `gg-label` "Hôm nay bạn thấy thế nào?", chip "Tháng 11 · N viên", và `gg-moods`.
- Hàng chọn chỉ hiện khi đang xem tháng hiện tại. Mức của hôm nay (nếu có) mang `aria-pressed="true"`.
- Chọn một mức: hôm nay chưa có thì `jar.add(level)`, đã có thì `jar.setLast(level)`; rồi `store.apply(s => GG.setMood(s, today, level))`. Màn hình này không dựng lại lọ khi state đổi do chính lần chọn đó (giữ tham chiếu `jar`, chỉ dựng lại khi đổi tháng hoặc khi số viên trong state khác `jar.count()`), để hạt đang rơi không bị ngắt.
- Viên của hôm nay phải là viên cuối trong mảng truyền cho `jarLive`; `monthMoods` trả theo thứ tự ngày nên điều này đúng khi không có ngày nào sau hôm nay.

- [ ] **Step 1:** Viết `screen-mood.js`.
- [ ] **Step 2:** Chạy `node app/build.mjs && node --test app/test/`. Mong đợi: PASS.
- [ ] **Step 3: Kiểm tra trong trình duyệt.** Chọn "Tốt". Mong đợi: nắp mở, một viên rơi vào và lăn, chip ghi 1 viên. Chọn "Tuyệt". Mong đợi: viên đó đổi mặt và nảy lên, vẫn 1 viên. Lùi một tháng: hàng chọn ẩn, lọ trống.

### Task 11: Cài đặt, xuất và nhập JSON

**Files:**
- Create: `app/src/screen-settings.js`

**Interfaces:**
- Consumes: `GG.exportData`, `validateImport`, `todayStr`; `store.replaceAll`; `GGShell.setTheme`; `claude.use('downloads')` trả về `{save({filename, data})}` hoặc `null`.
- Produces: màn hình `cai-dat` (không có mục điều hướng; có nút quay lại về `#hom-nay`).

- Ba `gg-card--panel`, mỗi cái một `gg-tag`: "Sao lưu", "Khôi phục", "Giao diện".
- Sao lưu: nút "Xuất JSON" gọi `downloads.save({ filename: 'giri-garden-' + today + '.json', data: JSON.stringify(exportData(state, new Date().toISOString()), null, 2) })`. Thành công thì toast "Đã xuất file". Bị từ chối với `code === 'declined'` thì không báo gì; mã khác thì toast "Chưa xuất được file. Thử lại sau nhé." Khi `downloads` là `null` (mở ngoài claude.ai): thay nút bằng một `<textarea readonly>` chứa JSON và nút "Chép" dùng `navigator.clipboard.writeText` có bắt lỗi.
- Khôi phục: `<input type="file" accept="application/json,.json">`. Đọc bằng `file.text()`, `JSON.parse` trong `try/catch` (lỗi thì báo "File này không phải JSON hợp lệ."), rồi `validateImport`. Sai thì hiện `error` bằng chữ `ember-500` ngay dưới ô chọn file và không đổi gì. Đúng thì `ctx.confirm` với thân "File có N project, N công việc, N việc, N cây. Thay toàn bộ dữ liệu hiện tại?" và `danger: true`; đồng ý thì `await store.replaceAll(state)`, toast "Đã khôi phục dữ liệu", về `#hom-nay`.
- Giao diện: `gg-tabs` ba mục "Theo máy", "Sáng", "Tối" gọi `GGShell.setTheme(null | 'light' | 'dark')`.

- [ ] **Step 1:** Viết `screen-settings.js`.
- [ ] **Step 2:** Chạy `node app/build.mjs && node --test app/test/`. Mong đợi: PASS.
- [ ] **Step 3: Kiểm tra trong trình duyệt** (không có `downloads`). Mong đợi: thấy ô văn bản chứa JSON có `"app": "giri-garden"`. Lưu nội dung đó thành file, sửa một `workId` thành `w9`, nhập lại: thấy lỗi nhắc tới `w9`, dữ liệu không đổi. Nhập file gốc: hộp xác nhận có đúng các con số; đồng ý thì dữ liệu như cũ. Đổi "Tối" rồi tải lại trang: vẫn tối.

### Task 12: Xuất bản và kiểm tra trên trang thật

**Files:**
- Publish: `app/dist/giri-garden.html`; design system đã sửa ở Task 9.

- [ ] **Step 1:** Chạy `node --test app/test/ && node app/build.mjs`. Mong đợi: PASS và file đầu ra dưới 1 MB.
- [ ] **Step 2:** Xuất bản lại design system (các file đã đổi ở Task 9: `components/bundle.js`, `components/bundle.css`, `components/GardenTrail/README.md`, và `design-system.json` với `lastChange` mới) lên `https://claude.ai/artifact/1Sr4oRHY8xDqzfhZMg4uEU`.
- [ ] **Step 3:** Xuất bản `app/dist/giri-garden.html` thành artifact mới với `icon: "tree"`, `description` một câu, và `capabilities: { db: { rules: [{ path: "", read: "owner", write: "owner" }] }, downloads: true }`.
- [ ] **Step 4: Một lượt kiểm tra chức năng.** Dùng `ArtifactData` `list` trên `months` và `get` trên `app/projects`. Mong đợi: kho rỗng (app không tự tạo dữ liệu mẫu). Rồi `list` lại với `as_level` thấp hơn `owner`. Mong đợi: không thấy gì.
- [ ] **Step 5:** Báo cho người dùng đường link, một dòng về điều đã kiểm tra được và điều chưa (luồng tạo project, tick, trồng cây, xuất file trên trang thật cần chính người dùng thao tác vì chỉ họ ghi được vào kho).
