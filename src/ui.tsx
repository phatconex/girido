// Mảnh giao diện nhỏ dùng chung và các hàm viết ngày tháng.
import type { CSSProperties, KeyboardEvent } from 'react';
import GG from './lib/logic';

const ICONS = {
  today: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  project: '<circle cx="5" cy="12" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M7.5 12c4 0 4-6.5 8-6.5M7.5 12c4 0 4 6.5 8 6.5"/>',
  garden: '<path d="M12 21v-7"/><circle cx="12" cy="9" r="6"/>',
  mood: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5q3.5 3 7 0M9 10h.01M15 10h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  back: '<path d="M14 6l-6 6 6 6"/>',
  next: '<path d="M10 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7M10.5 11v5M13.5 11v5"/>',
};
export type IconName = keyof typeof ICONS;

/** Chèn hình vẽ của Giri (chuỗi SVG/HTML do lib/giri sinh ra). Không bao giờ dùng cho chữ người dùng nhập. */
export function Html({ html, id, className, block, onClick }: { html: string; id?: string; className?: string; block?: boolean; onClick?: (e: React.MouseEvent<HTMLElement>) => void }) {
  const style: CSSProperties | undefined = className ? undefined : { display: block ? 'block' : 'contents' };
  const Tag = className ? 'div' : 'span';
  return <Tag id={id} className={className} style={style} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Icon({ name }: { name: IconName }) {
  return <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}

export function IconBtn({ name, label, id, onClick, cls, disabled }: { name: IconName; label: string; id?: string; onClick: () => void; cls?: string; disabled?: boolean }) {
  return (
    <button className={'gg-btn gg-btn--icon ' + (cls || 'gg-btn--ghost')} id={id} aria-label={label} type="button" onClick={onClick} disabled={disabled}>
      <Icon name={name} />
    </button>
  );
}

export function Progress({ value, max = 100, label, cls }: { value: number; max?: number; label: string; cls?: string }) {
  return (
    <div className={'gg-progress ' + (cls || '')} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="gg-progress__fill" style={{ '--value': (max ? (value / max) * 100 : 0) + '%' } as CSSProperties} />
    </div>
  );
}

const DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export function fmtDate(date: string) { const d = GG.parseDate(date); return DOW[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1); }
export function fmtShort(date: string) { const d = GG.parseDate(date); return d.getDate() + '/' + (d.getMonth() + 1); }
export function fmtMonth(mk: string, today: string) { const p = mk.split('-'); return 'Tháng ' + +p[1] + (p[0] === today.slice(0, 4) ? '' : ', ' + p[0]); }

/** Enter để xác nhận, bỏ qua Enter đang dùng để chốt chữ của bộ gõ tiếng Việt. */
export function onEnter(fn: () => void) {
  return (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) fn(); };
}
