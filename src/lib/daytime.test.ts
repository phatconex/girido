import { test, expect } from 'vitest';
import { skyAt, periodAt, greeting, type Period } from './daytime';

const at = (h: number, m = 0) => new Date(2026, 10, 16, h, m);

test('cảnh nền: sáng từ 5 giờ, chiều vàng từ 15 giờ, tối từ 18 rưỡi', () => {
  expect([at(4, 59), at(5), at(14, 59), at(15), at(18, 29), at(18, 30), at(23, 59), at(0)].map(skyAt))
    .toEqual(['night', 'day', 'day', 'dusk', 'dusk', 'night', 'night', 'night']);
});

test('buổi để chào: sáng, trưa, chiều, tối, khuya', () => {
  expect([at(4), at(5), at(10, 59), at(11), at(13), at(17, 59), at(18), at(21, 59), at(22)].map(periodAt))
    .toEqual(['late', 'morning', 'morning', 'noon', 'afternoon', 'afternoon', 'evening', 'evening', 'late']);
});

test('lời chào đổi theo buổi và theo cảm xúc, nhưng trong cùng một buổi thì giữ nguyên', () => {
  const day = '2026-11-16';
  expect(greeting('morning', undefined, day)).toBe(greeting('morning', undefined, day));
  expect(greeting('morning', undefined, day)).not.toBe(greeting('evening', undefined, day));
  expect(greeting('morning', 1, day)).not.toBe(greeting('morning', 5, day));
  expect(greeting('morning', 5, day)).not.toBe(greeting('morning', undefined, day));
  expect(greeting('morning', 9, day)).toBe(greeting('morning', undefined, day));     // mức lạ thì coi như chưa chọn
});

test('mọi lời chào đều ngắn vừa bong bóng của Giri', () => {
  const periods: Period[] = ['morning', 'noon', 'afternoon', 'evening', 'late'];
  for (const p of periods) for (const mood of [undefined, 1, 2, 3, 4, 5]) for (let d = 1; d <= 28; d++) {
    const line = greeting(p, mood, '2026-11-' + (d < 10 ? '0' + d : d));
    expect(line.length).toBeGreaterThan(10);
    expect(line.length).toBeLessThanOrEqual(90);
  }
});
