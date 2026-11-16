/* Màn hình Cảm xúc: lọ cảm xúc của tháng và năm mức để chọn cho hôm nay. */
(function () {
  'use strict';
  var h = GGShell.h, cache = { mk: null, el: null, jar: null, sig: '' };

  function render(root, ctx) {
    var st = ctx.state, nowMk = GG.monthKey(ctx.today), mk = GG.isMonthKey(ctx.params) ? ctx.params : nowMk;
    var moods = GG.monthMoods(st, mk), mine = (st.days[ctx.today] || {}).mood || 0, current = mk === nowMk;
    if (cache.mk !== mk || !cache.jar || cache.sig !== moods.join('')) {
      cache.mk = mk; cache.sig = moods.join(''); cache.el = h('div', { class: 'mk-jar', id: 'mood-jar' }); cache.jar = Giri.jarLive(cache.el, moods, 240);
    }
    var nextBtn = GGShell.iconBtn('next', 'Tháng sau', 'mood-next', function () { ctx.go('#cam-xuc-' + GG.shiftMonth(mk, 1)); }, 'gg-btn--ghost mk-navbtn');
    if (mk >= nowMk) nextBtn.disabled = true;
    root.appendChild(h('section', { class: 'mk-sec' }, [
      h('div', { class: 'mk-head' }, [
        GGShell.iconBtn('back', 'Tháng trước', 'mood-prev', function () { ctx.go('#cam-xuc-' + GG.shiftMonth(mk, -1)); }, 'gg-btn--ghost mk-navbtn'),
        h('p', { class: 'mk-h1 mk-grow', text: 'Lọ cảm xúc ' + GGShell.fmtMonth(mk).toLowerCase() }), h('span', { class: 'gg-chip', text: moods.length + ' viên' }), nextBtn
      ]),
      cache.el
    ]));
    var sec = h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-group', text: current ? 'Hôm nay bạn thấy thế nào?' : 'Cảm xúc của tháng' })]);
    if (current) {
      sec.appendChild(h('div', { class: 'gg-moods' }, Giri.feelings.map(function (name, i) {
        var level = i + 1;
        return h('button', { class: 'gg-mood', id: 'mood-' + level, type: 'button', 'aria-pressed': String(mine === level), onclick: function () {
          if (GGShell.syncDay() || mine === level) return;
          if (mine) { cache.jar.setLast(level); cache.sig = cache.sig.slice(0, -1) + level; } else { cache.jar.add(level); cache.sig += level; }
          ctx.apply(function (s) { return GG.setMood(s, ctx.today, level); });
        } }, [h('span', { style: 'display:contents', html: Giri.orb(level, 44) }), name]);
      })));
    } else sec.appendChild(h('p', { class: 'mk-empty', text: moods.length ? 'Chỉ ghi được cảm xúc cho hôm nay.' : 'Tháng này chưa ghi cảm xúc nào.' }));
    root.appendChild(sec);
  }

  GGShell.register('cam-xuc', { nav: { label: 'Cảm xúc', order: 4, icon: 'mood' }, render: render });
})();
