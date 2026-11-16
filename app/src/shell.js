/* Giri Garden — khung app: cảnh nền, thanh trạng thái của cây hôm nay, Giri, và một bảng duy nhất có thẻ chọn màn hình. */
var GGShell = (function () {
  'use strict';
  var screens = {}, store = null, shellEl, hudEl, heroEl, tabsEl, paperEl, layer, toasts, statusEl;
  var today = GG.todayStr(), lastHash = null, silent = false, started = false;
  var cheerUntil = 0, tickTimer = null, calmTimer = null, heroSig = '', lastStage = -1, plantedToday = false;
  var ICONS = {
    today: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    project: '<circle cx="5" cy="12" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M7.5 12c4 0 4-6.5 8-6.5M7.5 12c4 0 4 6.5 8 6.5"/>',
    garden: '<path d="M12 21v-7"/><circle cx="12" cy="9" r="6"/>',
    mood: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5q3.5 3 7 0M9 10h.01M15 10h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    back: '<path d="M14 6l-6 6 6 6"/>', next: '<path d="M10 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  var DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  /* h('div', {class, text, html, onclick, ...attrs}, [children]) — html chỉ dùng cho hình vẽ của Giri, không bao giờ cho chữ người dùng nhập */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k, v;
    for (k in attrs || {}) {
      v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function icon(name) { return h('span', { style: 'display:contents', html: '<svg class="mk-icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>' }); }
  function iconBtn(name, label, id, onclick, cls) { return h('button', { class: 'gg-btn gg-btn--icon ' + (cls || 'gg-btn--ghost'), id: id, 'aria-label': label, type: 'button', onclick: onclick }, [icon(name)]); }
  function fmtDate(date) { var d = GG.parseDate(date); return DOW[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1); }
  function fmtShort(date) { var d = GG.parseDate(date); return d.getDate() + '/' + (d.getMonth() + 1); }
  function fmtMonth(mk) { var p = mk.split('-'); return 'Tháng ' + (+p[1]) + (p[0] === today.slice(0, 4) ? '' : ', ' + p[0]); }
  function onEnter(fn) { return function (e) { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) fn(); }; }

  function route() {
    var hash = 'hom-nay', best = null;
    try { hash = decodeURIComponent(location.hash.slice(1)) || 'hom-nay'; } catch (e) {}
    Object.keys(screens).forEach(function (n) { if ((hash === n || hash.indexOf(n + '-') === 0) && (!best || n.length > best.length)) best = n; });
    if (!best) return { name: 'hom-nay', params: '' };
    return { name: best, params: hash.slice(best.length + 1) };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  /* ---- hộp thoại, thông báo ---- */
  var dialogClose = null, dialogFrom = null;
  function closeDialog() {
    var had = layer.firstChild; layer.textContent = ''; dialogClose = null;
    if (had && dialogFrom && document.contains(dialogFrom)) dialogFrom.focus();
    dialogFrom = null;
  }
  function sheet(title, body, onClose) {
    closeDialog();
    var from = document.activeElement, dismiss = function () { closeDialog(); if (onClose) onClose(); };
    var x = iconBtn('close', 'Đóng', 'dialog-close', dismiss);
    var box = h('div', { class: 'gg-card ga-dialog__box', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [h('div', { class: 'mk-row' }, [h('p', { class: 'gg-title mk-grow', text: title }), x]), body]);
    var wrap = h('div', { class: 'ga-dialog', onclick: function (e) { if (e.target === wrap) dismiss(); } }, [box]);
    layer.appendChild(wrap);
    dialogClose = dismiss; dialogFrom = from && from.id ? from : null;
    (body.querySelector('input, select, textarea') || body.querySelector('button') || x).focus();
    return closeDialog;
  }
  function confirmBox(o) {
    return new Promise(function (resolve) {
      var done = function (v) { closeDialog(); resolve(v); };
      sheet(o.title, h('div', { class: 'ga-stack ga-stack--tight' }, [
        h('p', { class: 'gg-muted', text: o.body || '' }),
        h('div', { class: 'ga-dialog__actions' }, [
          h('button', { class: 'gg-btn gg-btn--ghost', id: 'confirm-no', type: 'button', text: o.no || 'Thôi', onclick: function () { done(false); } }),
          h('button', { class: 'gg-btn ' + (o.danger ? 'gg-btn--clay' : ''), id: 'confirm-yes', type: 'button', text: o.yes || 'Đồng ý', onclick: function () { done(true); } })
        ])
      ]), function () { resolve(false); });
    });
  }
  /* ask({title, value, placeholder, yes, danger}) -> chuỗi đã nhập | {danger: true} | null */
  function ask(o) {
    return new Promise(function (resolve) {
      var input = h('input', { class: 'gg-input', id: 'ask-text', type: 'text', 'aria-label': o.label || o.title, placeholder: o.placeholder || '', maxlength: String(o.max || 120) }); input.value = o.value || '';
      var done = function (v) { closeDialog(); resolve(v); }, save = function () { if (!input.value.trim()) { input.focus(); return; } done(input.value); };
      input.addEventListener('keydown', onEnter(save));
      sheet(o.title, h('div', { class: 'ga-stack ga-stack--tight' }, [input, h('div', { class: 'ga-dialog__actions' }, [
        o.danger ? h('button', { class: 'gg-btn gg-btn--clay', id: 'ask-danger', type: 'button', text: o.danger, onclick: function () { done({ danger: true }); } }) : null,
        h('button', { class: 'gg-btn', id: 'ask-save', type: 'button', text: o.yes || 'Lưu', onclick: save })
      ])]), function () { resolve(null); });
    });
  }
  /* askTodo({title, text, date, danger, yes}) -> {text, date} | {danger: true} | null */
  function askTodo(o) {
    return new Promise(function (resolve) {
      var text = h('input', { class: 'gg-input', id: 'todo-text', type: 'text', 'aria-label': 'Nội dung việc', placeholder: 'Việc cần làm', maxlength: '300' }); text.value = o.text || '';
      var date = h('input', { class: 'gg-input', id: 'todo-date', type: 'date', 'aria-label': 'Ngày làm' }); date.value = o.date || today;
      var done = function (v) { closeDialog(); resolve(v); }, save = function () { if (!text.value.trim()) { text.focus(); return; } done({ text: text.value, date: date.value || o.date || today }); };
      text.addEventListener('keydown', onEnter(save));
      sheet(o.title, h('div', { class: 'ga-stack ga-stack--tight' }, [
        h('label', { class: 'mk-field' }, ['Nội dung', text]), h('label', { class: 'mk-field' }, ['Ngày làm', date]),
        h('div', { class: 'ga-dialog__actions' }, [
          o.danger ? h('button', { class: 'gg-btn gg-btn--clay', id: 'todo-danger', type: 'button', text: o.danger, onclick: function () { done({ danger: true }); } }) : null,
          h('button', { class: 'gg-btn', id: 'todo-save', type: 'button', text: o.yes || 'Lưu', onclick: save })
        ])
      ]), function () { resolve(null); });
    });
  }
  function editTodo(ctx, t) {
    askTodo({ title: 'Sửa việc', text: t.text, date: t.date, danger: 'Xóa việc' }).then(function (r) {
      if (!r) return;
      if (r.danger) { ctx.apply(function (s) { return GG.deleteTodo(s, t.id); }); toast('Đã xóa việc'); return; }
      ctx.apply(function (s) { return GG.updateTodo(s, t.id, { text: r.text, date: r.date }); });
    });
  }
  function toast(text) { var t = h('div', { class: 'ga-toast', role: 'status', text: text }); toasts.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function showStatus(s) {
    statusEl.textContent = ''; statusEl.hidden = !(s === 'error' || s === 'offline');
    if (s === 'error') {
      statusEl.appendChild(h('span', { class: 'mk-grow', text: 'Chưa lưu được. Dữ liệu vẫn còn trên trang này, bạn thử lưu lại nhé.' }));
      statusEl.appendChild(h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'save-retry', type: 'button', text: 'Thử lại', onclick: function () { store.retry(); } }));
    } else if (s === 'offline') statusEl.appendChild(h('span', { text: 'Chưa lưu được: trang đang mở ngoài Claude nên dữ liệu chỉ nằm trên trang này. Vào Cài đặt để xuất JSON.' }));
  }

  /* ---- thế giới: thanh trạng thái của cây hôm nay + Giri và cây đứng trong cảnh ---- */
  function pickKind(kind) {
    var chosen = kind, group = 0, body = h('div', { class: 'ga-stack ga-stack--tight' });
    Giri.groups.forEach(function (g, i) { if (g.kinds.indexOf(kind) >= 0) group = i; });
    function draw() {
      body.textContent = '';
      body.appendChild(h('div', { class: 'gg-tabs', role: 'tablist', 'aria-label': 'Nhóm cây', style: 'align-self:flex-start' }, Giri.groups.map(function (g, i) {
        return h('button', { class: 'gg-tab', role: 'tab', id: 'group-' + g.key, type: 'button', 'aria-selected': String(i === group), text: g.name, onclick: function () { group = i; draw(); } });
      })));
      body.appendChild(h('div', { class: 'gg-seeds' }, Giri.groups[group].kinds.map(function (k) {
        return h('div', { class: 'gg-seed' }, [h('button', { class: 'gg-frame', id: 'seed-' + k, type: 'button', 'aria-pressed': String(k === chosen), 'aria-label': Giri.kinds[k], html: Giri.plant(5, k, 58, true), onclick: function () { chosen = k; draw(); } }), Giri.kinds[k]]);
      })));
      body.appendChild(h('div', { class: 'ga-dialog__actions' }, [h('button', { class: 'gg-btn gg-btn--leaf', id: 'seed-confirm', type: 'button', text: 'Trồng ' + Giri.kinds[chosen].toLowerCase(), onclick: function () { closeDialog(); store.apply(function (s) { return GG.setKind(s, today, chosen); }); } })]));
    }
    sheet('Hôm nay trồng cây gì?', body); draw();
  }
  function drawWorld(st) {
    var pr = GG.dayProgress(st, today), day = st.days[today] || {}, planted = !!day.planted, stage = planted ? 5 : GG.stageFor(pr.pct, pr.total);
    var kind = GG.kindFor(st, today), cp = GG.canPlant(st, today, today), late = GG.overdue(st, today), left = pr.total - pr.done;
    var streak = GG.streak(st, today), inMonth = GG.monthDays(st, GG.monthKey(today)).filter(Boolean).length, mood, line;
    plantedToday = planted;
    if (!st.projects.length) { mood = 'happy'; line = 'Chào bạn, mình là Giri! Tạo project đầu tiên rồi mình cùng trồng cây nhé.'; }
    else if (planted) { mood = 'cheer'; line = 'Hôm nay trồng cây rồi. Khu rừng lại xanh thêm một chút!'; }
    else if (cp.ok) { mood = 'cheer'; line = 'Xong hết việc rồi! Mang cây ra khu đất thôi.'; }
    else if (late.length) { mood = 'sad'; line = 'Còn ' + late.length + ' việc từ hôm trước. Mình mang sang hôm nay nhé?'; }
    else if (!pr.total) { mood = 'sleepy'; line = 'Hôm nay chưa có việc nào. Bạn muốn làm gì?'; }
    else if (!pr.done) { mood = 'happy'; line = 'Có ' + pr.total + ' việc đang chờ. Xong hết là có cây mới!'; }
    else { mood = 'happy'; line = 'Xong ' + pr.done + ' việc rồi. Còn ' + left + ' việc nữa là trồng được cây!'; }
    if (Date.now() < cheerUntil && mood !== 'sad') mood = 'cheer';

    var plantBtn = h('button', { class: 'gg-btn gg-btn--leaf mk-grow', id: 'plant-today', type: 'button' });
    if (cp.reason === 'ok') {
      plantBtn.textContent = 'Trồng vào khu đất';
      plantBtn.addEventListener('click', function () {
        if (checkDay()) return;                              // đã sang ngày mới: không trồng vào ngày cũ
        try { sessionStorage.setItem('gg-fresh', today); } catch (e) {}
        silent = true; try { store.apply(function (s) { return GG.plant(s, today, today); }); } finally { silent = false; }
        go('#khu-vuon');
      });
    } else { plantBtn.disabled = true; plantBtn.textContent = cp.reason === 'remaining' ? 'Còn ' + cp.remaining + ' việc nữa' : cp.reason === 'planted' ? 'Đã trồng hôm nay' : 'Thêm việc để trồng cây'; }
    hudEl.textContent = '';
    hudEl.appendChild(h('div', { class: 'mk-hud__top' }, [
      h('span', { style: 'display:contents', html: Giri.plant(Math.max(stage, 3), kind, 64, true) }),
      h('p', { class: 'mk-hud__name' }, [Giri.kinds[kind] + ' · cấp ' + stage, h('span', { text: Giri.stages[stage] + ' · ' + pr.done + ' / ' + pr.total + ' việc' })]),
      planted ? h('span', { class: 'gg-chip gg-chip--leaf', text: 'Đã trồng' }) : h('span', { class: 'gg-chip', text: pr.pct + '%' })
    ]));
    hudEl.appendChild(h('div', { class: 'gg-progress gg-progress--lg', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(planted ? 100 : pr.pct), 'aria-label': 'Việc đã xong hôm nay' }, [h('div', { class: 'gg-progress__fill', style: '--value:' + (planted ? 100 : pr.pct) + '%' })]));
    hudEl.appendChild(h('div', { class: 'mk-row' }, [plantBtn, planted ? null : h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'change-kind', type: 'button', text: 'Đổi cây', onclick: function () { pickKind(kind); } })]));
    hudEl.appendChild(h('div', { class: 'mk-hud__chips' }, [streak ? h('span', { class: 'gg-chip gg-chip--sun', text: 'Chuỗi ' + streak + ' ngày' }) : null, h('span', { class: 'gg-chip gg-chip--leaf', text: fmtMonth(GG.monthKey(today)) + ' · ' + inMonth + ' cây' })]));

    var sig = [mood, line, stage, kind].join('|');
    if (sig !== heroSig) {
      heroSig = sig; heroEl.textContent = '';
      heroEl.appendChild(h('p', { class: 'gg-bubble mk-bubble-down' }, [h('span', { class: 'gg-tag', text: 'Giri' }), line]));
      var plant = h('span', { id: 'day-plant', style: 'display:block', html: Giri.plant(stage, kind, 190) });
      if (lastStage >= 0 && stage > lastStage) plant.firstChild.classList.add('is-grown');
      heroEl.appendChild(h('div', { class: 'mk-hero__stage' }, [h('span', { id: 'giri', style: 'display:block', html: Giri.mascot(mood, 150) }), plant]));
    }
    lastStage = stage;
  }
  /* tick(ctx, todo, box): tick một việc ở bất kỳ màn hình nào — giọt nước, mưa lên cây hôm nay, Giri ăn mừng */
  function tick(ctx, t, box) {
    ctx.apply(function (s) { return GG.toggleTodo(s, t.id, new Date().toISOString()); }, { silent: true });
    if (box && box.checked !== false) {
      var done = store.state().todos.filter(function (x) { return x.id === t.id; })[0];
      if (done && done.done) {
        if (box.nodeType) Giri.burst(box, 'drops');
        if (t.date === today && !plantedToday) { var g = document.getElementById('giri'), p = document.getElementById('day-plant'); if (g) { g.innerHTML = Giri.mascot('munch', 150); heroSig = ''; } if (p) Giri.rain(p); }
        cheerUntil = Date.now() + 2600; clearTimeout(calmTimer); calmTimer = setTimeout(render, 2700);
      }
    }
    clearTimeout(tickTimer); tickTimer = setTimeout(render, 540);
  }

  function drawTabs(active) {
    tabsEl.textContent = '';
    Object.keys(screens).filter(function (n) { return screens[n].nav; }).sort(function (a, b) { return screens[a].nav.order - screens[b].nav.order; }).forEach(function (n) {
      var s = screens[n];
      tabsEl.appendChild(h('button', { class: 'mk-tab', id: 'nav-' + n, type: 'button', 'aria-current': n === active ? 'page' : null, onclick: function () { go('#' + n); } }, [icon(s.nav.icon), s.nav.label]));
    });
  }

  function render() {
    if (!started) return;
    var r = route(), s = screens[r.name], hash = location.hash, state = store.state();
    var ctx = {
      state: state, store: store, today: today, params: r.params,
      go: go, confirm: confirmBox, sheet: sheet, closeSheet: closeDialog, toast: toast, ask: ask, askTodo: askTodo,
      apply: function (fn, o) {
        var was = !!(store.state().days[today] || {}).planted;
        silent = !!(o && o.silent);
        try { store.apply(function (s) { return GG.settleToday(fn(s), today); }); } finally { silent = false; }
        if (was && !(store.state().days[today] || {}).planted) { heroSig = ''; toast('Hôm nay còn việc chưa xong nên cây quay về chờ. Xong hết rồi trồng lại nhé.'); }
      },
      rerender: function () { if (route().name === r.name) render(); }
    };
    ctx.tick = function (t, box) { tick(ctx, t, box); };
    ctx.editTodo = function (t) { editTodo(ctx, t); };
    var keepScroll = hash === lastHash ? window.scrollY : 0, a = document.activeElement, keep = null, drafts = {};
    if (hash === lastHash && a && a.id && paperEl.contains(a)) {
      keep = { id: a.id, text: a.type === 'text' };
      if (keep.text) { try { keep.start = a.selectionStart; keep.end = a.selectionEnd; } catch (e) {} }
    }
    if (hash === lastHash) Array.prototype.forEach.call(paperEl.querySelectorAll('input[type="text"][id]'), function (el) { if (el.value) drafts[el.id] = el.value; });
    shellEl.className = 'mk-app gg' + (s.wide ? ' mk-app--wide' : '');
    drawWorld(state);
    drawTabs(s.navGroup || r.name);
    paperEl.textContent = '';
    s.render(paperEl, ctx);
    Object.keys(drafts).forEach(function (id) { var el = document.getElementById(id); if (el && !el.value) el.value = drafts[id]; });
    if (keep && !layer.firstChild) {
      var el = document.getElementById(keep.id);
      if (el) { el.focus({ preventScroll: true }); if (keep.text && keep.start != null) { try { el.setSelectionRange(keep.start, keep.end); } catch (e) {} } }
    }
    if (hash !== lastHash) { closeDialog(); window.scrollTo(0, 0); } else window.scrollTo(0, keepScroll);
    lastHash = hash;
  }

  /* trả về true khi ngày vừa đổi (và màn hình đã được vẽ lại theo ngày mới) */
  function checkDay() { var t = GG.todayStr(); if (t !== today) { today = t; heroSig = ''; lastStage = -1; store.apply(function (s) { return GG.settleToday(s, today); }); render(); return true; } return false; }
  function leaving() { if (store) store.flush(); }

  function start() {
    var root = document.getElementById('app');
    root.innerHTML = GGWorld.scene();
    hudEl = h('aside', { class: 'mk-hud', 'aria-label': 'Cây của hôm nay' });
    heroEl = h('div', { class: 'mk-hero' });
    tabsEl = h('nav', { class: 'mk-tabs', 'aria-label': 'Điều hướng chính' });
    paperEl = h('div', { class: 'mk-paper' });
    shellEl = h('div', { class: 'mk-app gg' }, [hudEl, heroEl, h('main', { class: 'mk-board' }, [tabsEl, h('div', { class: 'mk-frame' }, [paperEl])])]);
    statusEl = h('div', { class: 'ga-status gg', role: 'status', hidden: true });
    layer = h('div', { class: 'ga-layer gg' });
    toasts = h('div', { class: 'ga-toasts gg' });
    [shellEl, statusEl, layer, toasts].forEach(function (e) { root.appendChild(e); });
    paperEl.appendChild(h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-empty', text: 'Giri đang mở cổng rừng…' })]));
    try { localStorage.removeItem('gg-theme'); } catch (e) {}

    var boot = function (db) {
      store = GGStore.create({ db: db, onChange: function () { if (!silent) render(); }, onStatus: showStatus });
      api.store = store;
      store.ready.then(function () { started = true; store.apply(function (s) { return GG.settleToday(s, today); }); render(); });
    };
    var use = window.claude && window.claude.use ? window.claude.use('db') : Promise.resolve(null);
    Promise.resolve(use).then(boot, function () { boot(null); });

    window.addEventListener('hashchange', render);
    window.addEventListener('focus', checkDay);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') leaving(); else checkDay(); });
    window.addEventListener('pagehide', leaving);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dialogClose) dialogClose(); });
    setInterval(checkDay, 30000);
  }

  var api = {
    start: start, go: go, h: h, icon: icon, iconBtn: iconBtn, fmtDate: fmtDate, fmtShort: fmtShort, fmtMonth: fmtMonth, onEnter: onEnter,
    store: null, syncDay: checkDay, register: function (name, def) { screens[name] = def; }
  };
  return api;
})();
