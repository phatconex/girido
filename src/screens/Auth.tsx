// Màn hình đăng nhập (chỉ hiện khi đã nối Supabase): email và mật khẩu, quên mật khẩu, và đặt mật khẩu mới.
import { useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Giri from '../lib/giri';
import { Html } from '../ui';

const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email hoặc mật khẩu chưa đúng.'],
  [/already registered|already been registered/i, 'Email này đã có tài khoản. Bạn chuyển sang Đăng nhập nhé.'],
  [/email not confirmed/i, 'Email chưa được xác nhận. Bạn mở thư Girido gửi và bấm vào đường link trong đó.'],
  [/password should be at least/i, 'Mật khẩu cần ít nhất 6 ký tự.'],
  [/same password|different from the old/i, 'Mật khẩu mới phải khác mật khẩu cũ.'],
  [/expired|invalid.*(link|token)|otp/i, 'Đường link này đã hết hạn hoặc đã dùng rồi. Bạn bấm Quên mật khẩu để nhận link mới nhé.'],
  [/rate limit|too many|security purposes/i, 'Bạn thử nhiều lần quá, đợi một lát rồi thử lại nhé.'],
  [/failed to fetch|network/i, 'Chưa nối được tới máy chủ. Kiểm tra mạng rồi thử lại.'],
];
export const explain = (m: string) => (MESSAGES.find(([re]) => re.test(m)) || [null, 'Chưa làm được: ' + m])[1];

/** Lỗi Supabase gắn trên địa chỉ khi link trong thư không dùng được (ví dụ #error_code=otp_expired). Đọc xong thì dọn địa chỉ. */
function linkError(): string {
  const raw = window.location.hash.slice(1);
  if (!/(^|&)error(_code|_description)?=/.test(raw)) return '';
  const q = new URLSearchParams(raw), msg = q.get('error_description') || q.get('error_code') || q.get('error') || '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return explain(msg.replace(/\+/g, ' '));
}

export default function Auth({ db }: { db: SupabaseClient }) {
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  // link trong thư hết hạn thì Supabase đưa về kèm lỗi trên địa chỉ: báo cho người dùng biết thay vì im lặng
  const [error, setError] = useState(() => linkError());
  const [note, setNote] = useState('');
  const go = (m: typeof mode) => { setMode(m); setError(''); setNote(''); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNote('');
    try {
      if (mode === 'forgot') {
        const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + window.location.pathname });
        if (error) setError(explain(error.message));
        else setNote('Nếu ' + email.trim() + ' đã có tài khoản, Girido vừa gửi thư kèm đường link đặt lại mật khẩu. Bạn mở thư và bấm link đó nhé (nhớ xem cả hộp thư rác).');
      } else if (mode === 'in') {
        const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(explain(error.message));
      } else {
        const { data, error } = await db.auth.signUp({ email: email.trim(), password });
        if (error) setError(explain(error.message));
        else if (!data.session) setNote('Girido vừa gửi thư xác nhận tới ' + email.trim() + '. Bạn bấm đường link trong thư rồi quay lại đăng nhập.');
      }
    } catch (err) {
      setError(explain(err instanceof Error ? err.message : String(err)));
    } finally { setBusy(false); }
  };

  return (
    <main className="gd-auth gg">
      <div className="gd-auth__giri">
        <p className="gg-bubble mk-bubble-down"><span className="gg-tag">Giri</span>{mode === 'in' ? 'Chào bạn quay lại! Đăng nhập để vào khu rừng của bạn nhé.' : mode === 'up' ? 'Tạo tài khoản để khu rừng của bạn đi theo bạn sang mọi máy.' : 'Quên mật khẩu hả? Hong sao, nhập email đi mình gửi link đặt lại cho.'}</p>
        <Html html={Giri.mascot(mode === 'forgot' ? 'sad' : 'happy', 130)} block />
      </div>
      <form className="gg-card gd-auth__card" onSubmit={(e) => { void submit(e); }}>
        {mode === 'forgot' ? <p className="gg-title">Quên mật khẩu</p> : (
          <div className="gg-tabs" role="tablist" aria-label="Đăng nhập hay tạo tài khoản" style={{ alignSelf: 'flex-start' }}>
            <button className="gg-tab" role="tab" id="auth-in" type="button" aria-selected={mode === 'in'} onClick={() => go('in')}>Đăng nhập</button>
            <button className="gg-tab" role="tab" id="auth-up" type="button" aria-selected={mode === 'up'} onClick={() => go('up')}>Tạo tài khoản</button>
          </div>
        )}
        <label className="mk-field">Email
          <input className="gg-input" id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== 'forgot' && (
          <label className="mk-field">Mật khẩu
            <input className="gg-input" id="auth-password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        {error && <p className="mk-error" role="alert">{error}</p>}
        {note && <p className="gg-muted" role="status">{note}</p>}
        <button className="gg-btn gg-btn--lg" id="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang gửi…' : mode === 'in' ? 'Đăng nhập' : mode === 'up' ? 'Tạo tài khoản' : 'Gửi link đặt lại mật khẩu'}</button>
        {mode === 'in' && <button className="mk-linkbtn gd-auth__link" id="auth-forgot" type="button" onClick={() => go('forgot')}>Quên mật khẩu?</button>}
        {mode === 'forgot' && <button className="mk-linkbtn gd-auth__link" id="auth-back" type="button" onClick={() => go('in')}>Quay lại đăng nhập</button>}
      </form>
    </main>
  );
}

/** Người dùng vừa bấm link đặt lại mật khẩu trong thư: Supabase đã đăng nhập tạm cho họ, giờ đặt mật khẩu mới. */
export function NewPassword({ db, email, onDone }: { db: SupabaseClient; email: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password !== again) { setError('Hai lần nhập mật khẩu chưa giống nhau.'); return; }
    setBusy(true); setError('');
    try {
      const { error } = await db.auth.updateUser({ password });
      if (error) setError(explain(error.message)); else onDone();
    } catch (err) {
      setError(explain(err instanceof Error ? err.message : String(err)));
    } finally { setBusy(false); }
  };
  return (
    <main className="gd-auth gg">
      <div className="gd-auth__giri">
        <p className="gg-bubble mk-bubble-down"><span className="gg-tag">Giri</span>Tới rồi nè! Đặt mật khẩu mới đi rồi mình mở cổng rừng cho.</p>
        <Html html={Giri.mascot('cheer', 130)} block />
      </div>
      <form className="gg-card gd-auth__card" onSubmit={(e) => { void submit(e); }}>
        <p className="gg-title">Đặt mật khẩu mới</p>
        {email && <p className="gg-muted">Tài khoản: {email}</p>}
        <label className="mk-field">Mật khẩu mới
          <input className="gg-input" id="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="mk-field">Nhập lại mật khẩu mới
          <input className="gg-input" id="new-password-again" type="password" autoComplete="new-password" required minLength={6} value={again} onChange={(e) => setAgain(e.target.value)} />
        </label>
        {error && <p className="mk-error" role="alert">{error}</p>}
        <button className="gg-btn gg-btn--lg" id="new-password-save" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</button>
        <button className="mk-linkbtn gd-auth__link" id="new-password-skip" type="button" onClick={onDone}>Để sau, vào app luôn</button>
      </form>
    </main>
  );
}
