// Màn hình đăng nhập (chỉ hiện khi đã nối Supabase): email và mật khẩu.
import { useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Giri from '../lib/giri';
import { Html } from '../ui';

const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email hoặc mật khẩu chưa đúng.'],
  [/already registered|already been registered/i, 'Email này đã có tài khoản. Bạn chuyển sang Đăng nhập nhé.'],
  [/email not confirmed/i, 'Email chưa được xác nhận. Bạn mở thư Girido gửi và bấm vào đường link trong đó.'],
  [/password should be at least/i, 'Mật khẩu cần ít nhất 6 ký tự.'],
  [/rate limit|too many/i, 'Bạn thử nhiều lần quá, đợi một lát rồi thử lại nhé.'],
  [/failed to fetch|network/i, 'Chưa nối được tới máy chủ. Kiểm tra mạng rồi thử lại.'],
];
const explain = (m: string) => (MESSAGES.find(([re]) => re.test(m)) || [null, 'Chưa làm được: ' + m])[1];

export default function Auth({ db }: { db: SupabaseClient }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNote('');
    try {
      if (mode === 'in') {
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
        <p className="gg-bubble mk-bubble-down"><span className="gg-tag">Giri</span>{mode === 'in' ? 'Chào bạn quay lại! Đăng nhập để vào khu rừng của bạn nhé.' : 'Tạo tài khoản để khu rừng của bạn đi theo bạn sang mọi máy.'}</p>
        <Html html={Giri.mascot('happy', 130)} block />
      </div>
      <form className="gg-card gd-auth__card" onSubmit={(e) => { void submit(e); }}>
        <div className="gg-tabs" role="tablist" aria-label="Đăng nhập hay tạo tài khoản" style={{ alignSelf: 'flex-start' }}>
          <button className="gg-tab" role="tab" id="auth-in" type="button" aria-selected={mode === 'in'} onClick={() => { setMode('in'); setError(''); setNote(''); }}>Đăng nhập</button>
          <button className="gg-tab" role="tab" id="auth-up" type="button" aria-selected={mode === 'up'} onClick={() => { setMode('up'); setError(''); setNote(''); }}>Tạo tài khoản</button>
        </div>
        <label className="mk-field">Email
          <input className="gg-input" id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mk-field">Mật khẩu
          <input className="gg-input" id="auth-password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="mk-error" role="alert">{error}</p>}
        {note && <p className="gg-muted" role="status">{note}</p>}
        <button className="gg-btn gg-btn--lg" id="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang gửi…' : mode === 'in' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
      </form>
    </main>
  );
}
