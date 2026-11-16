/* Màn hình Khu vườn: khu đất của một tháng và khu vườn lớn của mọi tháng. */
(function () {
  'use strict';
  var h = GGShell.h;

  function plotScreen(root, ctx) {
    var st = ctx.state, nowMk = GG.monthKey(ctx.today), mk = GG.isMonthKey(ctx.params) ? ctx.params : nowMk;
    var days = GG.monthDays(st, mk), n = days.filter(Boolean).length, total = days.length, streak = GG.streak(st, ctx.today);
    var fresh = null; try { fresh = sessionStorage.getItem('gg-fresh'); sessionStorage.removeItem('gg-fresh'); } catch (e) {}
    var freshDay = fresh && GG.isDate(fresh) && GG.monthKey(fresh) === mk ? GG.parseDate(fresh).getDate() : 0;
    var plot = h('div', { class: 'mk-plot', id: 'month-plot', html: Giri.plot(days, { today: mk === nowMk ? GG.parseDate(ctx.today).getDate() : 0, fresh: freshDay, size: 520 }) });
    plot.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-day]') : null; if (!el) return;
      var d = mk + '-' + (el.getAttribute('data-day').length < 2 ? '0' : '') + el.getAttribute('data-day');
      ctx.go(d === ctx.today ? '#hom-nay' : '#hom-nay-' + d);
    });
    var nextBtn = GGShell.iconBtn('next', 'Tháng sau', 'month-next', function () { ctx.go('#khu-vuon-' + GG.shiftMonth(mk, 1)); }, 'gg-btn--ghost mk-navbtn');
    if (mk >= nowMk) nextBtn.disabled = true;
    root.appendChild(h('section', { class: 'mk-sec' }, [
      h('div', { class: 'mk-head' }, [
        GGShell.iconBtn('back', 'Tháng trước', 'month-prev', function () { ctx.go('#khu-vuon-' + GG.shiftMonth(mk, -1)); }, 'gg-btn--ghost mk-navbtn'),
        h('p', { class: 'mk-h1 mk-grow', text: 'Khu đất ' + GGShell.fmtMonth(mk).toLowerCase() }), nextBtn
      ]),
      h('p', { class: 'gg-muted', text: !n ? (mk === nowMk ? 'Khu đất tháng này còn trống. Xong hết việc trong ngày là trồng được cây đầu tiên.' : 'Tháng này chưa trồng cây nào.') : 'Chạm vào một cây hoặc một ô đất để mở việc của ngày đó.' }),
      plot
    ]));
    root.appendChild(h('section', { class: 'mk-sec' }, [
      h('div', { class: 'mk-row' }, [h('p', { class: 'mk-group mk-grow', text: n + ' / ' + total + ' cây trong tháng' }), streak ? h('span', { class: 'gg-chip gg-chip--sun', text: 'Chuỗi ' + streak + ' ngày' }) : null]),
      h('div', { class: 'gg-progress gg-progress--leaf', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(n), 'aria-label': 'Số cây đã trồng trong tháng' }, [h('div', { class: 'gg-progress__fill', style: '--value:' + (n / total * 100) + '%' })]),
      h('div', {}, [h('button', { class: 'gg-btn gg-btn--ghost', id: 'open-trail', type: 'button', text: 'Xem khu vườn lớn', onclick: function () { ctx.go('#khu-vuon-lon'); } })])
    ]));
    if (freshDay) { var tree = plot.querySelector('.gg-pl-tree.is-new'); if (tree) setTimeout(function () { Giri.burst(tree, 'confetti'); }, 250); }
  }

  function trailScreen(root, ctx) {
    var st = ctx.state, keys = {}, months, count = 0;
    Object.keys(st.days).forEach(function (d) { if (st.days[d].planted) { keys[GG.monthKey(d)] = 1; count++; } });
    months = Object.keys(keys).sort().reverse().map(function (mk) { return { key: mk, name: GGShell.fmtMonth(mk), days: GG.monthDays(st, mk) }; });
    var sec = h('section', { class: 'mk-sec' }, [h('div', { class: 'mk-head' }, [
      GGShell.iconBtn('back', 'Về khu đất tháng', 'go-back', function () { ctx.go('#khu-vuon'); }, 'gg-btn--ghost mk-navbtn'),
      h('p', { class: 'mk-h1 mk-grow', text: 'Khu vườn lớn' }), h('span', { class: 'gg-chip gg-chip--leaf', text: count + ' cây' })
    ])]);
    root.appendChild(sec);
    if (!months.length) { sec.appendChild(h('p', { class: 'mk-empty', text: 'Chưa có cây nào. Xong hết việc hôm nay là có cây đầu tiên.' })); return; }
    var trail = h('div', { class: 'mk-trail', id: 'garden-trail', html: Giri.trail(months, window.innerWidth >= 700 ? { per: 12, size: 58 } : { per: 8, size: 46 }) });
    trail.addEventListener('click', function (e) { var el = e.target.closest ? e.target.closest('[data-month]') : null; if (el) ctx.go('#khu-vuon-' + el.getAttribute('data-month')); });
    sec.appendChild(trail);
  }

  GGShell.register('khu-vuon', { nav: { label: 'Khu vườn', order: 3, icon: 'garden' }, render: plotScreen });
  GGShell.register('khu-vuon-lon', { navGroup: 'khu-vuon', render: trailScreen });
})();
