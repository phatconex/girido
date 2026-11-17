// Màn hình Khu vườn: khu đất của một tháng và khu vườn lớn của mọi tháng.
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import GG from '../lib/logic';
import Giri from '../lib/giri';
import { useApp } from '../app-context';
import { IconBtn, Progress, fmtMonth } from '../ui';

export function GardenPlot() {
  const { state: st, today, params, go, fresh, apply, placing, plantAt } = useApp();
  const nowMk = GG.monthKey(today), mk = GG.isMonthKey(params) ? params : nowMk;
  const cells = GG.monthLayout(st, mk), n = cells.filter(Boolean).length, total = GG.daysInMonth(mk), streak = GG.streak(st, today);
  // cây vừa trồng xong (trong vài giây vừa rồi) thì mọc lên có hiệu ứng
  const freshDay = useMemo(() => (fresh && Date.now() - fresh.at < 4000 && GG.monthKey(fresh.date) === mk ? GG.parseDate(fresh.date).getDate() : 0), [fresh, mk]);
  // đang chọn chỗ cho cây hôm nay (vừa bấm trồng), hoặc đang sắp xếp lại: chọn một cây rồi chọn ô mới cho nó
  const choosing = placing && mk === nowMk && GG.canPlant(st, today, today).ok;
  const [arranging, setArranging] = useState(false);
  const [selected, setSelected] = useState(-1);
  useEffect(() => { setArranging(false); setSelected(-1); }, [mk, choosing]);
  const pickable = choosing || (arranging && selected >= 0);
  const sig = cells.map((c) => (c ? c.day + c.kind : '')).join(',');
  const html = useMemo(() => Giri.plot(cells, { fresh: freshDay, pick: pickable, selected: arranging ? selected : -1, size: 520 }), [sig, freshDay, pickable, arranging, selected]);   // eslint-disable-line react-hooks/exhaustive-deps
  const plot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!freshDay) return;
    const id = setTimeout(() => { const tree = plot.current?.querySelector('.gg-pl-tree.is-new'); if (tree) Giri.burst(tree, 'confetti'); }, 250);
    return () => clearTimeout(id);
  }, [freshDay]);
  const open = (e: MouseEvent<HTMLElement>) => {
    const el = (e.target as Element).closest('[data-slot]'); if (!el) return;
    const slot = Number(el.getAttribute('data-slot')), num = el.getAttribute('data-day');
    if (choosing) { if (!num) plantAt(slot); return; }                      // bấm một ô trống: trồng cây hôm nay ở đó
    if (arranging) {
      if (selected < 0) { if (num) setSelected(slot); return; }             // chọn cây muốn dời
      if (slot !== selected) apply((s) => GG.moveTree(s, mk, selected, slot)); // ô trống: dời tới; ô có cây: đổi chỗ
      setSelected(-1);
      return;
    }
    if (!num) return;
    const d = mk + '-' + (num.length < 2 ? '0' : '') + num;
    go(d === today ? '#hom-nay' : '#hom-nay-' + d);
  };
  const hint = choosing ? 'Bấm vào một ô đất trống để trồng cây hôm nay ở đó.'
    : arranging ? (selected < 0 ? 'Bấm vào cây bạn muốn dời.' : 'Giờ bấm vào ô trống để dời cây tới, hoặc bấm cây khác để đổi chỗ.')
    : !n ? (mk === nowMk ? 'Khu đất tháng này còn trống. Xong hết việc trong ngày là trồng được cây đầu tiên, và bạn tự chọn chỗ trồng.' : 'Tháng này chưa trồng cây nào.')
    : 'Chạm vào một cây để mở việc của ngày đó.';
  return (
    <>
      <section className="mk-sec">
        <div className="mk-head">
          <IconBtn name="back" label="Tháng trước" id="month-prev" cls="gg-btn--ghost mk-navbtn" onClick={() => go('#khu-vuon-' + GG.shiftMonth(mk, -1))} />
          <p className="mk-h1 mk-grow">Khu đất {fmtMonth(mk, today).toLowerCase()}</p>
          <IconBtn name="next" label="Tháng sau" id="month-next" cls="gg-btn--ghost mk-navbtn" disabled={mk >= nowMk} onClick={() => go('#khu-vuon-' + GG.shiftMonth(mk, 1))} />
        </div>
        <div className={'mk-row' + (choosing || arranging ? ' mk-plotbar' : '')}>
          <p className="gg-muted mk-grow" id="plot-hint" role="status">{hint}</p>
          {choosing && <button className="gg-btn gg-btn--ghost mk-mini" id="plant-auto" type="button" onClick={() => plantAt()}>Trồng chỗ nào cũng được</button>}
          {!choosing && n > 0 && <button className="gg-btn gg-btn--ghost mk-mini" id="arrange" type="button" aria-pressed={arranging} onClick={() => { setArranging((v) => !v); setSelected(-1); }}>{arranging ? 'Xong' : 'Sắp xếp lại'}</button>}
        </div>
        <div className={'mk-plot' + (pickable ? ' is-picking' : '') + (arranging ? ' is-arranging' : '')} id="month-plot" ref={plot} onClick={open} dangerouslySetInnerHTML={{ __html: html }} />
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
