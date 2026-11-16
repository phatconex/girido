// Đồng hồ pomodoro: mỗi lúc chỉ chạy cho một việc. Cất trong localStorage để tải lại trang vẫn chạy tiếp,
// và tính theo mốc giờ kết thúc chứ không đếm từng giây, nên tab bị che cũng không lệch.
import { useSyncExternalStore } from 'react';

export interface Pomo {
  taskId: string; label: string;
  phase: 'focus' | 'break';
  total: number;            // độ dài của pha này, tính bằng ms
  endsAt: number | null;    // mốc kết thúc; null khi đang tạm dừng
  left: number;             // ms còn lại lúc tạm dừng
}

const KEY = 'girido-pomo-v1';

export function parse(raw: string | null): Pomo | null {
  try {
    const o = JSON.parse(raw || 'null');
    if (!o || typeof o.taskId !== 'string' || typeof o.label !== 'string' || (o.phase !== 'focus' && o.phase !== 'break')) return null;
    if (typeof o.total !== 'number' || typeof o.left !== 'number' || (o.endsAt !== null && typeof o.endsAt !== 'number')) return null;
    return { taskId: o.taskId, label: o.label, phase: o.phase, total: o.total, endsAt: o.endsAt, left: o.left };
  } catch { return null; }
}
export const remaining = (p: Pomo, now: number) => Math.max(0, p.endsAt === null ? p.left : p.endsAt - now);
export function clock(ms: number): string {
  const s = Math.ceil(ms / 1000), m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}

export function createPomodoro(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, clockNow: () => number = Date.now) {
  let current = parse(storage.getItem(KEY));
  const subs = new Set<() => void>();
  const put = (p: Pomo | null) => {
    current = p;
    try { if (p) storage.setItem(KEY, JSON.stringify(p)); else storage.removeItem(KEY); } catch { /* không lưu được: vẫn chạy trong tab này */ }
    subs.forEach((f) => f());
  };
  const begin = (taskId: string, label: string, phase: Pomo['phase'], minutes: number) => {
    const total = Math.round(minutes * 60000);
    put({ taskId, label, phase, total, endsAt: clockNow() + total, left: total });
  };
  return {
    get: () => current,
    subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
    /** Tab khác vừa đổi đồng hồ: đọc lại. */
    reload() { current = parse(storage.getItem(KEY)); subs.forEach((f) => f()); },
    start(taskId: string, label: string, minutes: number) { begin(taskId, label, 'focus', minutes); },
    startBreak(minutes: number) { if (current) begin(current.taskId, current.label, 'break', minutes); },
    /** Đặt lại thời lượng của pha tập trung đang chạy: đếm lại từ đầu với số phút mới (đang tạm dừng thì vẫn tạm dừng). */
    setMinutes(minutes: number) {
      if (!current || current.phase !== 'focus') return;
      const total = Math.round(minutes * 60000);
      put({ ...current, total, left: total, endsAt: current.endsAt === null ? null : clockNow() + total });
    },
    pause() { if (current && current.endsAt !== null) put({ ...current, left: remaining(current, clockNow()), endsAt: null }); },
    resume() { if (current && current.endsAt === null) put({ ...current, endsAt: clockNow() + current.left }); },
    stop() { put(null); },
    /** Pha đang chạy đã hết giờ thì trả về nó, đúng một lần kể cả khi mở nhiều tab: tab nào nhận trước thì tab đó xử lý. */
    takeFinished(): Pomo | null {
      const p = current;
      if (!p || p.endsAt === null || clockNow() < p.endsAt) return null;
      const stored = parse(storage.getItem(KEY));
      if (!stored || stored.endsAt !== p.endsAt || stored.phase !== p.phase) { current = stored; subs.forEach((f) => f()); return null; }
      return p;
    },
  };
}

export const pomodoro = createPomodoro(typeof localStorage === 'undefined' ? { getItem: () => null, setItem: () => {}, removeItem: () => {} } : localStorage);
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === KEY) pomodoro.reload(); });
export function usePomodoro(): Pomo | null { return useSyncExternalStore(pomodoro.subscribe, pomodoro.get); }

/* ---- thời lượng riêng của từng việc: lần sau bấm ▶ cho việc đó sẽ dùng lại số phút đã chọn ---- */
const MIN_KEY = 'girido-pomo-min-v1', KEEP = 200;
function readMinutes(): Record<string, number> {
  try { const o = JSON.parse(localStorage.getItem(MIN_KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; }
}
export function minutesFor(taskId: string, fallback: number): number {
  const v = readMinutes()[taskId];
  return typeof v === 'number' && v >= 1 && v <= 180 ? v : fallback;
}
export function rememberMinutes(taskId: string, minutes: number) {
  const all = readMinutes(), key = taskId;
  delete all[key];                                   // ghi lại ở cuối, để việc lâu không dùng bị bỏ trước
  all[key] = minutes;
  const keys = Object.keys(all);
  keys.slice(0, Math.max(0, keys.length - KEEP)).forEach((k) => { delete all[k]; });
  try { localStorage.setItem(MIN_KEY, JSON.stringify(all)); } catch { /* không lưu được thì lần sau dùng mặc định */ }
}
