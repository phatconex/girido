// Màn hình Hôm nay: ngày đang chọn, dải 7 ngày, ô thêm việc, việc trễ, danh sách việc gom theo project và công việc.
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import GG from '../lib/logic';
import type { State, Todo } from '../lib/logic';
import { useApp } from '../app-context';
import { useDialogs } from '../dialogs';
import { Icon, IconBtn, fmtDate, onEnter } from '../ui';
import { pomodoro, usePomodoro, minutesFor } from '../timers/pomodoro';
import { prefs } from '../timers/prefs';
import { unlock } from '../timers/sound';
import WorkPicker, { directId, type Option } from '../WorkPicker';

/** Lựa chọn "việc lẻ" trong ô chọn: việc của một ngày, không thuộc project nào (lưu với workId rỗng). */
const LOOSE = '@loose';
const LOOSE_OPTION: Option = { id: LOOSE, name: 'Việc lẻ', project: 'Không thuộc project' };

const DOWS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Nơi nhận việc mới: việc lẻ, thẳng vào một project (id dạng @p:<project>), hoặc một công việc. */
function valid(state: State, id: string | null): id is string {
  if (!id) return false;
  if (id === LOOSE) return true;
  if (id.startsWith('@p:')) return state.projects.some((p) => directId(p.id) === id);
  return !!GG.findWork(state, id);
}
const target = (id: string) => (id === LOOSE ? { workId: '' } : id.startsWith('@p:') ? { workId: '', projectId: id.slice(3) } : { workId: id });
/** Nhóm của một việc khi liệt kê: công việc, project (việc chung), hoặc rỗng cho việc lẻ. */
const groupOf = (t: Todo) => t.workId || (t.projectId ? directId(t.projectId) : '');

function lastWork(state: State): string {
  let id: string | null = null;
  try { id = localStorage.getItem('gg-last-work'); } catch { /* không đọc được thì lấy công việc đầu tiên */ }
  if (valid(state, id)) return id;
  for (const p of state.projects) if (p.works.length) return p.works[0].id;
  return LOOSE;
}

function Row({ t, sub, extra, canFocus }: { t: Todo; sub?: string; extra?: ReactNode; canFocus?: boolean }) {
  const { tick, editTodo, apply } = useApp();
  const dialogs = useDialogs();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const subs = t.subs || [], subsDone = subs.filter((s) => s.done).length;
  const now = () => new Date().toISOString();
  const addSub = () => { if (!draft.trim()) return; apply((s) => GG.addSub(s, t.id, draft, now())); setDraft(''); };
  const onSubKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') { e.preventDefault(); addSub(); }
    else if (e.key === 'Escape') { e.stopPropagation(); setDraft(''); setAdding(false); }
  };
  const editSub = (id: string, text: string) => {
    void dialogs.ask({ title: 'Mục con', value: text, danger: 'Xóa mục này', max: 200 }).then((v) => {
      if (typeof v === 'string') apply((s) => GG.renameSub(s, t.id, id, v));
      else if (v) apply((s) => GG.deleteSub(s, t.id, id, now()));
    });
  };
  const pomo = usePomodoro(), active = pomo?.taskId === t.id;
  const focus = () => { unlock(); pomodoro.start(t.id, t.text, minutesFor(t.id, prefs.get().focusMin)); };
  return (
    <div className="mk-todo">
    <div className={'mk-item' + (active ? ' is-focus' : '')}>
      <input type="checkbox" className="gg-check" id={'todo-' + t.id} aria-label={'Xong: ' + t.text} checked={t.done} onChange={(e) => tick(t, e.currentTarget)} />
      <button className="mk-item__btn" id={'edit-' + t.id} type="button" aria-label={'Sửa: ' + t.text} onClick={() => editTodo(t)}>
        {t.text}{sub && <small>{sub}</small>}
      </button>
      <div className="mk-item__acts">
        {subs.length > 0 && <span className={'gg-chip' + (subsDone === subs.length ? ' gg-chip--leaf' : '')} title="Mục con đã xong">{subsDone}/{subs.length}</span>}
        <button className="mk-focus mk-subadd" id={'sub-add-' + t.id} type="button" aria-expanded={adding} aria-label={'Thêm mục con cho: ' + t.text} title="Thêm mục con" onClick={() => setAdding((v) => !v)}><Icon name="sub" /></button>
        {!!t.pomos && <span className="mk-pomos" title={t.pomos + ' pomodoro đã xong'}><i aria-hidden="true" />{t.pomos}<span className="mk-sr"> pomodoro đã xong</span></span>}
        {canFocus && !t.done && (active
          ? <span className="gg-chip gg-chip--sun">{pomo?.phase === 'break' ? 'Đang nghỉ' : 'Đang làm'}</span>
          : <button className="mk-focus" id={'focus-' + t.id} type="button" aria-label={'Bắt đầu pomodoro cho: ' + t.text} title="Bắt đầu pomodoro" onClick={focus}><Icon name="play" /></button>)}
        {extra}
      </div>
    </div>
    {(subs.length > 0 || adding) && (
      <div className="mk-subs">
        {subs.map((s) => (
          <div className="mk-sub" key={s.id}>
            <input type="checkbox" className="gg-check" id={'sub-' + s.id} aria-label={'Xong: ' + s.text} checked={s.done} onChange={() => apply((st) => GG.toggleSub(st, t.id, s.id, now()))} />
            <button className="mk-sub__btn" id={'sub-edit-' + s.id} type="button" aria-label={'Sửa mục con: ' + s.text} onClick={() => editSub(s.id, s.text)}>{s.text}</button>
          </div>
        ))}
        {adding && (
          <div className="mk-sub mk-sub--new">
            <input className="gg-input" id={'sub-new-' + t.id} type="text" autoFocus placeholder="Mục con mới, Enter để thêm" aria-label={'Mục con mới của: ' + t.text} maxLength={200}
              value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onSubKey} onBlur={() => { if (!draft.trim()) setAdding(false); }} />
            <button className="gg-btn gg-btn--ghost mk-mini" type="button" onMouseDown={(e) => e.preventDefault()} onClick={addSub}>Thêm</button>
          </div>
        )}
      </div>
    )}
    </div>
  );
}

export default function Today() {
  const { state: st, today, params, go, apply } = useApp();
  const sel = GG.isDate(params) ? params : today, isToday = sel === today;
  const pr = GG.dayProgress(st, sel), late = isToday ? GG.overdue(st, today) : [], todos = GG.todosOn(st, sel);
  const week = GG.weekOf(sel);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const workId = valid(st, picked) ? picked : lastWork(st);

  const add = () => {
    if (!text.trim()) { input.current?.focus(); return; }
    try { localStorage.setItem('gg-last-work', workId); } catch { /* chỉ là tiện ích nhớ lựa chọn */ }
    apply((s) => GG.addTodo(s, { ...target(workId), text, date: sel }));
    setText(''); input.current?.focus();
  };

  const groups: { workId: string; list: Todo[] }[] = [];
  todos.forEach((t) => { const k = groupOf(t), g = groups.find((x) => x.workId === k); if (g) g.list.push(t); else groups.push({ workId: k, list: [t] }); });
  const projectName = (id: string) => st.projects.find((p) => p.id === id)?.name || '';

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
        <div className="mk-add">
          <input className="gg-input" id="new-todo" type="text" ref={input} placeholder={isToday ? 'Hôm nay bạn muốn làm gì?' : 'Thêm việc cho ngày này'} aria-label="Việc mới" maxLength={300}
            value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onEnter(add)} />
          <WorkPicker id="new-todo-work" projects={st.projects} value={workId} onChange={setPicked} first={LOOSE_OPTION} direct />
          <IconBtn name="plus" label="Thêm việc" id="add-todo" cls="gg-btn--water" onClick={add} />
        </div>
        {!st.projects.length && <p className="gg-muted mk-hint">Việc thêm ở đây là việc lẻ của ngày này, không thuộc project nào. Muốn gom việc theo dự án thì <button className="mk-linkbtn" id="first-project" type="button" onClick={() => go('#project')}>tạo project đầu tiên</button>.</p>}
      </section>

      {late.length > 0 && (
        <section className="mk-sec mk-sec--late">
          <div className="mk-row">
            <p className="mk-group mk-grow">Việc trễ <span>· {late.length}</span></p>
            <button className="gg-btn gg-btn--ghost mk-mini" id="carry-all" type="button" onClick={() => apply((s) => GG.carryOver(s, late.map((t) => t.id), today))}>Mang tất cả sang hôm nay</button>
          </div>
          {late.map((t) => {
            const f = GG.findWork(st, t.workId), owner = f ? f.project.name : t.projectId ? projectName(t.projectId) : '';
            return <Row key={t.id} t={t} canFocus sub={'Từ ' + fmtDate(t.date) + (owner ? ' · ' + owner : '')}
              extra={<button className="gg-btn gg-btn--ghost mk-mini" id={'carry-' + t.id} type="button" onClick={() => apply((s) => GG.carryOver(s, [t.id], today))}>Mang sang</button>} />;
          })}
        </section>
      )}

      {groups.map((g) => {
        const f = GG.findWork(st, g.workId);
        return (
          <section className="mk-sec" key={g.workId}>
            {g.workId.startsWith('@p:')
              ? <p className="mk-group">{projectName(g.workId.slice(3))} <span>· việc chung</span></p>
              : g.workId
              ? <p className="mk-group">{f ? f.project.name + ' ' : ''}<span>{f ? '· ' + f.work.name : ''}</span></p>
              : <p className="mk-group">Việc lẻ <span>· không thuộc project</span></p>}
            {g.list.map((t) => <Row key={t.id} t={t} canFocus={isToday} />)}
          </section>
        );
      })}
      {!todos.length && (
        <section className="mk-sec"><p className="mk-empty">{isToday ? 'Thêm việc đầu tiên của hôm nay ở ô phía trên. Xong hết việc là trồng được một cây.' : 'Ngày này chưa có việc nào.'}</p></section>
      )}
    </>
  );
}
