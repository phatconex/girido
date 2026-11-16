// Màn hình Khu vườn: khu đất của một tháng và khu vườn lớn của mọi tháng.
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import GG from '../lib/logic';
import Giri from '../lib/giri';
import { useApp } from '../app-context';
import { IconBtn, Progress, fmtMonth } from '../ui';

export function GardenPlot() {
  const { state: st, today, params, go, fresh } = useApp();
  const nowMk = GG.monthKey(today), mk = GG.isMonthKey(params) ? params : nowMk;
  const days = GG.monthDays(st, mk), n = days.filter(Boolean).length, total = days.length, streak = GG.streak(st, today);
  // cây vừa trồng xong (trong vài giây trước khi mở màn hình này) thì mọc lên có hiệu ứng
  const [freshDay] = useState(() => (fresh && Date.now() - fresh.at < 4000 && GG.monthKey(fresh.date) === mk ? GG.parseDate(fresh.date).getDate() : 0));
  const todayNum = mk === nowMk ? GG.parseDate(today).getDate() : 0;
  const html = useMemo(() => Giri.plot(days, { today: todayNum, fresh: freshDay, size: 520 }), [days.join(','), todayNum, freshDay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const plot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!freshDay) return;
    const id = setTimeout(() => { const tree = plot.current?.querySelector('.gg-pl-tree.is-new'); if (tree) Giri.burst(tree, 'confetti'); }, 250);
    return () => clearTimeout(id);
  }, [freshDay]);
  const open = (e: MouseEvent<HTMLElement>) => {
    const el = (e.target as Element).closest('[data-day]'); if (!el) return;
    const num = el.getAttribute('data-day') || '', d = mk + '-' + (num.length < 2 ? '0' : '') + num;
    go(d === today ? '#hom-nay' : '#hom-nay-' + d);
  };
  return (
    <>
      <section className="mk-sec">
        <div className="mk-head">
          <IconBtn name="back" label="Tháng trước" id="month-prev" cls="gg-btn--ghost mk-navbtn" onClick={() => go('#khu-vuon-' + GG.shiftMonth(mk, -1))} />
          <p className="mk-h1 mk-grow">Khu đất {fmtMonth(mk, today).toLowerCase()}</p>
          <IconBtn name="next" label="Tháng sau" id="month-next" cls="gg-btn--ghost mk-navbtn" disabled={mk >= nowMk} onClick={() => go('#khu-vuon-' + GG.shiftMonth(mk, 1))} />
        </div>
        <p className="gg-muted">{!n ? (mk === nowMk ? 'Khu đất tháng này còn trống. Xong hết việc trong ngày là trồng được cây đầu tiên.' : 'Tháng này chưa trồng cây nào.') : 'Chạm vào một cây hoặc một ô đất để mở việc của ngày đó.'}</p>
        <div className="mk-plot" id="month-plot" ref={plot} onClick={open} dangerouslySetInnerHTML={{ __html: html }} />
      </section>
      <section className="mk-sec">
        <div className="mk-row">
          <p className="mk-group mk-grow">{n} / {total} cây trong tháng</p>
          {streak > 0 && <span className="gg-chip gg-chip--sun">Chuỗi {streak} ngày</span>}
        </div>
        <Progress cls="gg-progress--leaf" value={n} max={total} label="Số cây đã trồng trong tháng" />
        <div><button className="gg-btn gg-btn--ghost" id="open-trail" type="button" onClick={() => go('#khu-vuon-lon')}>Xem khu vườn lớn</button></div>
      </section>
    </>
  );
}

export function GardenTrail() {
  const { state: st, today, go } = useApp();
  const keys = new Set<string>(); let count = 0;
  Object.keys(st.days).forEach((d) => { if (st.days[d].planted) { keys.add(GG.monthKey(d)); count++; } });
  const months = [...keys].sort().reverse().map((mk) => ({ key: mk, name: fmtMonth(mk, today), days: GG.monthDays(st, mk) }));
  const wide = window.innerWidth >= 700;
  const html = useMemo(() => Giri.trail(months, wide ? { per: 12, size: 58 } : { per: 8, size: 46 }), [JSON.stringify(months), wide]);   // eslint-disable-line react-hooks/exhaustive-deps
  const open = (e: MouseEvent<HTMLElement>) => { const el = (e.target as Element).closest('[data-month]'); if (el) go('#khu-vuon-' + el.getAttribute('data-month')); };
  return (
    <section className="mk-sec">
      <div className="mk-head">
        <IconBtn name="back" label="Về khu đất tháng" id="go-back" cls="gg-btn--ghost mk-navbtn" onClick={() => go('#khu-vuon')} />
        <p className="mk-h1 mk-grow">Khu vườn lớn</p>
        <span className="gg-chip gg-chip--leaf">{count} cây</span>
      </div>
      {months.length ? <div className="mk-trail" id="garden-trail" onClick={open} dangerouslySetInnerHTML={{ __html: html }} />
        : <p className="mk-empty">Chưa có cây nào. Xong hết việc hôm nay là có cây đầu tiên.</p>}
    </section>
  );
}
