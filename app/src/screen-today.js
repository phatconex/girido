/* Màn hình Hôm nay: ngày đang chọn, dải 7 ngày, ô thêm việc, việc trễ, danh sách việc gom theo project và công việc. */
(function () {
  'use strict';
  var h = GGShell.h, DOWS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  function lastWork(state) {
    var id = null; try { id = localStorage.getItem('gg-last-work'); } catch (e) {}
    if (id && GG.findWork(state, id)) return id;
    for (var i = 0; i < state.projects.length; i++) if (state.projects[i].works.length) return state.projects[i].works[0].id;
    return null;
  }

  function render(root, ctx) {
    var st = ctx.state, sel = GG.isDate(ctx.params) ? ctx.params : ctx.today, isToday = sel === ctx.today;
    var pr = GG.dayProgress(st, sel), late = isToday ? GG.overdue(st, ctx.today) : [], todos = GG.todosOn(st, sel);
    var hasWork = st.projects.some(function (p) { return p.works.length; }), week = GG.weekOf(sel);

    function row(t, o) {
      o = o || {};
      var box = h('input', { type: 'checkbox', class: 'gg-check', id: 'todo-' + t.id, 'aria-label': 'Xong: ' + t.text, checked: t.done });
      box.addEventListener('change', function () { ctx.tick(t, box); });
      return h('div', { class: 'mk-item' }, [box,
        h('button', { class: 'mk-item__btn', id: 'edit-' + t.id, type: 'button', 'aria-label': 'Sửa: ' + t.text, onclick: function () { ctx.editTodo(t); } }, [t.text, o.sub ? h('small', { text: o.sub }) : null]),
        o.extra || null]);
    }

    /* ---- đầu trang: ngày, dải 7 ngày, ô thêm việc ---- */
    var strip = h('div', { class: 'gg-days' }, week.map(function (d, i) {
      var planted = !!(st.days[d] && st.days[d].planted);
      return h('button', { class: 'gg-day' + (d === sel ? ' is-today' : '') + (planted ? ' is-done' : ''), id: 'day-' + d, type: 'button', 'aria-current': d === ctx.today ? 'date' : null, 'aria-pressed': String(d === sel),
        'aria-label': GGShell.fmtDate(d) + (planted ? ', đã trồng cây' : '') + (d === ctx.today ? ', hôm nay' : ''), onclick: function () { ctx.go(d === ctx.today ? '#hom-nay' : '#hom-nay-' + d); } },
        [DOWS[i], h('span', { class: 'gg-day__num', text: String(GG.parseDate(d).getDate()) }), h('span', { class: 'gg-day__mark' })]);
    }));
    var head = h('section', { class: 'mk-sec' }, [h('div', { class: 'mk-head' }, [
      h('div', {}, [
        h('p', { class: 'mk-h1', text: GGShell.fmtDate(sel) }),
        h('p', { class: 'gg-muted', text: !pr.total ? 'Chưa có việc nào' : pr.done === pr.total ? 'Xong cả ' + pr.total + ' việc' : 'Còn ' + (pr.total - pr.done) + ' / ' + pr.total + ' việc' + (isToday ? ' hôm nay' : '') }),
        isToday ? null : h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'back-today', type: 'button', text: 'Về hôm nay', style: 'margin-top:8px', onclick: function () { ctx.go('#hom-nay'); } })
      ]),
      h('div', { class: 'mk-week' }, [
        GGShell.iconBtn('back', 'Tuần trước', 'week-prev', function () { ctx.go('#hom-nay-' + GG.addDays(sel, -7)); }, 'gg-btn--ghost mk-navbtn'), strip,
        GGShell.iconBtn('next', 'Tuần sau', 'week-next', function () { ctx.go('#hom-nay-' + GG.addDays(sel, 7)); }, 'gg-btn--ghost mk-navbtn')
      ])
    ])]);
    if (!hasWork) {
      head.appendChild(h('button', { class: 'gg-btn gg-btn--lg', id: 'first-project', type: 'button', text: st.projects.length ? 'Thêm công việc cho project' : 'Tạo project đầu tiên', onclick: function () { ctx.go('#project'); } }));
    } else {
      var input = h('input', { class: 'gg-input', id: 'new-todo', type: 'text', placeholder: isToday ? 'Hôm nay bạn muốn làm gì?' : 'Thêm việc cho ngày này', 'aria-label': 'Việc mới', maxlength: '300' });
      var select = h('select', { class: 'mk-select', id: 'new-todo-work', 'aria-label': 'Thuộc công việc' }, st.projects.filter(function (p) { return p.works.length; }).map(function (p) {
        var g = h('optgroup', {}); g.label = p.name;
        p.works.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (w) { g.appendChild(h('option', { value: w.id, text: w.name })); });
        return g;
      }));
      select.value = lastWork(st);
      var add = function () {
        if (!input.value.trim()) { input.focus(); return; }
        try { localStorage.setItem('gg-last-work', select.value); } catch (e) {}
        var text = input.value, work = select.value; input.value = '';
        ctx.apply(function (s) { return GG.addTodo(s, { workId: work, text: text, date: sel }); });
        var n = document.getElementById('new-todo'); if (n) n.focus();
      };
      input.addEventListener('keydown', GGShell.onEnter(add));
      head.appendChild(h('div', { class: 'mk-add' }, [input, select, GGShell.iconBtn('plus', 'Thêm việc', 'add-todo', add, 'gg-btn--water')]));
    }
    root.appendChild(head);

    /* ---- việc trễ ---- */
    if (late.length) {
      root.appendChild(h('section', { class: 'mk-sec mk-sec--late' }, [
        h('div', { class: 'mk-row' }, [h('p', { class: 'mk-group mk-grow' }, ['Việc trễ ', h('span', { text: '· ' + late.length })]),
          h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'carry-all', type: 'button', text: 'Mang tất cả sang hôm nay', onclick: function () { ctx.apply(function (s) { return GG.carryOver(s, late.map(function (t) { return t.id; }), ctx.today); }); } })])
      ].concat(late.map(function (t) {
        var f = GG.findWork(st, t.workId);
        return row(t, { sub: 'Từ ' + GGShell.fmtDate(t.date) + (f ? ' · ' + f.project.name : ''), extra: h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'carry-' + t.id, type: 'button', text: 'Mang sang', onclick: function () { ctx.apply(function (s) { return GG.carryOver(s, [t.id], ctx.today); }); } }) });
      }))));
    }

    /* ---- danh sách, gom theo project và công việc ---- */
    var groups = {}, order = [];
    todos.forEach(function (t) { if (!groups[t.workId]) { groups[t.workId] = []; order.push(t.workId); } groups[t.workId].push(t); });
    order.forEach(function (wid) {
      var f = GG.findWork(st, wid);
      root.appendChild(h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-group' }, [f ? f.project.name + ' ' : '', h('span', { text: f ? '· ' + f.work.name : '' })])].concat(groups[wid].map(function (t) { return row(t); }))));
    });
    if (!todos.length && hasWork) root.appendChild(h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-empty', text: isToday ? 'Thêm việc đầu tiên của hôm nay ở ô phía trên. Xong hết việc là trồng được một cây.' : 'Ngày này chưa có việc nào.' })]));
  }

  GGShell.register('hom-nay', { nav: { label: 'Hôm nay', order: 1, icon: 'today' }, render: render });
})();
