// Hộp thoại và thông báo nhỏ. Mỗi lúc chỉ có một hộp thoại.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconBtn, onEnter } from './ui';

export interface ConfirmOpts { title: string; body?: string; yes?: string; no?: string; danger?: boolean }
export interface AskOpts { title: string; value?: string; placeholder?: string; yes?: string; danger?: string; max?: number }
/** `noDate`: cho phép để việc chưa hẹn ngày (kết quả trả về date rỗng). `today` là ngày điền sẵn khi người dùng bỏ dấu "chưa hẹn". */
export interface AskTodoOpts { title: string; text?: string; date: string; yes?: string; danger?: string; noDate?: boolean; today?: string }
export type Danger = { danger: true };

export interface Dialogs {
  sheet(title: string, body: ReactNode, onDismiss?: () => void): void;
  close(): void;
  confirm(o: ConfirmOpts): Promise<boolean>;
  /** Trả về chuỗi đã nhập, {danger: true} khi bấm nút nguy hiểm, hoặc null khi đóng. */
  ask(o: AskOpts): Promise<string | Danger | null>;
  askTodo(o: AskTodoOpts): Promise<{ text: string; date: string } | Danger | null>;
  toast(text: string): void;
}

const Ctx = createContext<Dialogs | null>(null);
export function useDialogs(): Dialogs {
  const d = useContext(Ctx);
  if (!d) throw new Error('useDialogs phải nằm trong DialogProvider');
  return d;
}

interface Sheet { key: number; title: string; body: ReactNode; onDismiss?: () => void; from: Element | null }

function SheetView({ sheet, dismiss }: { sheet: Sheet; dismiss: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current!;
    const first = el.querySelector<HTMLElement>('.ga-dialog__body input, .ga-dialog__body select, .ga-dialog__body textarea')
      || el.querySelector<HTMLElement>('.ga-dialog__body button') || el.querySelector<HTMLElement>('button');
    first?.focus();
    const from = sheet.from;
    return () => { if (from instanceof HTMLElement && document.contains(from)) from.focus(); };
  }, [sheet.key, sheet.from]);
  return (
    <div className="ga-dialog" onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="gg-card ga-dialog__box" role="dialog" aria-modal="true" aria-label={sheet.title} ref={box}>
        <div className="mk-row">
          <p className="gg-title mk-grow">{sheet.title}</p>
          <IconBtn name="close" label="Đóng" id="dialog-close" onClick={dismiss} />
        </div>
        <div className="ga-dialog__body" style={{ display: 'contents' }}>{sheet.body}</div>
      </div>
    </div>
  );
}

function AskBody({ o, done }: { o: AskOpts; done: (v: string | Danger) => void }) {
  const [value, setValue] = useState(o.value || '');
  const input = useRef<HTMLInputElement>(null);
  const save = () => { if (!value.trim()) { input.current?.focus(); return; } done(value); };
  return (
    <div className="ga-stack ga-stack--tight">
      <input className="gg-input" id="ask-text" type="text" ref={input} aria-label={o.title} placeholder={o.placeholder || ''} maxLength={o.max || 120}
        value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onEnter(save)} />
      <div className="ga-dialog__actions">
        {o.danger && <button className="gg-btn gg-btn--clay" id="ask-danger" type="button" onClick={() => done({ danger: true })}>{o.danger}</button>}
        <button className="gg-btn" id="ask-save" type="button" onClick={save}>{o.yes || 'Lưu'}</button>
      </div>
    </div>
  );
}

function AskTodoBody({ o, done }: { o: AskTodoOpts; done: (v: { text: string; date: string } | Danger) => void }) {
  const [text, setText] = useState(o.text || '');
  const [date, setDate] = useState(o.date || o.today || '');
  const [open, setOpen] = useState(!!o.noDate && !o.date);            // true: việc này chưa hẹn ngày
  const input = useRef<HTMLInputElement>(null);
  const save = () => { if (!text.trim()) { input.current?.focus(); return; } done({ text, date: open ? '' : date || o.date || o.today || '' }); };
  return (
    <div className="ga-stack ga-stack--tight">
      <label className="mk-field">Nội dung
        <input className="gg-input" id="todo-text" type="text" ref={input} placeholder="Việc cần làm" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onEnter(save)} />
      </label>
      <label className="mk-field">Ngày làm
        <input className="gg-input" id="todo-date" type="date" value={open ? '' : date} disabled={open} onChange={(e) => setDate(e.target.value)} />
      </label>
      {o.noDate && (
        <label className="mk-checkline">
          <input type="checkbox" className="gg-check" id="todo-nodate" checked={open} onChange={(e) => setOpen(e.target.checked)} />
          <span><b>Chưa hẹn ngày</b>Việc nằm trong project, khi nào làm thì đặt ngày sau.</span>
        </label>
      )}
      <div className="ga-dialog__actions">
        {o.danger && <button className="gg-btn gg-btn--clay" id="todo-danger" type="button" onClick={() => done({ danger: true })}>{o.danger}</button>}
        <button className="gg-btn" id="todo-save" type="button" onClick={save}>{o.yes || 'Lưu'}</button>
      </div>
    </div>
  );
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toasts, setToasts] = useState<{ key: number; text: string }[]>([]);
  const seq = useRef(0);
  const current = useRef<Sheet | null>(null);
  current.current = sheet;

  const close = useCallback(() => setSheet(null), []);
  const dismiss = useCallback(() => { const s = current.current; setSheet(null); s?.onDismiss?.(); }, []);

  const api = useMemo<Dialogs>(() => {
    const open = (title: string, body: ReactNode, onDismiss?: () => void) =>
      setSheet({ key: ++seq.current, title, body, onDismiss, from: document.activeElement });
    return {
      sheet: open,
      close,
      confirm: (o) => new Promise<boolean>((resolve) => {
        const done = (v: boolean) => { close(); resolve(v); };
        open(o.title, (
          <div className="ga-stack ga-stack--tight">
            <p className="gg-muted">{o.body || ''}</p>
            <div className="ga-dialog__actions">
              <button className="gg-btn gg-btn--ghost" id="confirm-no" type="button" onClick={() => done(false)}>{o.no || 'Thôi'}</button>
              <button className={'gg-btn ' + (o.danger ? 'gg-btn--clay' : '')} id="confirm-yes" type="button" onClick={() => done(true)}>{o.yes || 'Đồng ý'}</button>
            </div>
          </div>
        ), () => resolve(false));
      }),
      ask: (o) => new Promise((resolve) => {
        open(o.title, <AskBody o={o} done={(v) => { close(); resolve(v); }} />, () => resolve(null));
      }),
      askTodo: (o) => new Promise((resolve) => {
        open(o.title, <AskTodoBody o={o} done={(v) => { close(); resolve(v); }} />, () => resolve(null));
      }),
      toast: (text) => {
        const key = ++seq.current;
        setToasts((l) => [...l, { key, text }]);
        setTimeout(() => setToasts((l) => l.filter((t) => t.key !== key)), 2600);
      },
    };
  }, [close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && current.current) dismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="ga-layer gg">{sheet && <SheetView key={sheet.key} sheet={sheet} dismiss={dismiss} />}</div>
      <div className="ga-toasts gg">{toasts.map((t) => <div className="ga-toast" role="status" key={t.key}>{t.text}</div>)}</div>
    </Ctx.Provider>
  );
}
