// Góc đồng hồ: pomodoro đang chạy và các thẻ nhắc uống nước, đứng dậy. Nằm cố định ở góc dưới bên phải.
import { useEffect, useRef, useState } from 'react';
import GG from '../lib/logic';
import { useApp } from '../app-context';
import { Icon } from '../ui';
import { prefs, usePrefs, LIMITS } from './prefs';
import { pomodoro, usePomodoro, remaining, clock, rememberMinutes } from './pomodoro';
import { step, loadSchedule, saveSchedule, type RemindKind } from './reminders';
import { chime, notify, stopSound } from './sound';

const REMIND: Record<RemindKind, { title: string; body: string; done: string }> = {
  water: { title: 'Đến giờ uống nước', body: 'Uống một ly nước rồi làm tiếp nhé.', done: 'Đã uống' },
  stand: { title: 'Đứng dậy vươn vai nào', body: 'Rời ghế, đi lại vài bước cho đỡ mỏi.', done: 'Đã đứng dậy' },
};

export default function Timers() {
  const { apply } = useApp();
  const p = usePrefs(), pomo = usePomodoro();
  const [now, setNow] = useState(() => Date.now());
  const [alerts, setAlerts] = useState<RemindKind[]>([]);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  // pomodoro: cập nhật đồng hồ và xử lý lúc hết giờ
  const running = !!pomo && pomo.endsAt !== null;
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setNow(Date.now());
      const done = pomodoro.takeFinished();
      if (!done) return;
      const pr = prefs.get();
      if (done.phase === 'focus') {
        applyRef.current((s) => GG.addPomo(s, done.taskId));
        window.dispatchEvent(new Event('girido:pomo-done'));                       // Giri ăn mừng (xem Shell)
        pomodoro.startBreak(pr.breakMin);
        if (pr.sound) chime('focus', pr.soundPomo, pr.volume);
        notify('Xong một pomodoro', 'Nghỉ ' + pr.breakMin + ' phút nhé. Việc: ' + done.label);
      } else {
        pomodoro.stop();
        if (pr.sound) chime('break', pr.soundPomo, pr.volume);
        notify('Hết giờ nghỉ', 'Sẵn sàng cho pomodoro tiếp theo chưa?');
      }
    };
    tick();
    const id = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [running, pomo?.endsAt]);

  // tên tab hiện giờ còn lại, để liếc qua là biết
  useEffect(() => {
    if (!pomo) return;
    document.title = clock(Math.min(pomo.total, remaining(pomo, Math.max(now, Date.now())))) + (pomo.phase === 'focus' ? ' · Tập trung' : ' · Nghỉ') + ' · Girido';
    return () => { document.title = 'Girido'; };
  }, [pomo, now]);

  // nhắc uống nước, đứng dậy
  useEffect(() => {
    if (!p.waterOn && !p.standOn) { saveSchedule({}); return; }
    const check = () => {
      const r = step(loadSchedule(), [{ kind: 'water', on: p.waterOn, minutes: p.waterMin }, { kind: 'stand', on: p.standOn, minutes: p.standMin }], Date.now());
      saveSchedule(r.schedule);
      if (!r.due.length) return;
      setAlerts((l) => [...l.filter((k) => !r.due.includes(k)), ...r.due]);
      const pr = prefs.get();
      if (pr.sound) chime(r.due[0], r.due[0] === 'water' ? pr.soundWater : pr.soundStand, pr.volume);
      r.due.forEach((k) => notify(REMIND[k].title, REMIND[k].body));
    };
    check();
    const id = setInterval(check, 10000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, [p.waterOn, p.waterMin, p.standOn, p.standMin]);
  const shown = alerts.filter((k) => (k === 'water' ? p.waterOn : p.standOn));

  // đổi thời lượng tập trung cho việc đang chạy: đếm lại từ đầu, và nhớ số phút này cho việc đó
  const [draft, setDraft] = useState<string | null>(null);
  const [more, setMore] = useState(false);          // màn hình hẹp: phần đổi thời lượng chỉ hiện khi bấm vào đồng hồ
  const setLength = (minutes: number) => {
    if (!pomo || !Number.isFinite(minutes)) return;
    const m = Math.min(LIMITS.focusMin[1], Math.max(LIMITS.focusMin[0], Math.round(minutes)));
    pomodoro.setMinutes(m); rememberMinutes(pomo.taskId, m);
  };
  const commit = () => { if (draft !== null && draft.trim() !== '') setLength(+draft); setDraft(null); };

  if (!pomo && !shown.length) return null;
  const length = pomo ? Math.round(pomo.total / 60000) : 0;
  const at = Math.max(now, Date.now());   // `now` chỉ để vẽ lại mỗi nhịp; giờ thật lấy ngay lúc vẽ để không hiện số cũ
  const left = pomo ? Math.min(pomo.total, remaining(pomo, at)) : 0, pct = pomo ? Math.min(100, Math.max(0, 100 - (left * 100) / pomo.total)) : 0;
  return (
    <div className="mk-dock gg">
      {shown.map((k) => (
        <div className={'mk-remind mk-remind--' + k} role="alert" key={k}>
          <span className="mk-remind__icon"><Icon name={k === 'water' ? 'drop' : 'stand'} /></span>
          <p className="mk-remind__text"><b>{REMIND[k].title}</b>{REMIND[k].body}</p>
          <button className="gg-btn gg-btn--ghost mk-mini" id={'remind-done-' + k} type="button" onClick={() => { stopSound(); setAlerts((l) => l.filter((x) => x !== k)); }}>{REMIND[k].done}</button>
        </div>
      ))}
      {pomo && (
        <section className={'mk-pomo mk-pomo--' + pomo.phase + (more ? ' is-more' : '')} aria-label="Pomodoro">
          <div className="mk-pomo__top">
            <span className="mk-pomo__phase">{pomo.phase === 'focus' ? 'Tập trung' : 'Nghỉ ngơi'}{pomo.endsAt === null ? ' · tạm dừng' : ''}</span>
            <button className="mk-pomo__x" id="pomo-stop" type="button" aria-label="Dừng pomodoro" onClick={() => { stopSound(); pomodoro.stop(); }}><Icon name="close" /></button>
          </div>
          <p className="mk-pomo__task">{pomo.label}</p>
          <div className="mk-pomo__row">
            <button className="mk-pomo__time" id="pomo-time" type="button" role="timer" aria-live="off" aria-expanded={more} title="Đổi thời lượng" onClick={() => setMore((v) => !v)}>{clock(left)}</button>
            {pomo.endsAt === null
              ? <button className="gg-btn mk-mini" id="pomo-resume" type="button" onClick={() => pomodoro.resume()}>Chạy tiếp</button>
              : <button className="gg-btn gg-btn--ghost mk-mini" id="pomo-pause" type="button" onClick={() => pomodoro.pause()}>Tạm dừng</button>}
            {pomo.phase === 'break' && <button className="gg-btn gg-btn--ghost mk-mini" id="pomo-skip" type="button" onClick={() => { stopSound(); pomodoro.stop(); }}>Bỏ qua</button>}
          </div>
          <div className="mk-pomo__bar" aria-hidden="true"><span style={{ width: pct + '%' }} /></div>
          {pomo.phase === 'focus' && (
            <div className="mk-pomo__len" role="group" aria-label="Thời lượng tập trung cho việc này">
              {[15, 25, 45, 60].map((m) => (
                <button className="mk-pomo__preset" id={'pomo-len-' + m} key={m} type="button" aria-pressed={length === m} onClick={() => setLength(m)}>{m}</button>
              ))}
              <label className="mk-pomo__custom">
                <input id="pomo-len" type="number" inputMode="numeric" min={LIMITS.focusMin[0]} max={LIMITS.focusMin[1]} step={1} aria-label="Số phút tập trung cho việc này"
                  value={draft ?? String(length)} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
                phút
              </label>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
