// Khung app: thanh trạng thái của cây hôm nay, Giri đứng trong cảnh, và một bảng duy nhất có thẻ chọn màn hình.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import GG from './lib/logic';
import type { State, Todo } from './lib/logic';
import Giri, { type GiriMood } from './lib/giri';
import type { Store } from './data/store';
import { AppContext, type Account, type AppCtx } from './app-context';
import { useDialogs } from './dialogs';
import { Html, Icon, Progress, fmtMonth, type IconName } from './ui';
import Today from './screens/Today';
import Projects from './screens/Projects';
import { GardenPlot, GardenTrail } from './screens/Garden';
import Mood from './screens/Mood';
import Settings from './screens/Settings';
import Notes from './screens/Notes';
import Welcome, { welcomed, markWelcomed, WELCOME_EVENT } from './Welcome';
import Timers from './timers/Timers';
import { greeting, periodAt, focusLine, pomoDoneLine, pokeLine, missedLine } from './lib/daytime';
import { usePomodoro } from './timers/pomodoro';

/** Timers báo "vừa xong một pomodoro" qua sự kiện này để Giri ăn mừng. */
export const POMO_DONE_EVENT = 'girido:pomo-done';

// lần gần nhất mở app trên máy này: để Giri biết đã lâu chưa gặp. Đọc một lần lúc mở, rồi ghi lại hôm nay.
const VISIT_KEY = 'girido-last-visit';
let lastVisit: string | null | undefined;      // undefined: chưa đọc. Đọc đúng một lần cho mỗi lần tải trang.
function readLastVisit(today: string): string | null {
  if (lastVisit !== undefined) return lastVisit;
  try { lastVisit = localStorage.getItem(VISIT_KEY); localStorage.setItem(VISIT_KEY, today); } catch { lastVisit = null; }
  return lastVisit;
}

const SCREENS: Record<string, { tab: string; wide?: boolean }> = {
  'hom-nay': { tab: 'hom-nay' },
  'project': { tab: 'project', wide: true },
  'ghi-chu': { tab: 'ghi-chu' },
  'khu-vuon': { tab: 'khu-vuon' },
  'khu-vuon-lon': { tab: 'khu-vuon' },
  'cam-xuc': { tab: 'cam-xuc' },
  'cai-dat': { tab: 'cai-dat' },
};
const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'hom-nay', label: 'Hôm nay', icon: 'today' },
  { name: 'project', label: 'Project', icon: 'project' },
  { name: 'ghi-chu', label: 'Ghi chú', icon: 'note' },
  { name: 'khu-vuon', label: 'Khu vườn', icon: 'garden' },
  { name: 'cam-xuc', label: 'Cảm xúc', icon: 'mood' },
  { name: 'cai-dat', label: 'Cài đặt', icon: 'gear' },
];

function parseRoute(raw: string) {
  let hash = 'hom-nay', best: string | null = null;
  try { hash = decodeURIComponent(raw.slice(1)) || 'hom-nay'; } catch { /* địa chỉ hỏng: về Hôm nay */ }
  Object.keys(SCREENS).forEach((n) => { if ((hash === n || hash.startsWith(n + '-')) && (!best || n.length > best.length)) best = n; });
  const name: string = best || 'hom-nay';
  return { name, params: best ? hash.slice(name.length + 1) : '' };
}
const subscribeHash = (fn: () => void) => { window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); };
const go = (hash: string) => { location.hash = hash; };

type Pulse = { mood: 'munch' | 'cheer' | null; rain: number };

/* ---- chọn loại cây cho hôm nay ---- */
function SeedPicker({ kind, onPick }: { kind: string; onPick: (kind: string) => void }) {
  const [chosen, setChosen] = useState(kind);
  const [group, setGroup] = useState(() => Math.max(0, Giri.groups.findIndex((g) => g.kinds.includes(kind))));
  return (
    <div className="ga-stack ga-stack--tight">
      <div className="gg-tabs" role="tablist" aria-label="Nhóm cây" style={{ alignSelf: 'flex-start' }}>
        {Giri.groups.map((g, i) => (
          <button className="gg-tab" role="tab" id={'group-' + g.key} key={g.key} type="button" aria-selected={i === group} onClick={() => setGroup(i)}>{g.name}</button>
        ))}
      </div>
      <div className="gg-seeds">
        {Giri.groups[group].kinds.map((k) => (
          <div className="gg-seed" key={k}>
            <button className="gg-frame" id={'seed-' + k} type="button" aria-pressed={k === chosen} aria-label={Giri.kinds[k]} onClick={() => setChosen(k)}
              dangerouslySetInnerHTML={{ __html: Giri.plant(5, k, 58, true) }} />
            {Giri.kinds[k]}
          </div>
        ))}
      </div>
      <div className="ga-dialog__actions">
        <button className="gg-btn gg-btn--leaf" id="seed-confirm" type="button" onClick={() => onPick(chosen)}>Trồng {Giri.kinds[chosen].toLowerCase()}</button>
      </div>
    </div>
  );
}

/* ---- thanh trạng thái: cây hôm nay, tiến độ, nút trồng ---- */
function Hud({ state, today, onPlant, onChangeKind }: { state: State; today: string; onPlant: () => void; onChangeKind: (kind: string) => void }) {
  const pr = GG.dayProgress(state, today), planted = !!state.days[today]?.planted;
  const stage = planted ? 5 : GG.stageFor(pr.pct, pr.total), kind = GG.kindFor(state, today), cp = GG.canPlant(state, today, today);
  const streak = GG.streak(state, today), inMonth = GG.monthDays(state, GG.monthKey(today)).filter(Boolean).length;
  const icon = useMemo(() => Giri.plant(Math.max(stage, 3), kind, 64, true), [stage, kind]);
  return (
    <aside className="mk-hud" aria-label="Cây của hôm nay">
      <div className="mk-hud__top">
        <Html html={icon} />
        <p className="mk-hud__name">{Giri.kinds[kind]} · cấp {stage}<span>{Giri.stages[stage]} · {pr.done} / {pr.total} việc</span></p>
        {planted ? <span className="gg-chip gg-chip--leaf">Đã trồng</span> : <span className="gg-chip">{pr.pct}%</span>}
      </div>
      <Progress cls="gg-progress--lg" value={planted ? 100 : pr.pct} label="Việc đã xong hôm nay" />
      <div className="mk-row">
        <button className="gg-btn gg-btn--leaf mk-grow" id="plant-today" type="button" disabled={!cp.ok} onClick={onPlant}>
          {cp.ok ? 'Trồng vào khu đất' : cp.reason === 'remaining' ? 'Còn ' + cp.remaining + ' việc nữa' : cp.reason === 'planted' ? 'Đã trồng hôm nay' : 'Thêm việc để trồng cây'}
        </button>
        {!planted && <button className="gg-btn gg-btn--ghost mk-mini" id="change-kind" type="button" onClick={() => onChangeKind(kind)}>Đổi cây</button>}
      </div>
      <div className="mk-hud__chips">
        {streak > 0 && <span className="gg-chip gg-chip--sun">Chuỗi {streak} ngày</span>}
        <span className="gg-chip gg-chip--leaf">{fmtMonth(GG.monthKey(today), today)} · {inMonth} cây</span>
      </div>
    </aside>
  );
}

/* ---- Giri và cây hôm nay đứng trong cảnh ---- */
function Hero({ state, today, pulse }: { state: State; today: string; pulse: Pulse }) {
  const pr = GG.dayProgress(state, today), planted = !!state.days[today]?.planted;
  const stage = planted ? 5 : GG.stageFor(pr.pct, pr.total), kind = GG.kindFor(state, today);
  const cp = GG.canPlant(state, today, today), late = GG.overdue(state, today).length, left = pr.total - pr.done;
  // lời chào theo buổi và theo mảnh cảm xúc hôm nay; xem lại mỗi phút để sang buổi mới thì đổi câu
  const [period, setPeriod] = useState(() => periodAt(new Date()));
  useEffect(() => {
    const sync = () => setPeriod(periodAt(new Date()));
    const id = setInterval(sync, 60000);
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const firstRun = !state.projects.length && !state.todos.length;
  const pomo = usePomodoro();
  // phản ứng tạm thời: lâu ngày mới gặp, vừa xong pomodoro, bị bấm vào. Hiện vài giây rồi về lời chào bình thường.
  const [react, setReact] = useState<{ mood: GiriMood; line: string } | null>(() => { const l = missedLine(readLastVisit(today), today); return l ? { mood: 'sad', line: l } : null; });
  const reactTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), pokes = useRef(0);
  const show = useCallback((r: { mood: GiriMood; line: string }, ms: number) => {
    clearTimeout(reactTimer.current); setReact(r);
    reactTimer.current = setTimeout(() => setReact(null), ms);
  }, []);
  useEffect(() => {
    if (react) reactTimer.current = setTimeout(() => setReact(null), 9000);          // câu "lâu rồi mới gặp" lúc mở app
    const onPomo = () => show({ mood: 'cheer', line: pomoDoneLine(String(Date.now())) }, 7000);
    window.addEventListener(POMO_DONE_EVENT, onPomo);
    return () => { window.removeEventListener(POMO_DONE_EVENT, onPomo); clearTimeout(reactTimer.current); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  const poke = () => show({ mood: 'cheer', line: pokeLine(pokes.current++) }, 2600);
  const hello = firstRun ? '' : greeting(period, state.days[today]?.mood, today);
  let mood: GiriMood = 'happy', line: string;
  if (firstRun) line = 'Hế lô, mình là Giri nè! Thêm việc đầu tiên đi rồi tụi mình trồng cây nha.';
  else if (planted) { mood = 'cheer'; line = 'Nay trồng cây rồi nha. Khu rừng lại xanh thêm xíu nè!'; }
  else if (cp.ok) { mood = 'cheer'; line = 'Xong hết trơn rồi! Vác cây ra khu đất thôi nào.'; }
  else if (late) { mood = 'sad'; line = 'Còn ' + late + ' việc từ bữa trước á. Mang qua hôm nay luôn hong?'; }
  else if (!pr.total) { mood = 'sleepy'; line = 'Nay chưa có việc nào hết. Bồ định làm gì nè?'; }
  else if (!pr.done) line = 'Có ' + pr.total + ' việc đang chờ nè. Xong hết là có cây mới liền!';
  else line = 'Xong ' + pr.done + ' việc rồi á. Còn ' + left + ' việc nữa là trồng được cây!';
  const focusing = pomo?.phase === 'focus' && pomo.endsAt !== null;
  if (period === 'late' && mood === 'happy') mood = 'sleepy';                       // khuya rồi: Giri ngủ gật
  if (pulse.mood === 'munch') mood = 'munch';
  else if (pulse.mood === 'cheer' && mood !== 'sad') mood = 'cheer';
  const said = react ? react.line : focusing && !firstRun ? focusLine(pomo.taskId) : hello;
  if (react && !pulse.mood) mood = react.mood;
  const hat = period === 'noon';                                                   // trưa nắng: đội nón lá

  const giri = useMemo(() => Giri.mascot(mood, 150, { hat }), [mood, hat]);
  const plant = useMemo(() => Giri.plant(stage, kind, 190), [stage, kind]);
  const plantEl = useRef<HTMLSpanElement>(null), lastStage = useRef(-1);
  useLayoutEffect(() => {
    if (lastStage.current >= 0 && stage > lastStage.current) plantEl.current?.firstElementChild?.classList.add('is-grown');
    lastStage.current = stage;
  }, [stage, kind]);
  useEffect(() => { if (pulse.rain) Giri.rain(plantEl.current); }, [pulse.rain]);
  return (
    <div className="mk-hero">
      <p className="gg-bubble mk-bubble-down"><span className="gg-tag">Giri</span>{said && <span className="mk-hello" id="giri-hello" aria-live="polite">{said}</span>}<span id="giri-line">{line}</span></p>
      <div className="mk-hero__stage">
        <button className="mk-giri" id="giri" type="button" aria-label="Chọc Giri" onClick={poke} dangerouslySetInnerHTML={{ __html: giri }} />
        <span id="day-plant" ref={plantEl} style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: plant }} />
      </div>
    </div>
  );
}

export default function Shell({ store, account }: { store: Store; account: Account | null }) {
  const snap = useSyncExternalStore(store.subscribe, store.get);
  const hash = useSyncExternalStore(subscribeHash, () => location.hash);
  const route = useMemo(() => parseRoute(hash), [hash]);
  const dialogs = useDialogs();
  const [today, setToday] = useState(() => GG.todayStr());
  const todayRef = useRef(today);
  const [pulse, setPulse] = useState<Pulse>({ mood: null, rain: 0 });
  const [fresh, setFresh] = useState<AppCtx['fresh']>(null);
  const [placing, setPlacing] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const syncDay = useCallback(() => {
    const t = GG.todayStr();
    if (t === todayRef.current) return false;
    todayRef.current = t; setToday(t);
    store.apply((s) => GG.settleToday(s, t));
    return true;
  }, [store]);

  useEffect(() => {
    void store.ready.then(() => store.apply((s) => GG.settleToday(s, todayRef.current)));
    const onVisible = () => { if (document.visibilityState === 'hidden') void store.flush(); else { syncDay(); void store.refresh(); } };
    const onFocus = () => { syncDay(); };
    const onLeave = () => { void store.flush(); };
    const id = setInterval(syncDay, 30000);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onLeave);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [store, syncDay]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // đổi màn hình: đóng hộp thoại, cuộn lên đầu
  useEffect(() => { dialogs.close(); window.scrollTo(0, 0); }, [hash, dialogs]);
  // rời khu đất của tháng này thì thôi chọn chỗ trồng
  useEffect(() => { if (route.name !== 'khu-vuon' || route.params) setPlacing(false); }, [route.name, route.params]);

  const ctx = useMemo<AppCtx>(() => {
    const planted = () => !!store.state().days[todayRef.current]?.planted;
    const apply = (fn: (s: State) => State) => {
      const was = planted();
      store.apply((s) => GG.settleToday(fn(s), todayRef.current));
      if (was && !planted()) dialogs.toast('Hôm nay còn việc chưa xong nên cây quay về chờ. Xong hết rồi trồng lại nhé.');
    };
    const editTodo = (t: Todo) => {
      void dialogs.askTodo({ title: 'Sửa việc', text: t.text, date: t.date, danger: 'Xóa việc', noDate: !!(t.workId || t.projectId), today: todayRef.current }).then((r) => {
        if (!r) return;
        if ('danger' in r) { apply((s) => GG.deleteTodo(s, t.id)); dialogs.toast('Đã xóa việc'); return; }
        apply((s) => GG.updateTodo(s, t.id, { text: r.text, date: r.date }));
      });
    };
    const tick = (t: Todo, el?: Element | null) => {
      const wasPlanted = planted();
      apply((s) => GG.toggleTodo(s, t.id, new Date().toISOString()));
      const now = store.state().todos.find((x) => x.id === t.id);
      if (!now || !now.done) return;
      if (el) Giri.burst(el, 'drops');
      const water = t.date === todayRef.current && !wasPlanted;       // việc của hôm nay: mưa lên cây, Giri nhai lá rồi ăn mừng
      setPulse((p) => ({ mood: water ? 'munch' : 'cheer', rain: water ? p.rain + 1 : p.rain }));
      timers.current.forEach(clearTimeout);
      timers.current = [
        setTimeout(() => setPulse((p) => ({ ...p, mood: 'cheer' })), 600),
        setTimeout(() => setPulse((p) => ({ ...p, mood: null })), 2700),
      ];
    };
    const plantAt = (slot?: number) => {
      setPlacing(false);
      if (syncDay()) return;                                // đã sang ngày mới: không trồng vào ngày cũ
      const day = todayRef.current;
      if (!GG.canPlant(store.state(), day, day).ok) return;
      setFresh({ date: day, at: Date.now() });
      store.apply((s) => GG.plant(s, day, day, slot));
    };
    return { state: snap.state, status: snap.status, store, today, params: route.params, account, go, apply, tick, editTodo, syncDay, fresh, placing, plantAt };
  }, [snap, store, today, route.params, account, dialogs, syncDay, fresh, placing]);

  // bấm trồng: sang khu đất của tháng này để chọn ô, cây chỉ được trồng khi đã chọn chỗ
  const plantToday = () => {
    if (syncDay()) return;
    go('#khu-vuon');
    setPlacing(true);
  };
  const changeKind = (kind: string) => {
    dialogs.sheet('Hôm nay trồng cây gì?', <SeedPicker kind={kind} onPick={(k) => { dialogs.close(); store.apply((s) => GG.setKind(s, today, k)); }} />);
  };

  // màn chào: tự hiện một lần khi tải xong mà tài khoản chưa có gì; Cài đặt mở lại được
  const [welcome, setWelcome] = useState(false);
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || (snap.status !== 'saved' && snap.status !== 'saving')) return;
    asked.current = true;
    const s = snap.state;
    if (s.projects.length || s.todos.length || s.notes.length || Object.keys(s.days).length) markWelcomed();   // người dùng cũ: khỏi hỏi
    else if (!welcomed()) setWelcome(true);
  }, [snap.status, snap.state]);
  useEffect(() => {
    const open = () => setWelcome(true);
    window.addEventListener(WELCOME_EVENT, open);
    return () => window.removeEventListener(WELCOME_EVENT, open);
  }, []);

  const def = SCREENS[route.name];
  const waiting = snap.status === 'loading' || snap.status === 'load-error';
  let screen;
  if (snap.status === 'loading') screen = <section className="mk-sec"><p className="mk-empty">Giri đang mở cổng rừng…</p></section>;
  else if (snap.status === 'load-error') screen = (
    <section className="mk-sec">
      <p className="mk-h1">Chưa tải được dữ liệu</p>
      <p className="gg-muted">{store.kind === 'supabase' ? 'Girido chưa lấy được dữ liệu từ máy chủ. Kiểm tra mạng rồi thử lại nhé. Trong lúc này app tạm khóa để không ghi đè lên dữ liệu của bạn.' : 'Dữ liệu lưu trên trình duyệt này không đọc được. App tạm khóa để không ghi đè lên nó.'}</p>
      <div><button className="gg-btn" id="load-retry" type="button" onClick={() => { void store.retry(); }}>Thử lại</button></div>
    </section>
  );
  else if (route.name === 'project') screen = <Projects />;
  else if (route.name === 'khu-vuon') screen = <GardenPlot key={route.params} />;
  else if (route.name === 'khu-vuon-lon') screen = <GardenTrail />;
  else if (route.name === 'cam-xuc') screen = <Mood />;
  else if (route.name === 'cai-dat') screen = <Settings />;
  else if (route.name === 'ghi-chu') screen = <Notes />;
  else screen = <Today />;

  return (
    <AppContext.Provider value={ctx}>
      <div className={'mk-app gg' + (def.wide && !waiting ? ' mk-app--wide' : '')}>
        {waiting ? <aside className="mk-hud" aria-hidden="true" style={{ visibility: 'hidden' }} /> : <Hud state={snap.state} today={today} onPlant={plantToday} onChangeKind={changeKind} />}
        {waiting ? <div className="mk-hero" /> : <Hero state={snap.state} today={today} pulse={pulse} />}
        <main className="mk-board">
          <nav className="mk-tabs" aria-label="Điều hướng chính">
            {TABS.map((t) => (
              <button className="mk-tab" id={'nav-' + t.name} key={t.name} type="button" aria-current={def.tab === t.name ? 'page' : undefined} onClick={() => go('#' + t.name)}>
                <Icon name={t.icon} />{t.label}
              </button>
            ))}
          </nav>
          <div className="mk-frame"><div className="mk-paper">{screen}</div></div>
        </main>
      </div>
      {!waiting && <Timers />}
      {welcome && !waiting && <Welcome onClose={() => setWelcome(false)} />}
      <div className="ga-status gg" role="status" hidden={snap.status !== 'error'}>
        {snap.status === 'error' && <>
          <span className="mk-grow">{store.kind === 'supabase' ? 'Chưa lưu được lên máy chủ. Thay đổi vẫn còn trên trang này, bạn thử lưu lại nhé.' : 'Trình duyệt chưa cho lưu dữ liệu. Thay đổi vẫn còn trên trang này; vào Cài đặt để xuất JSON.'}</span>
          <button className="gg-btn gg-btn--ghost mk-mini" id="save-retry" type="button" onClick={() => { void store.retry(); }}>Thử lại</button>
        </>}
      </div>
    </AppContext.Provider>
  );
}
