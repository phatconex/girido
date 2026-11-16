/* Giri Garden — bản phác bố cục desktop. Dữ liệu là ví dụ, không lưu. */
(function () {
  'use strict';
  var app = document.getElementById('mock'), seed = 42;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var ICON = {
    today: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    project: '<circle cx="5" cy="12" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M7.5 12c4 0 4-6.5 8-6.5M7.5 12c4 0 4 6.5 8 6.5"/>',
    garden: '<path d="M12 21v-7"/><circle cx="12" cy="9" r="6"/>',
    mood: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5q3.5 3 7 0M9 10h.01M15 10h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'
  };
  function icon(n) { return '<svg class="mk-icon" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>'; }

  /* ---- dữ liệu ví dụ ---- */
  var data = { projects: [
    { name: 'Học IELTS', kind: 'xoai', works: [
      { name: 'Từ vựng nền', todos: [['Học 20 từ chủ đề môi trường', '12/11', 1], ['Ôn 40 từ tuần trước', '13/11', 1], ['Làm flashcard chủ đề sức khỏe', '14/11', 1]] },
      { name: 'Luyện Listening', todos: [['Nghe Cam 18 Test 1', '14/11', 1], ['Chép chính tả 15 phút', '15/11', 1], ['Nghe Cam 18 Test 2', '15/11', 0], ['Xem lại các câu sai', '16/11', 0]] },
      { name: 'Luyện Reading', todos: [['Đọc bài về đô thị hóa', '15/11', 0], ['Luyện dạng True / False / Not Given', '17/11', 0]] },
      { name: 'Viết Task 2', todos: [['Lập dàn ý 4 đoạn', '18/11', 0]] }
    ] },
    { name: 'Sửa nhà', kind: 'tre', works: [
      { name: 'Phòng khách', todos: [['Đo lại kích thước tường', '10/11', 1], ['Chọn màu sơn', '15/11', 0]] },
      { name: 'Ban công', todos: [['Mua chậu và đất', '16/11', 0]] }
    ] }
  ] };
  var cur = 0, screen = location.hash === '#project' ? 'project' : 'today';
  function stats(p) { var t = 0, d = 0; p.works.forEach(function (w) { w.todos.forEach(function (x) { t++; if (x[2]) d++; }); }); return { total: t, done: d, pct: t ? Math.floor(d * 100 / t) : 0 }; }
  function wstats(w) { var d = w.todos.filter(function (x) { return x[2]; }).length; return { total: w.todos.length, done: d }; }
  function todayList() { var out = []; data.projects.forEach(function (p) { p.works.forEach(function (w) { w.todos.forEach(function (t) { if (t[1] === '15/11') out.push({ p: p, w: w, t: t }); }); }); }); return out; }

  /* ---- cảnh nền: hồ trong rừng, nhiều lớp, mỗi lớp chuyển động riêng ---- */
  function sprite(kind, x, y, size, stage) { return Giri.plant(stage == null ? 5 : stage, kind, size, true).replace('<svg ', '<svg x="' + x + '" y="' + y + '" '); }
  function cloud(x, y, k) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><ellipse class="mk-cloud" cx="0" cy="0" rx="90" ry="26"/><circle class="mk-cloud" cx="-30" cy="-18" r="34"/><circle class="mk-cloud" cx="22" cy="-26" r="42"/><circle class="mk-cloud" cx="62" cy="-8" r="26"/></g>'; }
  function star(x, y, r, d) { return '<path class="mk-spark" style="animation-delay:' + d + 's" d="M' + x + ' ' + (y - r) + ' L' + (x + r * 0.28) + ' ' + (y - r * 0.28) + ' L' + (x + r) + ' ' + y + ' L' + (x + r * 0.28) + ' ' + (y + r * 0.28) + ' L' + x + ' ' + (y + r) + ' L' + (x - r * 0.28) + ' ' + (y + r * 0.28) + ' L' + (x - r) + ' ' + y + ' L' + (x - r * 0.28) + ' ' + (y - r * 0.28) + 'z"/>'; }
  function blades(x, y, k, cls) {
    var s = '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">', i;
    for (i = 0; i < 5; i++) s += '<path class="mk-blade ' + (cls || '') + '" style="animation-delay:' + (-i * 0.6) + 's" d="M' + (i * 12 - 4) + ' 0 Q' + (i * 12 + (i - 2) * 6) + ' -' + (30 + (i % 3) * 14) + ' ' + (i * 12 + (i - 2) * 12) + ' -' + (52 + (i % 3) * 20) + ' Q' + (i * 12 + 6 + (i - 2) * 4) + ' -24 ' + (i * 12 + 6) + ' 0z"/>';
    return s + '</g>';
  }
  function scene() {
    var s = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMinYMax slice" aria-hidden="true">', i;
    s += '<circle class="mk-halo" cx="1240" cy="170" r="130"/><circle class="mk-sun" cx="1240" cy="170" r="70"/>';
    s += '<g class="mk-drift mk-drift--slow" style="animation-delay:-60s">' + cloud(0, 150, 1) + '</g><g class="mk-drift mk-drift--slow" style="animation-delay:-150s">' + cloud(0, 250, 0.7) + '</g>';
    s += '<path class="mk-far" d="M0 560 Q120 400 250 440 Q360 330 500 430 Q620 500 760 400 Q880 320 1010 420 Q1150 500 1290 380 Q1430 300 1600 430 V900 H0z"/>';
    s += '<g class="mk-drift" style="animation-delay:-20s">' + cloud(0, 330, 0.9) + '</g><g class="mk-drift" style="animation-delay:-80s">' + cloud(0, 210, 1.2) + '</g>';
    s += '<path class="mk-mid" d="M0 600 Q180 470 420 540 Q620 600 820 520 Q1040 440 1260 520 Q1440 580 1600 520 V900 H0z"/>';
    [[150, 548], [182, 540], [470, 556], [840, 528], [872, 520], [1180, 512], [1470, 548], [1500, 540]].forEach(function (p) { s += '<path class="mk-pine" d="M' + p[0] + ' ' + (p[1] - 44) + ' l13 44 h-26z"/>'; });
    s += '<path class="mk-field" d="M760 640 Q1080 560 1600 600 V700 H760z"/>';
    s += '<path class="mk-bank" d="M860 668 Q1160 604 1600 640 V740 H860z"/>';
    s += sprite('tron', 1090, 508, 150) + sprite('phuong', 1250, 494, 170) + sprite('bui', 1420, 580, 90) + sprite('thong', 990, 566, 96);
    s += '<path class="mk-water" d="M520 716 Q900 660 1600 694 V900 H330 Q470 820 520 716z"/><path class="mk-water-2" d="M700 760 Q1000 730 1700 760 V800 Q1100 770 700 800z"/><path class="mk-water-2" style="animation-delay:-4s" d="M560 836 Q900 812 1700 842 V872 Q1000 842 560 872z"/>';
    s += '<path class="mk-shoreline" d="M866 676 Q1160 624 1600 652"/>';
    [[760, 742, 90, 0], [980, 790, 120, -2], [1240, 744, 80, -4], [1380, 826, 130, -1], [700, 858, 110, -3]].forEach(function (w) { s += '<path class="mk-wave" style="animation-delay:' + w[3] + 's" d="M' + w[0] + ' ' + w[1] + ' q' + w[2] / 4 + ' -8 ' + w[2] / 2 + ' 0 t' + w[2] / 2 + ' 0"/>'; });
    s += star(900, 760, 11, 0) + star(1130, 812, 8, -1.2) + star(1330, 770, 12, -2.1) + star(1480, 850, 9, -0.6) + star(1020, 862, 9, -2.6) + star(790, 818, 7, -1.7);
    s += '<ellipse class="mk-lily" cx="1180" cy="716" rx="26" ry="8"/><ellipse class="mk-lily" style="animation-delay:-2s" cx="1250" cy="730" rx="18" ry="6"/><ellipse class="mk-lily" style="animation-delay:-3s" cx="1040" cy="724" rx="20" ry="6"/>' + sprite('sen', 1150, 630, 70);
    s += '<path class="mk-near" d="M0 640 Q280 590 560 640 Q760 680 800 780 Q820 850 770 900 H0z"/><path class="mk-shoreline" d="M566 644 Q760 684 798 782 Q816 848 772 898"/>';
    s += sprite('xoai', -90, 250, 330) + sprite('tre', 560, 470, 150) + sprite('bui', 660, 590, 96);
    [[60, 690], [330, 660], [520, 690], [640, 760], [700, 850], [470, 870]].forEach(function (f, i) { s += '<circle class="mk-flower' + (i % 2 ? ' mk-flower--pink' : '') + '" cx="' + f[0] + '" cy="' + f[1] + '" r="5"/><circle class="mk-flower' + (i % 2 ? '' : ' mk-flower--pink') + '" cx="' + (f[0] + 12) + '" cy="' + (f[1] + 5) + '" r="3.5"/>'; });
    s += blades(610, 720, 0.5) + blades(20, 700, 0.55) + blades(700, 800, 0.45);
    s += '<g class="mk-flock"><g transform="translate(0 260)"><path class="mk-bird mk-flap" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g><g transform="translate(-70 300) scale(0.7)"><path class="mk-bird mk-flap" style="animation-delay:-0.3s" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g><g transform="translate(-40 230) scale(0.8)"><path class="mk-bird mk-flap" style="animation-delay:-0.5s" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g></g>';
    for (i = 0; i < 5; i++) s += '<path class="mk-leaf-fall" style="animation-delay:' + (-i * 2.9) + 's" d="M' + (240 + i * 190) + ' 0 q12 -8 20 4 q-12 8 -20 -4z"/>';
    s += blades(1330, 910, 2.3, 'mk-blade--front') + blades(1480, 915, 1.7) + blades(-20, 915, 1.5, 'mk-blade--front');
    return '<div class="mk-scene" aria-hidden="true">' + s + '</svg></div>';
  }

  function tabs() {
    var items = [['today', 'today', 'Hôm nay'], ['project', 'project', 'Project'], ['garden', 'garden', 'Khu vườn'], ['mood', 'mood', 'Cảm xúc'], ['gear', 'gear', 'Cài đặt']];
    return '<nav class="mk-tabs" aria-label="Điều hướng chính">' + items.map(function (it) {
      return '<button class="mk-tab" type="button" id="nav-' + it[0] + '" data-go="' + it[0] + '"' + (screen === it[0] ? ' aria-current="page"' : '') + '>' + icon(it[1]) + it[2] + '</button>';
    }).join('') + '</nav>';
  }

  /* ---- màn hình Hôm nay ---- */
  function today() {
    var list = todayList(), done = list.filter(function (x) { return x.t[2]; }).length, pct = list.length ? Math.floor(done * 100 / list.length) : 0;
    var stage = !list.length || !pct ? 0 : pct >= 100 ? 5 : pct >= 75 ? 4 : pct >= 50 ? 3 : pct >= 25 ? 2 : 1, left = list.length - done;
    var days = [['T2', 9, 1], ['T3', 10, 1], ['T4', 11, 0], ['T5', 12, 1], ['T6', 13, 1], ['T7', 14, 1], ['CN', 15, 0]];
    var groups = {}, order = [];
    list.forEach(function (x, i) { var k = x.p.name + ' · ' + x.w.name; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push({ x: x, i: i }); });
    var line = !left ? 'Xong hết việc rồi! Mang cây ra khu đất thôi.' : done ? 'Xong ' + done + ' việc rồi. Còn ' + left + ' việc nữa là trồng được cây!' : 'Có ' + list.length + ' việc đang chờ. Xong hết là có cây mới!';
    var hud = '<aside class="mk-hud" aria-label="Cây của hôm nay"><div class="mk-hud__top">' + Giri.plant(Math.max(stage, 3), 'xoai', 64, true) + '<p class="mk-hud__name">Cây xoài · cấp ' + stage + '<span>' + Giri.stages[stage] + ' · ' + done + ' / ' + list.length + ' việc</span></p><span class="gg-chip">' + pct + '%</span></div>' +
      '<div class="gg-progress gg-progress--lg"><div class="gg-progress__fill" style="--value:' + pct + '%"></div></div>' +
      '<div class="mk-row"><button class="gg-btn gg-btn--leaf mk-grow" id="plant-today" type="button"' + (left ? ' disabled' : '') + '>' + (left ? 'Còn ' + left + ' việc nữa' : 'Trồng vào khu đất') + '</button><button class="gg-btn gg-btn--ghost mk-mini" id="change-kind" type="button">Đổi cây</button></div>' +
      '<div class="mk-hud__chips"><span class="gg-chip gg-chip--sun">Chuỗi 3 ngày</span><span class="gg-chip gg-chip--leaf">Tháng 11 · 12 cây</span></div></aside>';
    var use3d = window.MK3D && window.MK3D.ready;
    if (use3d) window.MK3D.update({ stage: stage, kind: 'xoai' });
    var hero = use3d ? '<div class="mk-say" id="mk-say"><p class="gg-bubble mk-bubble-down"><span class="gg-tag">Giri</span>' + line + '</p></div><p class="mk-hint">Kéo chuột trên cảnh để xoay hòn đảo</p>' : '<div class="mk-hero"><p class="gg-bubble mk-bubble-down"><span class="gg-tag">Giri</span>' + line + '</p><div class="mk-hero__stage" id="day-plant">' + Giri.mascot(left ? 'happy' : 'cheer', 150) + Giri.plant(stage, 'xoai', 190) + '</div></div>';
    var paper = '<section class="mk-sec"><div class="mk-head"><div><p class="mk-h1">Chủ Nhật, 15/11</p><p class="gg-muted">Còn ' + left + ' / ' + list.length + ' việc hôm nay</p></div>' +
      '<div class="gg-days">' + days.map(function (d) { return '<button class="gg-day' + (d[2] ? ' is-done' : '') + (d[1] === 15 ? ' is-today' : '') + '" type="button" id="day-' + d[1] + '">' + d[0] + '<span class="gg-day__num">' + d[1] + '</span><span class="gg-day__mark"></span></button>'; }).join('') + '</div></div>' +
      '<div class="mk-add"><input class="gg-input" id="new-todo" type="text" placeholder="Hôm nay bạn muốn làm gì?" aria-label="Việc mới">' +
      '<select class="mk-select" id="new-todo-work" aria-label="Thuộc công việc">' + data.projects.map(function (p) { return '<optgroup label="' + esc(p.name) + '">' + p.works.map(function (w) { return '<option>' + esc(w.name) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>' +
      '<button class="gg-btn gg-btn--icon" id="add-todo" type="button" aria-label="Thêm việc">+</button></div></section>' +
      '<section class="mk-sec mk-sec--late"><div class="mk-row"><p class="mk-group mk-grow">Việc trễ <span>· 1</span></p><button class="gg-btn gg-btn--ghost mk-mini" id="carry-all" type="button">Mang sang hôm nay</button></div>' +
      '<label class="mk-item"><input type="checkbox" class="gg-check" id="late-1"><span class="mk-item__text">Chọn màu sơn<small>Từ thứ Bảy, 14/11 · Sửa nhà</small></span></label></section>' +
      order.map(function (k) {
        return '<section class="mk-sec"><p class="mk-group">' + esc(k.split(' · ')[0]) + ' <span>· ' + esc(k.split(' · ')[1]) + '</span></p>' + groups[k].map(function (g) {
          return '<label class="mk-item"><input type="checkbox" class="gg-check" id="todo-' + g.i + '" data-todo="' + g.i + '"' + (g.x.t[2] ? ' checked' : '') + '><span class="mk-item__text">' + esc(g.x.t[0]) + '</span></label>';
        }).join('') + '</section>';
      }).join('');
    return hud + hero + '<main class="mk-board">' + tabs() + '<div class="mk-frame"><div class="mk-paper">' + paper + '</div></div></main>';
  }

  /* ---- màn hình Project: mindmap ---- */
  function project() {
    var p = data.projects[cur], st = stats(p), ROW = 50, X = [0, 262, 572], y = 8, html = '', links = '', centers = [];
    p.works.forEach(function (w, wi) {
      var top = y, ws = wstats(w), items = w.todos.concat([null]);
      items.forEach(function (t, k) {
        var cy = y + 20;
        if (t) html += '<button class="mk-node mk-leaf' + (t[2] ? ' is-done' : '') + '" type="button" id="leaf-' + wi + '-' + k + '" data-leaf="' + wi + '-' + k + '" style="left:' + X[2] + 'px;top:' + y + 'px"><span class="mk-leaf__dot">' + (t[2] ? '&#10003;' : '') + '</span><span class="mk-leaf__text">' + esc(t[0]) + '</span><span class="gg-chip' + (t[1] === '15/11' ? ' gg-chip--sun' : '') + '">' + (t[1] === '15/11' ? 'Hôm nay' : t[1]) + '</span></button>';
        else html += '<button class="mk-node mk-leaf mk-leaf--add" type="button" id="add-leaf-' + wi + '" style="left:' + X[2] + 'px;top:' + y + 'px">+ Thêm việc</button>';
        items[k] = { cy: cy, done: t && t[2], add: !t };
        y += ROW;
      });
      var wy = (top + y - ROW) / 2 + 20, cls = ws.total && ws.done === ws.total ? ' is-done' : ws.done ? ' is-now' : '';
      html += '<div class="mk-node mk-work gg-work' + cls + '" style="left:' + X[1] + 'px;top:' + (wy - 28) + 'px"><span class="gg-work__num">' + (wi < 9 ? '0' : '') + (wi + 1) + '</span><span class="gg-work__name">' + esc(w.name) + '<span class="gg-work__meta">' + ws.done + ' / ' + ws.total + ' việc</span></span></div>';
      items.forEach(function (it) { if (!it.add) links += '<path class="mk-link' + (it.done ? ' mk-link--done' : '') + '" d="M' + (X[1] + 250) + ' ' + wy + ' C' + (X[1] + 290) + ' ' + wy + ' ' + (X[2] - 44) + ' ' + it.cy + ' ' + X[2] + ' ' + it.cy + '"/>'; });
      centers.push({ y: wy, done: cls === ' is-done' });
      y += 20;
    });
    html += '<button class="mk-node mk-leaf mk-leaf--add" type="button" id="add-work" style="left:' + X[1] + 'px;top:' + y + 'px">+ Thêm công việc</button>';
    var H = y + 56, ry = (centers[0].y + centers[centers.length - 1].y) / 2;
    centers.forEach(function (c) { links += '<path class="mk-link' + (c.done ? ' mk-link--done' : '') + '" d="M190 ' + ry + ' C230 ' + ry + ' 222 ' + c.y + ' ' + X[1] + ' ' + c.y + '"/>'; });
    html = '<div class="mk-node mk-root" style="left:0;top:' + Math.max(0, ry - 118) + 'px">' + Giri.plant(st.pct >= 100 ? 5 : st.pct >= 50 ? 4 : 3, p.kind, 96, true) + '<p class="mk-root__name">' + esc(p.name) + '</p><span class="gg-chip' + (st.pct === 100 ? ' gg-chip--leaf' : '') + '">' + st.done + ' / ' + st.total + ' việc · ' + st.pct + '%</span><div class="gg-progress gg-progress--leaf"><div class="gg-progress__fill" style="--value:' + st.pct + '%"></div></div></div>' + html;
    return '<main class="mk-board">' + tabs() + '<div class="mk-frame"><div class="mk-paper">' +
      '<section class="mk-sec"><div class="mk-head"><p class="mk-h1 mk-grow">Project</p><div class="mk-row">' + data.projects.map(function (q, i) { return '<button class="gg-btn ' + (i === cur ? '' : 'gg-btn--ghost ') + 'mk-mini" type="button" id="proj-' + i + '" data-proj="' + i + '">' + esc(q.name) + ' · ' + stats(q).pct + '%</button>'; }).join('') + '<button class="gg-btn gg-btn--ghost mk-mini" type="button" id="proj-new">+ Project mới</button></div></div>' +
      '<p class="gg-muted">Bấm vào một việc để tick xong. Đường nối chuyển xanh khi việc đã xong; công việc xong hết thì cả nhánh xanh.</p></section>' +
      '<div class="mk-mindwrap"><div class="mk-mind" style="height:' + H + 'px"><svg aria-hidden="true">' + links + '</svg>' + html + '</div></div>' +
      '</div></div></main>';
  }

  app.innerHTML = (window.MK3D && window.MK3D.ready ? '' : scene()) + '<div class="mk-app gg" id="mk-app"></div>';
  var shell = document.getElementById('mk-app');
  function draw() {
    shell.className = 'mk-app gg' + (screen === 'project' ? ' mk-app--wide' : '');
    shell.innerHTML = screen === 'project' ? project() : today();
  }
  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go],[data-leaf],[data-proj]'); if (!t) return;
    if (t.dataset.go) { if (t.dataset.go !== 'today' && t.dataset.go !== 'project') return; screen = t.dataset.go; draw(); window.scrollTo(0, 0); return; }
    if (t.dataset.proj) { cur = +t.dataset.proj; draw(); return; }
    var k = t.dataset.leaf.split('-'), todo = data.projects[cur].works[+k[0]].todos[+k[1]];
    todo[2] = todo[2] ? 0 : 1; draw();
    var n = document.getElementById('leaf-' + t.dataset.leaf); if (n) { n.focus(); if (todo[2]) Giri.burst(n.querySelector('.mk-leaf__dot'), 'drops'); }
  });
  app.addEventListener('change', function (e) {
    var i = e.target.dataset && e.target.dataset.todo; if (i == null) return;
    todayList()[+i].t[2] = e.target.checked ? 1 : 0;
    if (e.target.checked) { Giri.burst(e.target, 'drops'); if (window.MK3D) window.MK3D.cheer(); }
    setTimeout(function () { draw(); }, 450);
  });
  draw();
})();
