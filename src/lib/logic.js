/* Giri Garden — mọi phép tính trên state. Hàm thuần: không đụng DOM, không sửa state cũ. */
const GG = {};
  var KINDS = ['tron', 'thong', 'bach', 'giot', 'dua', 'xuongrong', 'bui', 'tan', 'tre', 'sen', 'huongduong', 'mai', 'dao', 'phuong', 'xoai', 'cam', 'chuoi', 'dudu', 'thanhlong'];
  GG.KINDS = KINDS;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function clean(s) { return typeof s === 'string' ? s.trim() : ''; }
  function assign(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function withState(st, patch) { return assign(st, patch); }

  GG.emptyState = function () { return { projects: [], todos: [], days: {} }; };

  /* ---- ngày ---- */
  GG.todayStr = function (d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  GG.parseDate = parse;
  GG.isDate = function (s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && GG.todayStr(parse(s)) === s; };
  GG.addDays = function (s, n) { var d = parse(s); d.setDate(d.getDate() + n); return GG.todayStr(d); };
  GG.weekOf = function (s) { var dow = (parse(s).getDay() + 6) % 7, out = [], i; for (i = 0; i < 7; i++) out.push(GG.addDays(s, i - dow)); return out; };
  GG.monthKey = function (s) { return s.slice(0, 7); };
  GG.isMonthKey = function (s) { return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s); };
  GG.daysInMonth = function (mk) { var p = mk.split('-'); return new Date(+p[0], +p[1], 0).getDate(); };
  GG.shiftMonth = function (mk, n) { var p = mk.split('-'), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };

  /* ---- tiến độ của một ngày và cây ---- */
  GG.todosOn = function (st, date) { return st.todos.filter(function (t) { return t.date === date; }); };
  GG.dayProgress = function (st, date) {
    var list = GG.todosOn(st, date), done = list.filter(function (t) { return t.done; }).length;
    return { total: list.length, done: done, pct: list.length ? Math.floor(done * 100 / list.length) : 0 };
  };
  GG.stageFor = function (pct, total) {
    if (!total || pct <= 0) return 0;
    if (pct >= 100) return 5;
    if (pct >= 75) return 4;
    if (pct >= 50) return 3;
    if (pct >= 25) return 2;
    return 1;
  };
  GG.kindFor = function (st, date) {
    var d = st.days[date], best = null;
    if (d && d.kind) return d.kind;
    Object.keys(st.days).forEach(function (k) { var x = st.days[k]; if (x.planted && x.kind && k < date && (!best || k > best)) best = k; });
    return best ? st.days[best].kind : 'tron';
  };
  GG.canPlant = function (st, date, today) {
    var pr = GG.dayProgress(st, date), rem = pr.total - pr.done, d = st.days[date], r;
    if (d && d.planted) r = 'planted';
    else if (date < today) r = 'past';
    else if (date > today) r = 'future';
    else if (!pr.total) r = 'no-todos';
    else if (rem > 0) r = 'remaining';
    else r = 'ok';
    return { ok: r === 'ok', reason: r, remaining: rem };
  };
  function setDay(st, date, patch) { var days = assign(st.days, {}); days[date] = assign(st.days[date] || {}, patch); return withState(st, { days: days }); }
  GG.plant = function (st, date, today) {
    if (!GG.canPlant(st, date, today).ok) return st;
    return setDay(st, date, { kind: GG.kindFor(st, date), planted: true });
  };
  /* Hôm nay đã trồng mà vẫn còn việc chưa xong (vừa thêm việc, bỏ tick, hoặc mang việc trễ sang) thì cây quay về đang lớn.
     Ngày đã qua thì cây ở lại. Hôm nay không còn việc nào thì cây cũng ở lại. */
  GG.settleToday = function (st, today) {
    var d = st.days[today], pr;
    if (!d || !d.planted) return st;
    pr = GG.dayProgress(st, today);
    if (!pr.total || pr.done === pr.total) return st;
    return setDay(st, today, { planted: false });
  };
  GG.streak = function (st, today) {
    var planted = function (d) { return !!(st.days[d] && st.days[d].planted); };
    var d = planted(today) ? today : GG.addDays(today, -1), n = 0;
    while (planted(d)) { n++; d = GG.addDays(d, -1); }
    return n;
  };
  GG.monthDays = function (st, mk) {
    var out = [], n = GG.daysInMonth(mk), i, d;
    for (i = 1; i <= n; i++) { d = st.days[mk + '-' + pad(i)]; out.push(d && d.planted ? (d.kind || 'tron') : null); }
    return out;
  };
  GG.monthMoods = function (st, mk) {
    return Object.keys(st.days).filter(function (k) { return k.slice(0, 7) === mk && st.days[k].mood; }).sort().map(function (k) { return st.days[k].mood; });
  };
  GG.setKind = function (st, date, kind) {
    if (KINDS.indexOf(kind) < 0 || (st.days[date] && st.days[date].planted)) return st;
    return setDay(st, date, { kind: kind });
  };
  GG.setMood = function (st, date, level) {
    if (level !== Math.floor(level) || level < 1 || level > 5) return st;
    return setDay(st, date, { mood: level });
  };

  /* ---- project, công việc, việc ---- */
  GG.newId = function (prefix) { return prefix + globalThis.crypto.randomUUID().slice(0, 8); };
  GG.findWork = function (st, workId) {
    var i, j, p;
    for (i = 0; i < st.projects.length; i++) { p = st.projects[i]; for (j = 0; j < p.works.length; j++) if (p.works[j].id === workId) return { project: p, work: p.works[j] }; }
    return null;
  };
  function mapProject(st, id, fn) {
    var hit = false, projects = st.projects.map(function (p) { if (p.id !== id) return p; hit = true; return fn(p); });
    return hit ? withState(st, { projects: projects }) : st;
  }
  function dropTodosOfWorks(st, workIds) { return st.todos.filter(function (t) { return workIds.indexOf(t.workId) < 0; }); }
  GG.addProject = function (st, name, today) {
    name = clean(name); if (!name) return st;
    return withState(st, { projects: st.projects.concat([{ id: GG.newId('p'), name: name, createdAt: today, works: [] }]) });
  };
  GG.renameProject = function (st, id, name) { name = clean(name); if (!name) return st; return mapProject(st, id, function (p) { return assign(p, { name: name }); }); };
  GG.deleteProject = function (st, id) {
    var p = st.projects.filter(function (x) { return x.id === id; })[0]; if (!p) return st;
    return withState(st, { projects: st.projects.filter(function (x) { return x.id !== id; }), todos: dropTodosOfWorks(st, p.works.map(function (w) { return w.id; })) });
  };
  GG.addWork = function (st, projectId, name) {
    name = clean(name); if (!name) return st;
    return mapProject(st, projectId, function (p) {
      var order = p.works.reduce(function (m, w) { return Math.max(m, w.order); }, 0) + 1;
      return assign(p, { works: p.works.concat([{ id: GG.newId('w'), name: name, order: order }]) });
    });
  };
  GG.renameWork = function (st, id, name) {
    var f = GG.findWork(st, id); name = clean(name); if (!f || !name) return st;
    return mapProject(st, f.project.id, function (p) { return assign(p, { works: p.works.map(function (w) { return w.id === id ? assign(w, { name: name }) : w; }) }); });
  };
  GG.deleteWork = function (st, id) {
    var f = GG.findWork(st, id); if (!f) return st;
    var next = mapProject(st, f.project.id, function (p) { return assign(p, { works: p.works.filter(function (w) { return w.id !== id; }) }); });
    return withState(next, { todos: dropTodosOfWorks(st, [id]) });
  };
  /* Việc lẻ: việc không thuộc project nào, workId là chuỗi rỗng. Ngoài chuyện đó nó giống mọi việc khác:
     có ngày, tick được, trễ thì mang sang hôm nay được, và cũng tính vào việc của ngày. */
  GG.addTodo = function (st, t) {
    var text = clean(t && t.text);
    if (!t || !text || !GG.isDate(t.date) || (t.workId !== '' && !GG.findWork(st, t.workId))) return st;
    return withState(st, { todos: st.todos.concat([{ id: GG.newId('t'), workId: t.workId, text: text, date: t.date, done: false, doneAt: null }]) });
  };
  function mapTodo(st, id, fn) {
    var hit = false, todos = st.todos.map(function (t) { if (t.id !== id) return t; hit = true; return fn(t); });
    return hit ? withState(st, { todos: todos }) : st;
  }
  GG.updateTodo = function (st, id, patch) {
    var p = {};
    if ('text' in patch) { p.text = clean(patch.text); if (!p.text) return st; }
    if ('date' in patch) { if (!GG.isDate(patch.date)) return st; p.date = patch.date; }
    if ('workId' in patch) { if (patch.workId !== '' && !GG.findWork(st, patch.workId)) return st; p.workId = patch.workId; }
    return mapTodo(st, id, function (t) { return assign(t, p); });
  };
  GG.toggleTodo = function (st, id, nowIso) { return mapTodo(st, id, function (t) { return assign(t, { done: !t.done, doneAt: t.done ? null : nowIso }); }); };
  /* Ghi thêm một pomodoro đã xong cho một việc. */
  GG.addPomo = function (st, id) { return mapTodo(st, id, function (t) { return assign(t, { pomos: (t.pomos || 0) + 1 }); }); };
  GG.deleteTodo = function (st, id) { var todos = st.todos.filter(function (t) { return t.id !== id; }); return todos.length === st.todos.length ? st : withState(st, { todos: todos }); };
  GG.overdue = function (st, today) {
    return st.todos.filter(function (t) { return !t.done && t.date < today; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  };
  GG.carryOver = function (st, ids, today) {
    return withState(st, { todos: st.todos.map(function (t) { return ids.indexOf(t.id) >= 0 ? assign(t, { date: today }) : t; }) });
  };
  GG.workStats = function (st, workId) {
    var list = st.todos.filter(function (t) { return t.workId === workId; }), done = list.filter(function (t) { return t.done; }).length;
    return { total: list.length, done: done, status: list.length && done === list.length ? 'done' : done > 0 ? 'now' : 'new' };
  };
  GG.projectStats = function (st, projectId) {
    var p = st.projects.filter(function (x) { return x.id === projectId; })[0], ids = p ? p.works.map(function (w) { return w.id; }) : [];
    var list = st.todos.filter(function (t) { return ids.indexOf(t.workId) >= 0; }), done = list.filter(function (t) { return t.done; }).length;
    return { total: list.length, done: done, pct: list.length ? Math.floor(done * 100 / list.length) : 0 };
  };

  /* ---- xuất, nhập ---- */
  GG.exportData = function (st, nowIso) {
    var c = JSON.parse(JSON.stringify(st));
    return { app: 'giri-garden', version: 1, exportedAt: nowIso, projects: c.projects, todos: c.todos, days: c.days };
  };
  GG.validateImport = function (o) {
    var fail = function (m) { return { ok: false, error: m }; };
    var isObj = function (x) { return !!x && typeof x === 'object' && !Array.isArray(x); };
    var str = function (x) { return typeof x === 'string' && x.trim() !== ''; };
    if (!isObj(o)) return fail('File này không phải dữ liệu của Giri Garden.');
    if (o.app !== 'giri-garden') return fail('File này không phải dữ liệu của Giri Garden (thiếu "app": "giri-garden").');
    if (o.version !== 1) return fail('File thuộc phiên bản ' + o.version + ', app này chỉ đọc được phiên bản 1.');
    if (!Array.isArray(o.projects)) return fail('File thiếu danh sách "projects".');
    if (!Array.isArray(o.todos)) return fail('File thiếu danh sách "todos".');
    if (!isObj(o.days)) return fail('File thiếu mục "days".');
    var ids = {}, workIds = {}, projects = [], todos = [], days = {}, works = 0, trees = 0, i, j, p, w, t, d, key, list, out;
    for (i = 0; i < o.projects.length; i++) {
      p = o.projects[i];
      if (!isObj(p) || !str(p.id) || !str(p.name)) return fail('Project thứ ' + (i + 1) + ' thiếu id hoặc tên.');
      if (ids[p.id]) return fail('Trùng id "' + p.id + '" ở project thứ ' + (i + 1) + '.');
      ids[p.id] = 1;
      if (!GG.isDate(p.createdAt)) return fail('Project "' + p.name + '" có ngày tạo sai dạng (cần YYYY-MM-DD).');
      if (!Array.isArray(p.works)) return fail('Project "' + p.name + '" thiếu danh sách "works".');
      list = [];
      for (j = 0; j < p.works.length; j++) {
        w = p.works[j];
        if (!isObj(w) || !str(w.id) || !str(w.name) || typeof w.order !== 'number') return fail('Công việc thứ ' + (j + 1) + ' của project "' + p.name + '" thiếu id, tên hoặc thứ tự.');
        if (ids[w.id]) return fail('Trùng id "' + w.id + '" ở công việc "' + w.name + '".');
        ids[w.id] = 1; workIds[w.id] = 1; works++;
        list.push({ id: w.id, name: w.name.trim(), order: w.order });
      }
      projects.push({ id: p.id, name: p.name.trim(), createdAt: p.createdAt, works: list });
    }
    for (i = 0; i < o.todos.length; i++) {
      t = o.todos[i];
      if (!isObj(t) || !str(t.id) || !str(t.text)) return fail('Việc thứ ' + (i + 1) + ' thiếu id hoặc nội dung.');
      if (ids[t.id]) return fail('Trùng id "' + t.id + '" ở việc thứ ' + (i + 1) + '.');
      ids[t.id] = 1;
      if (t.workId !== '' && !workIds[t.workId]) return fail('Việc thứ ' + (i + 1) + ' trỏ tới công việc "' + t.workId + '" không có trong file.');
      if (!GG.isDate(t.date)) return fail('Việc thứ ' + (i + 1) + ' có ngày sai dạng (cần YYYY-MM-DD).');
      if (typeof t.done !== 'boolean') return fail('Việc thứ ' + (i + 1) + ' có "done" không phải true hoặc false.');
      if (t.doneAt != null && typeof t.doneAt !== 'string') return fail('Việc thứ ' + (i + 1) + ' có "doneAt" sai dạng.');
      if (t.pomos != null && !(typeof t.pomos === 'number' && t.pomos === Math.floor(t.pomos) && t.pomos >= 0)) return fail('Việc thứ ' + (i + 1) + ' có số pomodoro sai dạng.');
      out = { id: t.id, workId: t.workId, text: t.text.trim(), date: t.date, done: t.done, doneAt: t.doneAt == null ? null : t.doneAt };
      if (t.pomos) out.pomos = t.pomos;
      todos.push(out);
    }
    for (key in o.days) {
      d = o.days[key];
      if (!GG.isDate(key)) return fail('Mục "days" có khóa "' + key + '" không phải ngày (cần YYYY-MM-DD).');
      if (!isObj(d)) return fail('Ngày ' + key + ' sai dạng.');
      out = {};
      if (d.kind != null) { if (KINDS.indexOf(d.kind) < 0) return fail('Ngày ' + key + ' có loại cây lạ "' + d.kind + '".'); out.kind = d.kind; }
      if (d.planted != null) { if (typeof d.planted !== 'boolean') return fail('Ngày ' + key + ' có "planted" không phải true hoặc false.'); out.planted = d.planted; if (d.planted) trees++; }
      if (d.mood != null) { if (d.mood !== Math.floor(d.mood) || d.mood < 1 || d.mood > 5) return fail('Ngày ' + key + ' có mức cảm xúc ngoài khoảng 1 đến 5.'); out.mood = d.mood; }
      days[key] = out;
    }
    return { ok: true, state: { projects: projects, todos: todos, days: days }, summary: { projects: projects.length, works: works, todos: todos.length, trees: trees } };
  };

  /* ---- chia state theo tháng để lưu vào kho ---- */
  GG.splitState = function (st) {
    var months = {}, m = function (k) { return months[k] || (months[k] = { todos: [], days: {} }); };
    st.todos.forEach(function (t) { m(t.date.slice(0, 7)).todos.push(t); });
    Object.keys(st.days).forEach(function (k) { m(k.slice(0, 7)).days[k] = st.days[k]; });
    return { projects: { projects: st.projects }, months: months };
  };
  GG.joinState = function (parts) {
    var st = GG.emptyState();
    if (parts.projects && Array.isArray(parts.projects.projects)) st.projects = parts.projects.projects;
    Object.keys(parts.months || {}).sort().forEach(function (k) {
      var m = parts.months[k] || {};
      st.todos = st.todos.concat(Array.isArray(m.todos) ? m.todos : []);
      Object.keys(m.days || {}).forEach(function (d) { st.days[d] = m.days[d]; });
    });
    return st;
  };


export default GG;
