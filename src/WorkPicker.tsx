// Ô chọn có tìm kiếm (Picker) và bản dành cho công việc (WorkPicker): bấm mở danh sách gom theo project, gõ để lọc (không cần gõ dấu), mũi tên và Enter để chọn.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Project } from './lib/logic';

/** Bỏ dấu và viết thường, để "phieu thu" vẫn tìm ra "Phiếu thu". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export interface Option { id: string; name: string; project: string }

/** Id của lựa chọn "việc nằm thẳng trong project" (không qua công việc nào). */
export const directId = (projectId: string) => '@p:' + projectId;

/** `direct`: mỗi project có thêm lựa chọn "Việc chung" đứng đầu, để thêm việc thẳng vào project. */
export default function WorkPicker({ projects, value, onChange, id, first, direct }: { projects: Project[]; value: string; onChange: (workId: string) => void; id: string; first?: Option; direct?: boolean }) {
  const all = useMemo<Option[]>(() => (first ? [first] : []).concat(projects.flatMap((p) =>
    (direct ? [{ id: directId(p.id), name: 'Việc chung', project: p.name }] : []).concat(
      p.works.slice().sort((a, b) => a.order - b.order).map((w) => ({ id: w.id, name: w.name, project: p.name }))))), [projects, first, direct]);
  return <Picker id={id} options={all} value={value} onChange={onChange} label="Thuộc công việc" what="công việc" placeholder="Tìm công việc hoặc project" />;
}

/** `project` của mỗi lựa chọn là tên nhóm; để rỗng thì danh sách không chia nhóm và nút hiện `label` ở dòng nhỏ. */
export function Picker({ options: all, value, onChange, id, label, what, placeholder, cls }: { options: Option[]; value: string; onChange: (id: string) => void; id: string; label: string; what: string; placeholder?: string; cls?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<CSSProperties>({});
  const uid = useId();

  const shown = useMemo(() => {
    const q = fold(query);
    return q ? all.filter((o) => fold(o.name).includes(q) || fold(o.project).includes(q)) : all;
  }, [all, query]);
  const current = all.find((o) => o.id === value);

  const openList = () => {
    setQuery('');
    setActive(Math.max(0, all.findIndex((o) => o.id === value)));
    setOpen(true);
  };
  const close = (refocus: boolean) => { setOpen(false); if (refocus) button.current?.focus(); };
  const pick = (o: Option) => { onChange(o.id); close(true); };

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !pop.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  // Bảng chọn nằm ngoài tờ giấy (portal) để không bị cắt mép; đặt dưới nút, hết chỗ thì lật lên trên.
  useLayoutEffect(() => {
    if (!open) return;
    const put = () => {
      const r = button.current?.getBoundingClientRect(); if (!r) return;
      const width = Math.min(Math.max(r.width, 300), window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.right - width, window.innerWidth - width - 12));
      const below = window.innerHeight - r.bottom, up = below < 340 && r.top > below;
      setPlace({ left, width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }), ['--mk-pick-max' as string]: Math.max(120, (up ? r.top : below) - 90) + 'px' });
    };
    put();
    window.addEventListener('resize', put);
    window.addEventListener('scroll', put, true);
    return () => { window.removeEventListener('resize', put); window.removeEventListener('scroll', put, true); };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active, shown]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) pick(shown[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'Tab') setOpen(false);
  };

  let lastProject = '';
  return (
    <div className={'mk-pick' + (open ? ' is-open' : '') + (cls ? ' ' + cls : '')} ref={root}>
      <button className="mk-pick__btn" id={id} ref={button} type="button" aria-haspopup="listbox" aria-expanded={open}
        aria-label={label + ': ' + (current ? (current.project ? current.project + ', ' : '') + current.name : 'chưa chọn')}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); openList(); } }}>
        <span className="mk-pick__text">
          <small>{(current && current.project) || label}</small>
          <b>{current ? current.name : 'Chọn ' + what}</b>
        </span>
        <svg className="mk-pick__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
      </button>
      {open && createPortal(
        <div className="mk-pick__pop" ref={pop} style={place}>
          <div className="mk-pick__search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <input ref={search} type="text" role="combobox" aria-expanded="true" aria-controls={uid + '-list'} aria-autocomplete="list"
              aria-activedescendant={shown[active] ? uid + '-' + shown[active].id : undefined}
              aria-label={'Tìm ' + what} placeholder={placeholder || 'Tìm ' + what} value={query} maxLength={80}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} />
          </div>
          <div className="mk-pick__list" id={uid + '-list'} role="listbox" aria-label={label} ref={list}>
            {shown.map((o, i) => {
              const head = o.project !== lastProject;
              lastProject = o.project;
              return (
                <div key={o.id} role="presentation">
                  {head && o.project && <p className="mk-pick__group" role="presentation">{o.project}</p>}
                  <div className="mk-pick__opt" id={uid + '-' + o.id} role="option" aria-selected={o.id === value} data-active={i === active}
                    onPointerMove={() => setActive(i)} onClick={() => pick(o)}>
                    <span>{o.name}</span>
                    {o.id === value && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                  </div>
                </div>
              );
            })}
            {!shown.length && <p className="mk-pick__empty">Không có {what} nào khớp “{query.trim()}”.</p>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
