// Màn chào người mới: bốn bước ngắn giới thiệu việc → cây → khu đất → mấy thứ đi kèm.
// Tự hiện một lần khi tài khoản chưa có gì; xem lại được ở Cài đặt.
import { useEffect, useMemo, useRef, useState } from 'react';
import Giri from './lib/giri';
import { Html, IconBtn } from './ui';

const KEY = 'girido-welcomed-v1';
export function welcomed(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return true; }      // không đọc được thì đừng làm phiền
}
export function markWelcomed() {
  try { localStorage.setItem(KEY, '1'); } catch { /* lần sau có thể hiện lại, không sao */ }
}
/** Cài đặt gọi cái này để mở lại màn chào. */
export const WELCOME_EVENT = 'girido:welcome';

const SAMPLE_PLOT = Array.from({ length: 36 }, (_, k) => ({ 3: 'sen', 8: 'mai', 14: 'phuong', 16: 'tron', 21: 'dao', 27: 'thong' } as Record<number, string>)[k])
  .map((kind, k) => (kind ? { day: k + 1, kind } : null));

export default function Welcome({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const steps = useMemo(() => [
    {
      title: 'Hế lô, mình là Giri nè!',
      body: 'Mình sống trong khu rừng này. Mỗi ngày bồ ghi ra mấy việc cần làm, mình sẽ ngồi canh và cổ vũ cho.',
      art: <Html html={Giri.mascot('cheer', 150)} block />,
    },
    {
      title: 'Xong việc là cây lớn',
      body: 'Mỗi ngày có một cái cây. Tick xong việc nào là cây được tưới và lớn thêm một chút, từ hạt giống cho tới khi ra trái.',
      art: <div className="mk-welcome__row"><Html html={Giri.plant(1, 'tron', 70)} /><Html html={Giri.plant(3, 'tron', 90)} /><Html html={Giri.plant(5, 'tron', 110)} /></div>,
    },
    {
      title: 'Xong hết thì đem đi trồng',
      body: 'Làm xong hết việc trong ngày là bồ được mang cây ra khu đất của tháng, tự chọn chỗ trồng. Cuối tháng nhìn lại là có nguyên một khu vườn.',
      art: <Html html={Giri.plot(SAMPLE_PLOT, { size: 300 })} block />,
    },
    {
      title: 'Còn mấy món hay ho nữa',
      body: 'Bấm ▶ cạnh một việc để chạy pomodoro. Bỏ một viên vào lọ cảm xúc mỗi ngày (lắc lọ thử coi). Chợt nghĩ ra gì thì ghi vào tab Ghi chú. Giờ thêm việc đầu tiên thôi nào!',
      art: <div className="mk-welcome__row"><Html html={Giri.orb(5, 56)} /><Html html={Giri.jar([4, 5, 3, 5, 2, 4], 120)} /><Html html={Giri.orb(4, 56)} /></div>,
    },
  ], []);
  const last = step === steps.length - 1, s = steps[step];
  const close = () => { markWelcomed(); onClose(); };

  useEffect(() => { box.current?.querySelector<HTMLElement>('#welcome-next')?.focus(); }, [step]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') setStep((n) => Math.min(steps.length - 1, n + 1));
      else if (e.key === 'ArrowLeft') setStep((n) => Math.max(0, n - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div className="ga-dialog mk-welcome gg">
      <div className="gg-card ga-dialog__box mk-welcome__box" role="dialog" aria-modal="true" aria-label="Chào mừng tới Girido" ref={box}>
        <div className="mk-row">
          <p className="mk-welcome__count mk-grow">Bước {step + 1} / {steps.length}</p>
          <IconBtn name="close" label="Bỏ qua hướng dẫn" id="welcome-skip" onClick={close} />
        </div>
        <div className="mk-welcome__art" key={step}>{s.art}</div>
        <p className="gg-title mk-welcome__title">{s.title}</p>
        <p className="mk-welcome__body">{s.body}</p>
        <div className="mk-welcome__dots" aria-hidden="true">{steps.map((_, i) => <span className={i === step ? 'is-on' : ''} key={i} />)}</div>
        <div className="ga-dialog__actions">
          {step > 0 && <button className="gg-btn gg-btn--ghost" id="welcome-back" type="button" onClick={() => setStep(step - 1)}>Quay lại</button>}
          <button className="gg-btn gg-btn--leaf" id="welcome-next" type="button" onClick={() => (last ? close() : setStep(step + 1))}>{last ? 'Bắt đầu thôi' : 'Tiếp'}</button>
        </div>
      </div>
    </div>
  );
}
