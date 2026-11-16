// Lịch nhắc uống nước và đứng dậy. Hàm thuần: nhận giờ hiện tại và lịch đang có, trả về việc cần nhắc và lịch mới.
export type RemindKind = 'water' | 'stand';
export type Schedule = Partial<Record<RemindKind, { at: number; every: number }>>;
export interface Wanted { kind: RemindKind; on: boolean; minutes: number }

/** Lỡ hẹn quá mức này (ví dụ máy ngủ hoặc app vừa mở lại) thì không nhắc bù, chỉ hẹn lại từ bây giờ. */
export const STALE_MS = 90000;

export function step(schedule: Schedule, wanted: Wanted[], now: number): { schedule: Schedule; due: RemindKind[] } {
  const next: Schedule = {}, due: RemindKind[] = [];
  wanted.forEach((w) => {
    if (!w.on) return;
    const every = w.minutes * 60000, cur = schedule[w.kind];
    if (!cur || cur.every !== every || now - cur.at > STALE_MS) next[w.kind] = { at: now + every, every };   // mới bật, đổi số phút, hoặc lỡ hẹn quá lâu
    else if (now >= cur.at) { due.push(w.kind); next[w.kind] = { at: now + every, every }; }
    else next[w.kind] = cur;
  });
  return { schedule: next, due };
}

const KEY = 'girido-remind-v1';
export function loadSchedule(): Schedule {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}'), out: Schedule = {};
    (['water', 'stand'] as RemindKind[]).forEach((k) => { if (o && o[k] && typeof o[k].at === 'number' && typeof o[k].every === 'number') out[k] = { at: o[k].at, every: o[k].every }; });
    return out;
  } catch { return {}; }
}
export function saveSchedule(s: Schedule) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* không lưu được: lịch chỉ sống trong tab này */ }
}
