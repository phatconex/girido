// Màn hình Hôm nay: ngày đang chọn, dải 7 ngày, ô thêm việc, việc trễ, danh sách việc gom theo project và công việc.
import { useRef, useState, type ReactNode } from 'react';
import GG from '../lib/logic';
import type { State, Todo } from '../lib/logic';
import { useApp } from '../app-context';
import { IconBtn, fmtDate, onEnter } from '../ui';

const DOWS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function lastWork(state: State): string {
  let id: string | null = null;
  try { id = localStorage.getItem('gg-last-work'); } catch { /* không đọc được thì lấy công việc đầu tiên */ }
  if (id && GG.findWork(state, id)) return id;
  for (const p of state.projects) if (p.works.length) return p.works[0].id;
  return '';
}

function Row({ t, sub, extra }: { t: Todo; sub?: string; extra?: ReactNode }) {
  const { tick, editTodo } = useApp();
  return (
    <div className="mk-item">
      <input type="checkbox" className="gg-check" id={'todo-' + t.id} aria-label={'Xong: ' + t.text} checked={t.done} onChange={(e) => tick(t, e.currentTarget)} />
      <button className="mk-item__btn" id={'edit-' + t.id} type="button" aria-label={'Sửa: ' + t.text} onClick={() => editTodo(t)}>
        {t.text}{sub && <small>{sub}</small>}
      </button>
      {extra}
    </div>
  );
}

export default function Today() {
  const { state: st, today, params, go, apply } = useApp();
  const sel = GG.isDate(params) ? params : today, isToday = sel === today;
  const pr = GG.dayProgress(st, sel), late = isToday ? GG.overdue(st, today) : [], todos = GG.todosOn(st, sel);
  const hasWork = st.projects.some((p) => p.works.length), week = GG.weekOf(sel);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const workId = picked && GG.findWork(st, picked) ? picked : lastWork(st);

  const add = () => {
    if (!text.trim()) { input.current?.focus(); return; }
    try { localStorage.setItem('gg-last-work', workId); } catch { /* chỉ là tiện ích nhớ lựa chọn */ }
    apply((s) => GG.addTodo(s, { workId, text, date: sel }));
    setText(''); input.current?.focus();
  };

  const groups: { workId: string; list: Todo[] }[] = [];
  todos.forEach((t) => { const g = groups.find((x) => x.workId === t.workId); if (g) g.list.push(t); else groups.push({ workId: t.workId, list: [t] }); });

  return (
    <>
      <section className="mk-sec">
        <div className="mk-head">
          <div>
            <p className="mk-h1">{fmtDate(sel)}</p>
            <p className="gg-muted">{!pr.total ? 'Chưa có việc nào' : pr.done === pr.total ? 'Xong cả ' + pr.total + ' việc' : 'Còn ' + (pr.total - pr.done) + ' / ' + pr.total + ' việc' + (isToday ? ' hôm nay' : '')}</p>
            {!isToday && <button className="gg-btn gg-btn--ghost mk-mini" id="back-today" type="button" style={{ marginTop: 8 }} onClick={() => go('#hom-nay')}>Về hôm nay</button>}
          </div>
          <div className="mk-week">
            <IconBtn name="back" label="Tuần trước" id="week-prev" cls="gg-btn--ghost mk-navbtn" onClick={() => go('#hom-nay-' + GG.addDays(sel, -7))} />
            <div className="gg-days">
              {week.map((d, i) => {
                const planted = !!st.days[d]?.planted;
                return (
                  <button className={'gg-day' + (d === sel ? ' is-today' : '') + (planted ? ' is-done' : '')} id={'day-' + d} key={d} type="button"
                    aria-current={d === today ? 'date' : undefined} aria-pressed={d === sel}
                    aria-label={fmtDate(d) + (planted ? ', đã trồng cây' : '') + (d === today ? ', hôm nay' : '')}
                    onClick={() => go(d === today ? '#hom-nay' : '#hom-nay-' + d)}>
                    {DOWS[i]}<span className="gg-day__num">{GG.parseDate(d).getDate()}</span><span className="gg-day__mark" />
                  </button>
                );
              })}
            </div>
            <IconBtn name="next" label="Tuần sau" id="week-next" cls="gg-btn--ghost mk-navbtn" onClick={() => go('#hom-nay-' + GG.addDays(sel, 7))} />
          </div>
        </div>
        {!hasWork ? (
          <button className="gg-btn gg-btn--lg" id="first-project" type="button" onClick={() => go('#project')}>{st.projects.length ? 'Thêm công việc cho project' : 'Tạo project đầu tiên'}</button>
        ) : (
          <div className="mk-add">
            <input className="gg-input" id="new-todo" type="text" ref={input} placeholder={isToday ? 'Hôm nay bạn muốn làm gì?' : 'Thêm việc cho ngày này'} aria-label="Việc mới" maxLength={300}
              value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onEnter(add)} />
            <select className="mk-select" id="new-todo-work" aria-label="Thuộc công việc" value={workId} onChange={(e) => setPicked(e.target.value)}>
              {st.projects.filter((p) => p.works.length).map((p) => (
                <optgroup label={p.name} key={p.id}>
                  {p.works.slice().sort((a, b) => a.order - b.order).map((w) => <option value={w.id} key={w.id}>{w.name}</option>)}
                </optgroup>
              ))}
            </select>
            <IconBtn name="plus" label="Thêm việc" id="add-todo" cls="gg-btn--water" onClick={add} />
          </div>
        )}
      </section>

      {late.length > 0 && (
        <section className="mk-sec mk-sec--late">
          <div className="mk-row">
            <p className="mk-group mk-grow">Việc trễ <span>· {late.length}</span></p>
            <button className="gg-btn gg-btn--ghost mk-mini" id="carry-all" type="button" onClick={() => apply((s) => GG.carryOver(s, late.map((t) => t.id), today))}>Mang tất cả sang hôm nay</button>
          </div>
          {late.map((t) => {
            const f = GG.findWork(st, t.workId);
            return <Row key={t.id} t={t} sub={'Từ ' + fmtDate(t.date) + (f ? ' · ' + f.project.name : '')}
              extra={<button className="gg-btn gg-btn--ghost mk-mini" id={'carry-' + t.id} type="button" onClick={() => apply((s) => GG.carryOver(s, [t.id], today))}>Mang sang</button>} />;
          })}
        </section>
      )}

      {groups.map((g) => {
        const f = GG.findWork(st, g.workId);
        return (
          <section className="mk-sec" key={g.workId}>
            <p className="mk-group">{f ? f.project.name + ' ' : ''}<span>{f ? '· ' + f.work.name : ''}</span></p>
            {g.list.map((t) => <Row key={t.id} t={t} />)}
          </section>
        );
      })}
      {!todos.length && hasWork && (
        <section className="mk-sec"><p className="mk-empty">{isToday ? 'Thêm việc đầu tiên của hôm nay ở ô phía trên. Xong hết việc là trồng được một cây.' : 'Ngày này chưa có việc nào.'}</p></section>
      )}
    </>
  );
}
