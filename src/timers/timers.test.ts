import { test, expect } from 'vitest';
import { normalize, DEFAULTS } from './prefs';
import { createPomodoro, clock, remaining } from './pomodoro';
import { step, STALE_MS, type Schedule } from './reminders';

function fakeStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } };
}
const MIN = 60000;

test('tùy chọn: thiếu thì lấy mặc định, số phút bị kéo về khoảng cho phép', () => {
  expect(normalize(null)).toEqual(DEFAULTS);
  expect(normalize({ soundWater: 'la', soundPomo: 'gong', soundStand: 'alarm03', volume: 300 })).toMatchObject({ soundWater: 'drop', soundPomo: 'gong', soundStand: 'alarm03', volume: 100 });
  expect(normalize({ waterOn: true, waterMin: 0, standMin: 9999, focusMin: 'x', breakMin: 7.6 })).toMatchObject({ waterOn: true, waterMin: 1, standMin: 480, focusMin: 25, breakMin: 8 });
});

test('pomodoro: chạy, tạm dừng, chạy tiếp, hết giờ', () => {
  let now = 1000;
  const p = createPomodoro(fakeStorage(), () => now);
  p.start('t1', 'Viết báo cáo', 25);
  expect(p.get()).toMatchObject({ taskId: 't1', phase: 'focus', total: 25 * MIN, endsAt: 1000 + 25 * MIN });
  now += 10 * MIN; p.pause();
  expect(p.get()).toMatchObject({ endsAt: null, left: 15 * MIN });
  now += 60 * MIN;                                   // tạm dừng bao lâu cũng không mất giờ
  expect(remaining(p.get()!, now)).toBe(15 * MIN);
  expect(p.takeFinished()).toBeNull();
  p.resume();
  now += 15 * MIN - 1; expect(p.takeFinished()).toBeNull();
  now += 1; expect(p.takeFinished()).toMatchObject({ taskId: 't1', phase: 'focus' });
  p.startBreak(5);
  expect(p.get()).toMatchObject({ taskId: 't1', phase: 'break', total: 5 * MIN });
  p.stop(); expect(p.get()).toBeNull();
});

test('pomodoro: tải lại trang vẫn chạy tiếp, và hai tab không cùng nhận một lần hết giờ', () => {
  let now = 0;
  const storage = fakeStorage(), a = createPomodoro(storage, () => now);
  a.start('t1', 'x', 1);
  const b = createPomodoro(storage, () => now);       // tab thứ hai, hoặc cùng tab sau khi tải lại
  expect(b.get()).toEqual(a.get());
  now = MIN;
  expect(a.takeFinished()).not.toBeNull();
  a.startBreak(5);                                    // tab a đã xử lý và chuyển sang nghỉ
  expect(b.takeFinished()).toBeNull();
  expect(b.get()).toMatchObject({ phase: 'break' });
});

test('đồng hồ hiện phút:giây, làm tròn lên', () => {
  expect(clock(25 * MIN)).toBe('25:00');
  expect(clock(59001)).toBe('01:00');
  expect(clock(999)).toBe('00:01');
  expect(clock(0)).toBe('00:00');
});

test('nhắc nhở: bật thì hẹn, tới giờ thì nhắc rồi hẹn lại, tắt thì thôi', () => {
  const want = (on: boolean, minutes = 30) => [{ kind: 'water' as const, on, minutes }];
  let r = step({}, want(true), 0);
  expect(r).toEqual({ schedule: { water: { at: 30 * MIN, every: 30 * MIN } }, due: [] });
  r = step(r.schedule, want(true), 29 * MIN);
  expect(r.due).toEqual([]);
  r = step(r.schedule, want(true), 30 * MIN + 5000);
  expect(r.due).toEqual(['water']);
  expect(r.schedule.water!.at).toBe(60 * MIN + 5000);
  expect(step(r.schedule, want(false), 61 * MIN)).toEqual({ schedule: {}, due: [] });
});

test('nhắc nhở: đổi số phút thì hẹn lại; lỡ hẹn quá lâu thì không nhắc bù', () => {
  const s: Schedule = { water: { at: 30 * MIN, every: 30 * MIN } };
  expect(step(s, [{ kind: 'water', on: true, minutes: 10 }], MIN).schedule.water).toEqual({ at: 11 * MIN, every: 10 * MIN });
  const late = step(s, [{ kind: 'water', on: true, minutes: 30 }], 30 * MIN + STALE_MS + 1);
  expect(late.due).toEqual([]);
  expect(late.schedule.water!.at).toBe(60 * MIN + STALE_MS + 1);
});

test('pomodoro: đổi thời lượng thì đếm lại từ đầu, đang tạm dừng vẫn tạm dừng, lúc nghỉ thì không đổi', () => {
  let now = 0;
  const p = createPomodoro(fakeStorage(), () => now);
  p.start('t1', 'x', 25);
  now = 10 * MIN; p.setMinutes(45);
  expect(p.get()).toMatchObject({ total: 45 * MIN, endsAt: 55 * MIN });
  p.pause(); p.setMinutes(15);
  expect(p.get()).toMatchObject({ total: 15 * MIN, left: 15 * MIN, endsAt: null });
  p.resume(); p.startBreak(5); p.setMinutes(60);
  expect(p.get()).toMatchObject({ phase: 'break', total: 5 * MIN });
});
