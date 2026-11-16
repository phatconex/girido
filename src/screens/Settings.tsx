// Màn hình Cài đặt: nơi lưu dữ liệu, tài khoản. Xuất và nhập JSON chỉ hiện ở chế độ lưu trên máy; khi đã lưu lên Supabase thì không cần.
import { useRef, useState, type ChangeEvent } from 'react';
import GG from '../lib/logic';
import { useApp } from '../app-context';
import { useDialogs } from '../dialogs';

export default function Settings() {
  const { state: st, store, today, go, account } = useApp();
  const dialogs = useDialogs();
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const cloud = store.kind === 'supabase';

  const exportJson = () => {
    const json = JSON.stringify(GG.exportData(store.state(), new Date().toISOString()), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'girido-' + today + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dialogs.toast('Đã xuất file');
  };

  const importJson = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const show = (m: string) => { setError(m); if (file.current) file.current.value = ''; };
    f.text().then((text) => {
      let obj: unknown;
      try { obj = JSON.parse(text); } catch { return show('File này không phải JSON hợp lệ.'); }
      const r = GG.validateImport(obj);
      if (!r.ok) return show(r.error);
      show('');
      const s = r.summary;
      void dialogs.confirm({ title: 'Nhập dữ liệu từ file?', body: 'File có ' + s.projects + ' project, ' + s.works + ' công việc, ' + s.todos + ' việc, ' + s.trees + ' cây. Thay toàn bộ dữ liệu hiện tại?', yes: 'Thay dữ liệu', danger: true }).then((ok) => {
        if (!ok) return;
        void store.replaceAll(r.state).then((status) => {
          dialogs.toast(status === 'error' ? 'Đã nhập, nhưng chưa lưu được. Bấm Thử lại ở cuối trang nhé.' : 'Đã khôi phục dữ liệu');
          go('#hom-nay');
        });
      });
    }, () => show('Không đọc được file này.'));
  };

  return (
    <>
      <section className="mk-sec">
        <p className="mk-h1">Cài đặt</p>
        <p className="gg-muted">{cloud
          ? 'Dữ liệu tự lưu vào tài khoản của bạn mỗi khi bạn thay đổi, nên mở ở máy nào cũng thấy.'
          : 'Dữ liệu tự lưu trong trình duyệt này mỗi khi bạn thay đổi. Nó chỉ nằm trên máy này, nên thỉnh thoảng bạn xuất một bản JSON để phòng khi xóa dữ liệu duyệt web.'}</p>
      </section>

      {account && (
        <section className="mk-sec">
          <p className="mk-group">Tài khoản</p>
          <div className="mk-row">
            <p className="gg-muted mk-grow">Đang đăng nhập: {account.email}</p>
            <button className="gg-btn gg-btn--ghost mk-mini" id="sign-out" type="button" onClick={() => { void store.flush().then(() => account.signOut()); }}>Đăng xuất</button>
          </div>
        </section>
      )}

      {!cloud && <>
      <section className="mk-sec">
        <p className="mk-group">Sao lưu</p>
        <p className="gg-muted">Tải toàn bộ project, việc, cây và cảm xúc về máy thành một file JSON.</p>
        <div><button className="gg-btn" id="export-json" type="button" onClick={exportJson}>Xuất JSON</button></div>
      </section>

      <section className="mk-sec">
        <p className="mk-group">Khôi phục</p>
        <p className="gg-muted">Nhập lại một file JSON đã xuất, kể cả file xuất từ bản Giri Garden trên Claude. Dữ liệu hiện tại ({st.projects.length} project, {st.todos.length} việc) sẽ bị thay bằng dữ liệu trong file.</p>
        <input type="file" id="import-file" ref={file} accept="application/json,.json" aria-label="Chọn file JSON để nhập" onChange={importJson} />
        <p className="mk-error" id="import-error" role="alert">{error}</p>
      </section>
      </>}
    </>
  );
}
