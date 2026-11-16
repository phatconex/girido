/* Màn hình Cài đặt: xuất và nhập JSON. */
(function () {
  'use strict';
  var h = GGShell.h, importError = '';

  function render(root, ctx) {
    var st = ctx.state;
    var json = function () { return JSON.stringify(GG.exportData(ctx.store.state(), new Date().toISOString()), null, 2); };
    root.appendChild(h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-h1', text: 'Cài đặt' }), h('p', { class: 'gg-muted', text: 'Dữ liệu tự lưu mỗi khi bạn thay đổi. Ở đây bạn có thể tải một bản sao về máy hoặc khôi phục từ bản sao.' })]));

    /* sao lưu */
    var backup = h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-group', text: 'Sao lưu' }), h('p', { class: 'gg-muted', text: 'Tải toàn bộ project, việc, cây và cảm xúc về máy thành một file JSON.' })]);
    var exportBtn = h('button', { class: 'gg-btn', id: 'export-json', type: 'button', text: 'Xuất JSON' });
    backup.appendChild(h('div', {}, [exportBtn]));
    var fallback = function () {
      if (document.getElementById('export-text')) return;
      var area = h('textarea', { class: 'mk-textarea', id: 'export-text', readonly: true, 'aria-label': 'Dữ liệu JSON' }); area.value = json();
      exportBtn.replaceWith(h('button', { class: 'gg-btn', id: 'export-copy', type: 'button', text: 'Chép JSON', onclick: function () {
        var done = function () { ctx.toast('Đã chép vào bộ nhớ tạm'); }, select = function () { area.focus(); area.select(); ctx.toast('Đã bôi đen, bạn bấm chép nhé'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(area.value).then(done, select); else select();
      } }));
      backup.appendChild(h('p', { class: 'gg-muted', text: 'Trang này chưa tải file xuống được, bạn chép nội dung dưới đây và lưu thành file .json.' }));
      backup.appendChild(area);
    };
    exportBtn.addEventListener('click', function () {
      var use = window.claude && window.claude.use ? window.claude.use('downloads') : Promise.resolve(null);
      Promise.resolve(use).then(function (dl) {
        if (!dl) return fallback();
        return dl.save({ filename: 'giri-garden-' + ctx.today + '.json', data: json() }).then(function () { ctx.toast('Đã xuất file'); }, function (e) {
          var code = e && e.code;
          if (code === 'declined') return;
          if (code === 'rate_limited') return ctx.toast('Đang có một lần tải chờ bạn xác nhận.');
          if (code === 'unavailable' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') return fallback();
          ctx.toast('Chưa xuất được file. Thử lại sau nhé.');
        });
      }, fallback);
    });
    root.appendChild(backup);

    /* khôi phục */
    var file = h('input', { type: 'file', id: 'import-file', accept: 'application/json,.json', 'aria-label': 'Chọn file JSON để nhập' });
    var err = h('p', { class: 'mk-error', id: 'import-error', role: 'alert', text: importError });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0]; if (!f) return;
      var show = function (m) { importError = m; err.textContent = m; file.value = ''; };
      f.text().then(function (text) {
        var obj; try { obj = JSON.parse(text); } catch (e) { return show('File này không phải JSON hợp lệ.'); }
        var r = GG.validateImport(obj);
        if (!r.ok) return show(r.error);
        show('');
        var s = r.summary;
        ctx.confirm({ title: 'Nhập dữ liệu từ file?', body: 'File có ' + s.projects + ' project, ' + s.works + ' công việc, ' + s.todos + ' việc, ' + s.trees + ' cây. Thay toàn bộ dữ liệu hiện tại?', yes: 'Thay dữ liệu', danger: true }).then(function (ok) {
          if (!ok) return;
          ctx.store.replaceAll(r.state).then(function (status) { ctx.toast(status === 'error' ? 'Đã nhập, nhưng chưa lưu được. Bấm Thử lại ở cuối trang nhé.' : 'Đã khôi phục dữ liệu'); ctx.go('#hom-nay'); });
        });
      }, function () { show('Không đọc được file này.'); });
    });
    root.appendChild(h('section', { class: 'mk-sec' }, [h('p', { class: 'mk-group', text: 'Khôi phục' }),
      h('p', { class: 'gg-muted', text: 'Nhập lại một file JSON đã xuất. Dữ liệu hiện tại (' + st.projects.length + ' project, ' + st.todos.length + ' việc) sẽ bị thay bằng dữ liệu trong file.' }), file, err]));
  }

  GGShell.register('cai-dat', { nav: { label: 'Cài đặt', order: 5, icon: 'gear' }, render: render });
})();
