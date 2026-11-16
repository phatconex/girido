// Giờ trong ngày: cảnh nền đang là sáng, chiều hay tối, và Giri chào câu gì.
// Hàm thuần, nhận giờ từ bên ngoài để thử được.

export type Sky = 'day' | 'dusk' | 'night';
export type Period = 'morning' | 'noon' | 'afternoon' | 'evening' | 'late';

/** Cảnh nền: sáng từ 5:00, ngả vàng và mặt trời xuống thấp từ 15:00, tối có trăng sao từ 18:30. */
export function skyAt(d: Date): Sky {
  const m = d.getHours() * 60 + d.getMinutes();
  if (m < 5 * 60 || m >= 18 * 60 + 30) return 'night';
  return m >= 15 * 60 ? 'dusk' : 'day';
}

/** Buổi để Giri chào: sáng 5–11h, trưa 11–13h, chiều 13–18h, tối 18–22h, khuya 22–5h. */
export function periodAt(d: Date): Period {
  const h = d.getHours();
  if (h < 5 || h >= 22) return 'late';
  if (h < 11) return 'morning';
  if (h < 13) return 'noon';
  if (h < 18) return 'afternoon';
  return 'evening';
}

// Giọng của Giri: như một đứa bạn thân, nói kiểu đời thường, hơi Gen Z. Giữ câu ngắn cho vừa bong bóng.
const HELLO: Record<Period, string[]> = {
  morning: ['Hế lô buổi sáng nha!', 'Dậy chưa đó bồ ơi?', 'Sáng rồi nè, lên đồ thôi!', 'Chào buổi sáng nha bồ!'],
  noon: ['Trưa rồi á bồ!', 'Ê trưa rồi nè!', 'Giữa trưa nắng xỉu luôn!'],
  afternoon: ['Chiều rồi nè bồ!', 'Hello buổi chiều nha!', 'Chiều chill ghê á!'],
  evening: ['Tối rồi nè bồ ơi!', 'Hế lô buổi tối nha!', 'Trăng lên rồi kìa!'],
  late: ['Khuya dữ vậy bồ?', 'Ủa chưa ngủ hả?', 'Cú đêm chính hiệu nè!'],
};
// Câu thêm khi hôm nay chưa bỏ mảnh cảm xúc nào vào lọ.
const PLAIN: Record<Period, string[]> = {
  morning: ['Mình mới măm xong mớ lá non, full pin rồi nè.', 'Nay tụi mình trồng cây gì ta?', 'Vươn cổ cái cho tỉnh ngủ rồi chiến thôi.'],
  noon: ['Ăn trưa chưa đó? Đói là hong làm nổi đâu nha.', 'Nắng gắt ghê, nhớ uống nước nha bồ.', 'Chợp mắt xíu đi, chiều cày tiếp cho sung.'],
  afternoon: ['Ráng xíu nữa thôi, sắp về đích rồi nè.', 'Mặt trời sắp tan ca rồi kìa, lẹ lên nha.', 'Đứng dậy vươn vai cái rồi quẩy tiếp nha.'],
  evening: ['Nay của bồ sao rồi, kể mình nghe với?', 'Mình đang nằm ngắm sao bên hồ, chill xỉu.', 'Xong việc rồi thì xõa đi nha.'],
  late: ['Ngủ sớm đi, mai cây mới lớn lẹ được.', 'Mình buồn ngủ díp mắt luôn rồi á.', 'Làm nốt xíu rồi lên giường nha, đừng lì.'],
};
// Câu thêm theo mảnh cảm xúc hôm nay, từ 1 (tồi tệ) đến 5 (tuyệt).
const BY_MOOD: Record<number, string[]> = {
  1: ['Nay mệt xỉu ha. Có mình ngồi đây với bồ nè.', 'Ôm cái nè. Làm được nhiêu hay nhiêu, hong sao hết.', 'Ngày tệ rồi cũng qua thôi. Mình ở đây nha.'],
  2: ['Nay hơi oải ha. Mình đi chầm chậm thôi cũng được.', 'Tụt mood hả? Làm một việc bé xíu trước thôi nha.', 'Cho bồ chiếc lá ngon nhất của mình nè, đừng buồn nha.'],
  3: ['Nay tàm tạm ha. Xong thêm một việc là vui lên liền á.', 'Bình bình cũng ổn áp mà. Mình làm chung với bồ nha.', 'Ngày thường thôi, mà cây vẫn đang lớn đó nha.'],
  4: ['Nay bồ vui ghê, mình vui lây luôn nè!', 'Mood xịn vậy thì tranh thủ tưới cây liền nha.', 'Thấy bồ vui là mình muốn nhảy cẫng lên luôn á.'],
  5: ['Nay đỉnh quá trời luôn! Mình vẫy đuôi mừng nè.', 'Bồ rạng rỡ dữ thần! Cả khu rừng sáng theo luôn.', 'Ngày xịn xò ghê! Mình muốn hú lên một tiếng á.'],
};

/** Chọn một câu trong danh sách theo `seed`, để cùng một ngày và một buổi thì câu không đổi mỗi lần vẽ lại. */
function pick(list: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** Lời chào của Giri: câu chào theo buổi, rồi một câu theo cảm xúc hôm nay (chưa chọn cảm xúc thì câu theo buổi). */
export function greeting(period: Period, mood: number | undefined, day: string): string {
  const more = mood && BY_MOOD[mood] ? pick(BY_MOOD[mood], day + period + mood) : pick(PLAIN[period], day + period);
  return pick(HELLO[period], day + period) + ' ' + more;
}
