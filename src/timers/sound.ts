// Âm báo. Hai nguồn: tám kiểu tiếng tự tổng hợp bằng Web Audio (bốn giai điệu, cho biết đang nhắc chuyện gì),
// và bảy file mp3 trong public/audio. Người dùng chọn kiểu cho từng loại nhắc trong Cài đặt.
// Trình duyệt chỉ cho phát tiếng sau khi người dùng đã chạm vào trang, nên ta "mở khóa" ở lần bấm đầu tiên.
export type Chime = 'water' | 'stand' | 'focus' | 'break';

// [tần số Hz, bắt đầu sau bao nhiêu giây, kéo dài bao nhiêu giây]
type Note = [number, number, number];
const TUNES: Record<Chime, Note[]> = {
  water: [[1175, 0, 0.16], [1568, 0.14, 0.16], [1175, 0.42, 0.16], [1568, 0.56, 0.22]],          // hai giọt nước
  stand: [[523, 0, 0.2], [659, 0.18, 0.2], [784, 0.36, 0.2], [1047, 0.54, 0.36]],                // đi lên: đứng dậy nào
  focus: [[784, 0, 0.22], [988, 0.2, 0.22], [1175, 0.4, 0.5]],                                   // xong một pomodoro
  break: [[880, 0, 0.2], [659, 0.2, 0.2], [880, 0.4, 0.34]],                                     // hết giờ nghỉ
};

type Voice = (c: AudioContext, out: AudioNode, note: Note, t0: number) => void;

/** Một tiếng đơn: dao động `type` ở `freq`, to dần trong `attack` giây rồi tắt dần tới `end`. Trả về nút dao động để chỉnh thêm. */
function tone(c: AudioContext, out: AudioNode, type: OscillatorType, freq: number, start: number, end: number, peak: number, attack = 0.012) {
  const osc = c.createOscillator(), gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(end + 0.05);
  return osc;
}

export const STYLES: { id: string; name: string; hint: string; voice: Voice }[] = [
  { id: 'chime', name: 'Chuông gió', hint: 'Trong, nhẹ', voice: (c, out, [f, at, len], t) => { tone(c, out, 'sine', f, t + at, t + at + len, 0.3, 0.02); } },
  { id: 'bell', name: 'Chuông ngân', hint: 'Ngân dài', voice: (c, out, [f, at, len], t) => {
    tone(c, out, 'sine', f, t + at, t + at + len + 0.9, 0.28);
    tone(c, out, 'sine', f * 2.76, t + at, t + at + len + 0.35, 0.07);
    tone(c, out, 'sine', f * 5.4, t + at, t + at + 0.12, 0.04);
  } },
  { id: 'drop', name: 'Giọt nước', hint: 'Tiếng nước rơi', voice: (c, out, [f, at], t) => {
    const o = tone(c, out, 'sine', f * 0.55, t + at, t + at + 0.16, 0.34, 0.006);
    o.frequency.exponentialRampToValueAtTime(f * 1.25, t + at + 0.09);
  } },
  { id: 'marimba', name: 'Mõ gỗ', hint: 'Ấm, ngắn', voice: (c, out, [f, at], t) => {
    tone(c, out, 'triangle', f / 2, t + at, t + at + 0.32, 0.4, 0.005);
    tone(c, out, 'sine', f * 2, t + at, t + at + 0.07, 0.1, 0.003);
  } },
  { id: 'musicbox', name: 'Hộp nhạc', hint: 'Leng keng', voice: (c, out, [f, at, len], t) => {
    tone(c, out, 'triangle', f * 2, t + at, t + at + len + 0.5, 0.16, 0.004);
    tone(c, out, 'sine', f * 4, t + at, t + at + 0.25, 0.06, 0.004);
  } },
  { id: 'bird', name: 'Chim hót', hint: 'Líu lo', voice: (c, out, [f, at], t) => {
    [0, 0.085].forEach((d, i) => {
      const o = tone(c, out, 'sine', f * (i ? 1.9 : 1.6), t + at + d, t + at + d + 0.075, 0.22, 0.01);
      o.frequency.exponentialRampToValueAtTime(f * (i ? 2.6 : 2.3), t + at + d + 0.045);
      o.frequency.exponentialRampToValueAtTime(f * 1.7, t + at + d + 0.075);
    });
  } },
  { id: 'digital', name: 'Điện tử', hint: 'Bíp rõ, dễ nghe', voice: (c, out, [f, at, len], t) => { tone(c, out, 'square', f, t + at, t + at + Math.min(len, 0.14), 0.09, 0.004); } },
  { id: 'gong', name: 'Cồng trầm', hint: 'Trầm, chậm', voice: (c, out, [f, at, len], t) => {
    tone(c, out, 'sine', f / 4, t + at, t + at + len + 1.6, 0.42, 0.03);
    tone(c, out, 'sine', (f / 4) * 2.4, t + at, t + at + len + 0.8, 0.1, 0.02);
    tone(c, out, 'triangle', (f / 4) * 3.9, t + at, t + at + 0.4, 0.04, 0.01);
  } },
];

/** File mp3 trong public/audio. File dài thì chỉ phát MAX_FILE_MS rồi nhỏ dần, vì đây là tiếng nhắc chứ không phải bài nhạc. */
export const FILES: { id: string; name: string; hint: string; src: string }[] = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  id: 'alarm0' + n, name: 'Alarm 0' + n, hint: 'File âm thanh', src: import.meta.env.BASE_URL + 'audio/alarm0' + n + '.mp3',
}));
export const MAX_FILE_MS = 12000;

let playing: HTMLAudioElement | null = null, cut: ReturnType<typeof setTimeout> | undefined, fade: ReturnType<typeof setInterval> | undefined;
/** Tắt file âm thanh đang phát (ví dụ khi người dùng bấm "Đã uống"). */
export function stopSound() {
  clearTimeout(cut); clearInterval(fade);
  if (playing) { playing.pause(); playing = null; }
}
function playFile(src: string, volume: number) {
  stopSound();
  const a = new Audio(src);
  a.volume = Math.min(1, Math.max(0, volume / 100));
  playing = a;
  void a.play().catch(() => { if (playing === a) playing = null; });
  a.addEventListener('ended', () => { if (playing === a) stopSound(); });
  cut = setTimeout(() => {
    fade = setInterval(() => {
      if (playing !== a) { clearInterval(fade); return; }
      if (a.volume <= 0.06) stopSound(); else a.volume = Math.max(0, a.volume - 0.06);
    }, 50);
  }, MAX_FILE_MS);
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { ctx = null; }
  return ctx;
}

/** Gọi trong một lần bấm của người dùng để trình duyệt cho phép phát tiếng về sau. */
export function unlock() {
  const c = audio();
  if (c && c.state === 'suspended') void c.resume().catch(() => {});
}
if (typeof document !== 'undefined') {
  const once = () => { unlock(); document.removeEventListener('pointerdown', once); document.removeEventListener('keydown', once); };
  document.addEventListener('pointerdown', once);
  document.addEventListener('keydown', once);
}

/** Phát âm báo cho `kind` theo kiểu `style`: một file mp3, hoặc giai điệu của `kind` bằng một kiểu tiếng tổng hợp
    (không nhận ra kiểu thì dùng chuông gió). `volume` từ 0 đến 100. */
export function chime(kind: Chime, style = 'chime', volume = 70) {
  if (volume <= 0) return;
  const file = FILES.find((f) => f.id === style);
  if (file) { playFile(file.src, volume); return; }
  stopSound();
  const c = audio();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => {});
  const voice = (STYLES.find((s) => s.id === style) || STYLES[0]).voice;
  const out = c.createGain();
  out.gain.value = Math.pow(Math.min(100, volume) / 100, 2) * 2;      // bình phương cho thanh trượt nghe đều tay hơn
  out.connect(c.destination);
  const t0 = c.currentTime + 0.03;
  TUNES[kind].forEach((n) => voice(c, out, n, t0));
  setTimeout(() => out.disconnect(), 4000);
}

/** Tiếng leng keng khi các viên trong lọ cảm xúc va vào thành lọ: một tiếng thủy tinh rất ngắn, cao độ đổi nhẹ mỗi lần. */
export function clink(strength: number, volume = 70) {
  const c = audio();
  if (!c || volume <= 0 || c.state !== 'running') return;
  const t = c.currentTime, base = 2100 + Math.random() * 1500, peak = Math.max(0.02, Math.min(0.3, 0.3 * strength)) * Math.pow(volume / 100, 2) * 2;
  const out = c.createGain();
  out.gain.value = 1;
  out.connect(c.destination);
  tone(c, out, 'sine', base, t, t + 0.16, peak, 0.002);
  tone(c, out, 'sine', base * 2.42, t, t + 0.08, peak * 0.45, 0.002);
  tone(c, out, 'triangle', base * 0.5, t, t + 0.05, peak * 0.3, 0.002);
  setTimeout(() => out.disconnect(), 400);
}

/** Thông báo của hệ điều hành, chỉ hiện khi tab đang bị che và người dùng đã cho phép. */
export function notify(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !document.hidden) return;
    new Notification(title, { body, tag: 'girido-' + title });
  } catch { /* trình duyệt không hỗ trợ: đã có âm báo và thẻ nhắc trong trang */ }
}
export function askNotify() {
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') void Notification.requestPermission(); } catch { /* bỏ qua */ }
}
