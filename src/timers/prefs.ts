// Tùy chọn của riêng máy này (không đồng bộ lên Supabase): độ dài pomodoro, nhắc uống nước, nhắc đứng dậy, âm thanh.
// Nhắc nhở và âm thanh là chuyện của từng thiết bị, nên cất trong localStorage.
import { useSyncExternalStore } from 'react';

export interface Prefs {
  focusMin: number; breakMin: number;
  waterOn: boolean; waterMin: number;
  standOn: boolean; standMin: number;
  sound: boolean;
  /** Kiểu âm báo cho từng loại (xem STYLES trong sound.ts) và âm lượng 0 đến 100. */
  soundWater: string; soundStand: string; soundPomo: string;
  volume: number;
  /** Phong cảnh: 'auto' đổi theo giờ, hoặc giữ cố định sáng, chiều, tối. */
  scene: 'auto' | 'day' | 'dusk' | 'night';
}
export const DEFAULTS: Prefs = { focusMin: 25, breakMin: 5, waterOn: false, waterMin: 45, standOn: false, standMin: 60, sound: true, soundWater: 'drop', soundStand: 'chime', soundPomo: 'bell', volume: 70, scene: 'auto' };
export const LIMITS = { focusMin: [1, 180], breakMin: [1, 60], waterMin: [1, 480], standMin: [1, 480] } as const;

/** Các kiểu âm báo có sẵn. Tên hiển thị và cách phát nằm trong sound.ts. */
export const STYLE_IDS = ['chime', 'bell', 'drop', 'marimba', 'musicbox', 'bird', 'digital', 'gong',
  'alarm01', 'alarm02', 'alarm03', 'alarm04', 'alarm05', 'alarm06', 'alarm07'];

const KEY = 'girido-prefs-v1';
const int = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d);

/** Đưa một giá trị bất kỳ về tùy chọn hợp lệ: số phút nằm trong khoảng cho phép, thiếu gì thì lấy mặc định. */
export function normalize(raw: unknown): Prefs {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const bool = (k: keyof Prefs) => (typeof o[k] === 'boolean' ? (o[k] as boolean) : (DEFAULTS[k] as boolean));
  const num = (k: keyof typeof LIMITS) => int(o[k], LIMITS[k][0], LIMITS[k][1], DEFAULTS[k]);
  const style = (k: 'soundWater' | 'soundStand' | 'soundPomo') => (typeof o[k] === 'string' && STYLE_IDS.includes(o[k] as string) ? (o[k] as string) : DEFAULTS[k]);
  const scene = (['auto', 'day', 'dusk', 'night'] as const).find((x) => x === o.scene) || DEFAULTS.scene;
  return { scene, soundWater: style('soundWater'), soundStand: style('soundStand'), soundPomo: style('soundPomo'), volume: int(o.volume, 0, 100, DEFAULTS.volume), focusMin: num('focusMin'), breakMin: num('breakMin'), waterOn: bool('waterOn'), waterMin: num('waterMin'), standOn: bool('standOn'), standMin: num('standMin'), sound: bool('sound') };
}

function read(): Prefs {
  try { return normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return DEFAULTS; }
}
let current = read();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === KEY) { current = read(); emit(); } });

export const prefs = {
  get: () => current,
  set(patch: Partial<Prefs>) {
    current = normalize({ ...current, ...patch });
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* không lưu được thì vẫn dùng trong phiên này */ }
    emit();
  },
  subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
};
export function usePrefs(): Prefs { return useSyncExternalStore(prefs.subscribe, prefs.get); }
