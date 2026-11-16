/* Màn hình Project: mindmap. Gốc bên trái là project, giữa là các công việc, lá bên phải là từng việc; đường nối chuyển xanh khi việc đã xong. */
(function () {
  'use strict';
  var h = GGShell.h, ROW = 50, X = [0, 262, 572], open = {};   // open[workId]: đang mở hết các việc đã xong
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function render(root, ctx) {
    var st = ctx.state, p = st.projects.filter(function (x) { return x.id === ctx.params; })[0] || st.projects[0];
    var newProject = function () { ctx.ask({ title: 'Project mới', placeholder: 'Project của bạn tên gì?', yes: 'Tạo project' }).then(function (v) {
      if (typeof v !== 'string') return;
      ctx.apply(function (s) { return GG.addProject(s, v, ctx.today); }, { silent: true });
      var all = ctx.store.state().projects; ctx.go('#project-' + all[all.length - 1].id);
    }); };

    if (!p) {
      root.appendChild(h('section', { class: 'mk-sec' }, [
        h('p', { class: 'mk-h1', text: 'Project' }),
        h('p', { class: 'mk-empty', text: 'Chưa có project nào. Đặt tên cho việc lớn bạn muốn làm, rồi chia nó thành các công việc nhỏ.' }),
        h('div', {}, [h('button', { class: 'gg-btn', id: 'proj-new', type: 'button', text: 'Tạo project đầu tiên', onclick: newProject })])
      ]));
      return;
    }
    var ps = GG.projectStats(st, p.id), works = p.works.slice().sort(function (a, b) { return a.order - b.order; });

    /* ---- đầu bảng: chọn project, đổi tên, xóa ---- */
    root.appendChild(h('section', { class: 'mk-sec' }, [
      h('div', { class: 'mk-head' }, [h('p', { class: 'mk-h1 mk-grow', text: 'Project' }), h('div', { class: 'mk-row' }, st.projects.map(function (q) {
        return h('button', { class: 'gg-btn ' + (q.id === p.id ? '' : 'gg-btn--ghost ') + 'mk-mini', id: 'proj-' + q.id, type: 'button', 'aria-pressed': String(q.id === p.id), text: q.name + ' · ' + GG.projectStats(st, q.id).pct + '%', onclick: function () { ctx.go('#project-' + q.id); } });
      }).concat([h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'proj-new', type: 'button', text: '+ Project mới', onclick: newProject })]))]),
      h('div', { class: 'mk-row' }, [
        h('p', { class: 'gg-muted mk-grow', text: 'Bấm vòng tròn để tick xong, bấm chữ để sửa. Đường nối chuyển xanh khi việc đã xong.' }),
        h('button', { class: 'gg-btn gg-btn--ghost mk-mini', id: 'rename-project', type: 'button', text: 'Đổi tên', onclick: function () { ctx.ask({ title: 'Đổi tên project', value: p.name }).then(function (v) { if (typeof v === 'string') ctx.apply(function (s) { return GG.renameProject(s, p.id, v); }); }); } }),
        h('button', { class: 'gg-btn gg-btn--clay mk-mini', id: 'delete-project', type: 'button', text: 'Xóa project', onclick: function () {
          ctx.confirm({ title: 'Xóa project "' + p.name + '"?', body: 'Xóa project này cùng ' + works.length + ' công việc và ' + ps.total + ' việc bên trong? Cây đã trồng vẫn còn.', yes: 'Xóa project', danger: true }).then(function (ok) {
            if (!ok) return;
            ctx.apply(function (s) { return GG.deleteProject(s, p.id); }, { silent: true }); ctx.toast('Đã xóa project'); ctx.go('#project');
          });
        } })
      ])
    ]));

    /* ---- mindmap ---- */
    var mind = h('div', { class: 'mk-mind' }), links = '', y = 8, centers = [];
    var place = function (el, x, top) { el.style.left = x + 'px'; el.style.top = top + 'px'; mind.appendChild(el); };
    works.forEach(function (w, wi) {
      var top = y, ws = GG.workStats(st, w.id), cys = [];
      var todos = st.todos.filter(function (t) { return t.workId === w.id; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      /* việc đã xong nhiều thì gộp thành một lá, để nhánh không dài lê thê */
      var doneList = todos.filter(function (t) { return t.done; }), fold = doneList.length > 3 && !open[w.id];
      if (doneList.length > 3) {
        place(h('button', { class: 'mk-node mk-leaf is-done', id: 'fold-' + w.id, type: 'button', 'aria-expanded': String(!fold), onclick: function () { open[w.id] = fold; ctx.rerender(); } }, [
          h('span', { class: 'mk-leaf__dot', text: '\u2713' }), h('span', { class: 'mk-leaf__text', style: 'text-decoration:none', text: doneList.length + ' việc đã xong' }), h('span', { class: 'gg-chip gg-chip--leaf', text: fold ? 'Mở ra' : 'Thu lại' })
        ]), X[2], y);
        cys.push({ cy: y + 20, done: true }); y += ROW;
      }
      (fold ? todos.filter(function (t) { return !t.done; }) : todos).forEach(function (t) {
        var late = !t.done && t.date < ctx.today, isNow = t.date === ctx.today;
        var dot = h('button', { class: 'mk-leaf__dot', id: 'leaf-' + t.id, type: 'button', 'aria-pressed': String(t.done), 'aria-label': (t.done ? 'Bỏ tick: ' : 'Xong: ') + t.text, text: t.done ? '✓' : '' });
        dot.addEventListener('click', function () { ctx.tick(t, dot); });
        place(h('div', { class: 'mk-node mk-leaf' + (t.done ? ' is-done' : '') }, [dot,
          h('button', { class: 'mk-leaf__text', id: 'leaf-edit-' + t.id, type: 'button', 'aria-label': 'Sửa: ' + t.text, text: t.text, onclick: function () { ctx.editTodo(t); } }),
          h('span', { class: 'gg-chip' + (isNow ? ' gg-chip--sun' : late ? ' gg-chip--ember' : ''), text: isNow ? 'Hôm nay' : (late ? 'Trễ ' : '') + GGShell.fmtShort(t.date) })
        ]), X[2], y);
        cys.push({ cy: y + 20, done: t.done }); y += ROW;
      });
      place(h('button', { class: 'mk-node mk-leaf mk-leaf--add', id: 'add-leaf-' + w.id, type: 'button', text: '+ Thêm việc', onclick: function () {
        ctx.askTodo({ title: 'Thêm việc cho "' + w.name + '"', date: ctx.today, yes: 'Thêm việc' }).then(function (r) { if (r && !r.danger) ctx.apply(function (s) { return GG.addTodo(s, { workId: w.id, text: r.text, date: r.date }); }); });
      } }), X[2], y);
      y += ROW;
      var wy = (top + y - ROW) / 2 + 20, cls = ws.status === 'done' ? ' is-done' : ws.status === 'now' ? ' is-now' : '';
      place(h('button', { class: 'mk-node mk-work gg-work' + cls, id: 'work-' + w.id, type: 'button', 'aria-label': 'Sửa công việc ' + w.name, onclick: function () {
        ctx.ask({ title: 'Công việc', value: w.name, danger: 'Xóa công việc' }).then(function (v) {
          if (typeof v === 'string') { ctx.apply(function (s) { return GG.renameWork(s, w.id, v); }); return; }
          if (!v || !v.danger) return;
          ctx.confirm({ title: 'Xóa công việc "' + w.name + '"?', body: 'Xóa công việc này cùng ' + ws.total + ' việc bên trong? Cây đã trồng vẫn còn.', yes: 'Xóa công việc', danger: true }).then(function (ok) { if (ok) { ctx.apply(function (s) { return GG.deleteWork(s, w.id); }); ctx.toast('Đã xóa công việc'); } });
        });
      } }, [h('span', { class: 'gg-work__num', text: pad2(wi + 1) }), h('span', { class: 'gg-work__name' }, [w.name, h('span', { class: 'gg-work__meta', text: ws.done + ' / ' + ws.total + ' việc' })])]), X[1], wy - 28);
      cys.forEach(function (c) { links += '<path class="mk-link' + (c.done ? ' mk-link--done' : '') + '" d="M' + (X[1] + 250) + ' ' + wy + ' C' + (X[1] + 290) + ' ' + wy + ' ' + (X[2] - 44) + ' ' + c.cy + ' ' + X[2] + ' ' + c.cy + '"/>'; });
      centers.push({ y: wy, done: ws.status === 'done' });
      y += 20;
    });
    place(h('button', { class: 'mk-node mk-leaf mk-leaf--add', id: 'add-work', type: 'button', text: '+ Thêm công việc', onclick: function () {
      ctx.ask({ title: 'Công việc mới của "' + p.name + '"', placeholder: 'Chia project thành công việc gì?', yes: 'Thêm công việc' }).then(function (v) { if (typeof v === 'string') ctx.apply(function (s) { return GG.addWork(s, p.id, v); }); });
    } }), X[1], y);
    var H = Math.max(y + 56, 200), ry = centers.length ? (centers[0].y + centers[centers.length - 1].y) / 2 : 90;
    centers.forEach(function (c) { links += '<path class="mk-link' + (c.done ? ' mk-link--done' : '') + '" d="M190 ' + ry + ' C230 ' + ry + ' 222 ' + c.y + ' ' + X[1] + ' ' + c.y + '"/>'; });
    place(h('div', { class: 'mk-node mk-root', id: 'mind-root' }, [
      h('p', { class: 'mk-root__name', text: p.name }),
      h('span', { class: 'gg-chip' + (ps.total && ps.done === ps.total ? ' gg-chip--leaf' : ''), text: ps.total ? ps.done + ' / ' + ps.total + ' việc · ' + ps.pct + '%' : 'Chưa có việc' }),
      h('div', { class: 'gg-progress gg-progress--leaf', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(ps.pct), 'aria-label': 'Tiến độ của ' + p.name }, [h('div', { class: 'gg-progress__fill', style: '--value:' + ps.pct + '%' })])
    ]), 0, Math.max(0, ry - 64));
    mind.style.height = H + 'px';
    mind.insertBefore(h('span', { style: 'display:contents', html: '<svg aria-hidden="true">' + links + '</svg>' }).firstChild, mind.firstChild);
    root.appendChild(h('div', { class: 'mk-mindwrap' }, [mind]));
  }

  GGShell.register('project', { nav: { label: 'Project', order: 2, icon: 'project' }, wide: true, render: render });
})();
