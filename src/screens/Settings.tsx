// Màn hình Cài đặt: nơi lưu dữ liệu, tài khoản, pomodoro, nhắc uống nước và đứng dậy. Xuất và nhập JSON chỉ hiện ở chế độ lưu trên máy; khi đã lưu lên Supabase thì không cần.
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import GG from '../lib/logic';
import { useApp } from '../app-context';
import { useDialogs } from '../dialogs';
import { prefs, usePrefs, LIMITS, type Prefs } from '../timers/prefs';
import { chime, unlock, askNotify, stopSound, STYLES, FILES, type Chime } from '../timers/sound';
import { Picker, type Option } from '../WorkPicker';

const SCENE_OPTIONS: Option[] = [
  { id: 'auto', name: 'Tự đổi theo giờ', project: '' },
  { id: 'day', name: 'Luôn buổi sáng', project: '' },
  { id: 'dusk', name: 'Luôn buổi chiều', project: '' },
  { id: 'night', name: 'Luôn buổi tối', project: '' },
];
const SOUND_OPTIONS: Option[] = [
  ...FILES.map((f) => ({ id: f.id, name: f.name, project: 'File âm thanh' })),
  ...STYLES.map((s) => ({ id: s.id, name: s.name, project: 'Tiếng tổng hợp' })),
];

/** Ô nhập số phút: gõ tự do, rời ô thì kéo về khoảng cho phép và lưu. */
function Minutes({ id, label, field, disabled }: { id: string; label: string; field: keyof typeof LIMITS; disabled?: boolean }) {
  const p = usePrefs();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => { if (draft !== null && draft.trim() !== '' && Number.isFinite(+draft)) prefs.set({ [field]: +draft } as Partial<Prefs>); setDraft(null); };
  return (
    <label className="mk-min">
      <input className="gg-input" id={id} type="number" inputMode="numeric" min={LIMITS[field][0]} max={LIMITS[field][1]} step={1} disabled={disabled} aria-label={label}
        value={draft ?? String(p[field])} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
      phút
    </label>
  );
}

function Switch({ id, label, hint, on, onChange, children }: { id: string; label: string; hint?: string; on: boolean; onChange: (on: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="mk-set">
      <button className="mk-switch" id={id} type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}><span /></button>
      <p className="mk-set__text"><b>{label}</b>{hint}</p>
      {children}
    </div>
  );
}

export default function Settings() {
  const { state: st, store, today, go, account } = useApp();
  const dialogs = useDialogs();
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const cloud = store.kind === 'supabase';
  useEffect(() => stopSound, []);   // rời màn Cài đặt thì tắt tiếng đang nghe thử
  const p = usePrefs();
  const remind = (patch: Partial<Prefs>, on: boolean) => { if (on) { unlock(); askNotify(); } prefs.set(patch); };
  const test = (kind: Chime, style: string, volume = p.volume) => { unlock(); chime(kind, style, volume); };
  // chọn một kiểu âm báo là nghe thử luôn kiểu đó
  const sound = (field: 'soundWater' | 'soundStand' | 'soundPomo', kind: Chime) => (
    <Picker id={'pref-' + field} cls="mk-pick--sound" options={SOUND_OPTIONS} value={p[field]} label="Âm báo" what="âm báo"
      onChange={(id) => { prefs.set({ [field]: id } as Partial<Prefs>); test(kind, id); }} />
  );

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

      <section className="mk-sec">
        <p className="mk-group">Phong cảnh</p>
        <div className="mk-set">
          <p className="mk-set__text"><b>Khung cảnh nền</b>Sáng từ 5 giờ, chiều vàng từ 15 giờ, tối có trăng sao từ 18 giờ 30</p>
          <Picker id="pref-scene" cls="mk-pick--sound" options={SCENE_OPTIONS} value={p.scene} label="Phong cảnh" what="phong cảnh" onChange={(id) => prefs.set({ scene: id as Prefs['scene'] })} />
        </div>
      </section>

      <section className="mk-sec">
        <p className="mk-group">Pomodoro</p>
        <p className="gg-muted">Bấm nút ▶ cạnh một việc ở màn Hôm nay để bắt đầu. Số phút dưới đây là mặc định; khi đồng hồ đang chạy bạn đổi được thời lượng riêng cho việc đó. Hết giờ tập trung thì việc đó được cộng một pomodoro, rồi tới giờ nghỉ.</p>
        <div className="mk-set">
          <p className="mk-set__text"><b>Tập trung</b>Độ dài một pomodoro</p>
          <Minutes id="pref-focus" label="Số phút tập trung" field="focusMin" />
        </div>
        <div className="mk-set">
          <p className="mk-set__text"><b>Nghỉ</b>Sau mỗi pomodoro</p>
          <Minutes id="pref-break" label="Số phút nghỉ" field="breakMin" />
        </div>
        <div className="mk-set">
          <p className="mk-set__text"><b>Âm báo hết giờ</b>Khi xong một pomodoro và khi hết giờ nghỉ</p>
          {sound('soundPomo', 'focus')}
        </div>
      </section>

      <section className="mk-sec">
        <p className="mk-group">Nhắc nhở</p>
        <Switch id="pref-water" label="Nhắc uống nước" hint="Nhắc lại sau mỗi" on={p.waterOn} onChange={(on) => remind({ waterOn: on }, on)}>
          {sound('soundWater', 'water')}
          <Minutes id="pref-water-min" label="Số phút giữa hai lần nhắc uống nước" field="waterMin" disabled={!p.waterOn} />
        </Switch>
        <Switch id="pref-stand" label="Nhắc đứng dậy" hint="Nhắc lại sau mỗi" on={p.standOn} onChange={(on) => remind({ standOn: on }, on)}>
          {sound('soundStand', 'stand')}
          <Minutes id="pref-stand-min" label="Số phút giữa hai lần nhắc đứng dậy" field="standMin" disabled={!p.standOn} />
        </Switch>
        <Switch id="pref-sound" label="Âm báo" hint="Cho nhắc nhở và pomodoro" on={p.sound} onChange={(on) => { prefs.set({ sound: on }); if (on) test('water', p.soundWater); else stopSound(); }}>
          <label className="mk-vol">Âm lượng
            <input id="pref-volume" type="range" min={0} max={100} step={5} value={p.volume} disabled={!p.sound} aria-label="Âm lượng âm báo"
              onChange={(e) => prefs.set({ volume: +e.target.value })} onPointerUp={(e) => test('water', p.soundWater, +e.currentTarget.value)} onKeyUp={(e) => test('water', p.soundWater, +e.currentTarget.value)} />
          </label>
        </Switch>
        <p className="gg-muted">Girido chỉ nhắc được khi đang mở trong một tab. Đồng hồ đếm lại từ đầu mỗi khi bạn bật hoặc đổi số phút. Các cài đặt ở mục Pomodoro và Nhắc nhở lưu riêng cho trình duyệt này.</p>
      </section>

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
