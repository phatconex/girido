// Gốc của app. Chưa điền .env.local thì chạy ở chế độ lưu trên máy; đã nối Supabase thì cần đăng nhập.
import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { scene } from './lib/world';
import { skyAt } from './lib/daytime';
import { usePrefs } from './timers/prefs';
import { supabase } from './data/supabase';
import { createStore } from './data/store';
import { createLocalRepo } from './data/localRepo';
import { createSupabaseRepo } from './data/supabaseRepo';
import { DialogProvider } from './dialogs';
import Shell from './Shell';
import Auth from './screens/Auth';
import type { Account } from './app-context';

const SCENE = scene();
/** Cảnh nền. Sáng, chiều hay tối là do thuộc tính data-sky trên thẻ html quyết định (màu nằm trong app.css). */
function Scene() {
  const { scene: wanted } = usePrefs();
  const [auto, setAuto] = useState(() => skyAt(new Date()));
  useEffect(() => {
    const sync = () => setAuto(skyAt(new Date()));
    const id = setInterval(sync, 60000);
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const sky = wanted === 'auto' ? auto : wanted;
  useEffect(() => { document.documentElement.dataset.sky = sky; }, [sky]);
  return useMemo(() => <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: SCENE }} />, []);
}

function LocalApp() {
  const store = useMemo(() => createStore(createLocalRepo(), { delay: 120 }), []);
  return <DialogProvider><Shell store={store} account={null} /></DialogProvider>;
}

function CloudApp() {
  const db = supabase!;
  const [session, setSession] = useState<Session | null | undefined>(undefined);   // undefined: đang hỏi Supabase
  useEffect(() => {
    void db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = db.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [db]);
  const userId = session?.user.id, email = session?.user.email || '';
  const store = useMemo(() => (userId ? createStore(createSupabaseRepo(db, userId)) : null), [db, userId]);
  const account = useMemo<Account>(() => ({ email, signOut: async () => { await db.auth.signOut(); } }), [db, email]);

  if (session === undefined) return <main className="gd-auth gg"><p className="gg-bubble">Giri đang mở cổng rừng…</p></main>;
  if (!store) return <Auth db={db} />;
  return <DialogProvider><Shell key={userId} store={store} account={account} /></DialogProvider>;
}

export default function App() {
  return (
    <>
      <Scene />
      {supabase ? <CloudApp /> : <LocalApp />}
    </>
  );
}
