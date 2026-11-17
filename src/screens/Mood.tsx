// Màn hình Cảm xúc: lọ cảm xúc của tháng và năm mức để chọn cho hôm nay.
import { useLayoutEffect, useRef } from 'react';
import GG from '../lib/logic';
import Giri, { type LiveJar } from '../lib/giri';
import { useApp } from '../app-context';
import { Html, IconBtn, fmtMonth } from '../ui';
import { prefs } from '../timers/prefs';
import { clink, unlock } from '../timers/sound';

// lắc lọ: mỗi lần viên chạm thành lọ đủ mạnh thì kêu một tiếng (theo công tắc Âm báo và âm lượng trong Cài đặt)
const JAR_OPTS = {
  onGrab: unlock,
  onClink: (strength: number) => { const p = prefs.get(); if (p.sound) clink(strength, p.volume); },
};

export default function Mood() {
  const { state: st, today, params, go, apply, syncDay } = useApp();
  const nowMk = GG.monthKey(today), mk = GG.isMonthKey(params) ? params : nowMk;
  const moods = GG.monthMoods(st, mk), mine = st.days[today]?.mood || 0, current = mk === nowMk;
  const want = mk + ':' + moods.join('');
  const el = useRef<HTMLDivElement>(null), jar = useRef<LiveJar | null>(null), shown = useRef('');

  // Lọ tự chạy vật lý của nó. Chỉ dựng lại khi các viên trong lọ khác với thứ đang hiện (đổi tháng, nhập dữ liệu, đồng bộ từ máy khác).
  useLayoutEffect(() => {
    if (!el.current || shown.current === want) return;
    el.current.textContent = '';
    jar.current = Giri.jarLive(el.current, moods, 240, JAR_OPTS);
    shown.current = want;
  });

  const pick = (level: number) => {
    if (syncDay() || mine === level) return;
    if (jar.current && shown.current === want) {            // thả viên mới vào lọ đang hiện, không dựng lại lọ
      if (mine) { jar.current.setLast(level); shown.current = shown.current.slice(0, -1) + level; }
      else { jar.current.add(level); shown.current += level; }
    }
    apply((s) => GG.setMood(s, today, level));
  };

  return (
    <>
      <section className="mk-sec">
        <div className="mk-head">
          <IconBtn name="back" label="Tháng trước" id="mood-prev" cls="gg-btn--ghost mk-navbtn" onClick={() => go('#cam-xuc-' + GG.shiftMonth(mk, -1))} />
          <p className="mk-h1 mk-grow">Lọ cảm xúc {fmtMonth(mk, today).toLowerCase()}</p>
          <span className="gg-chip">{moods.length} viên</span>
          <IconBtn name="next" label="Tháng sau" id="mood-next" cls="gg-btn--ghost mk-navbtn" disabled={mk >= nowMk} onClick={() => go('#cam-xuc-' + GG.shiftMonth(mk, 1))} />
        </div>
        <div className="mk-jar" id="mood-jar" ref={el} />
        {moods.length > 0 && <p className="gg-muted mk-jar__hint">Cầm lọ kéo qua lại để lắc, các viên sẽ kêu leng keng.</p>}
      </section>
      <section className="mk-sec">
        <p className="mk-group">{current ? 'Hôm nay bạn thấy thế nào?' : 'Cảm xúc của tháng'}</p>
        {current ? (
          <div className="gg-moods">
            {Giri.feelings.map((name, i) => (
              <button className="gg-mood" id={'mood-' + (i + 1)} key={name} type="button" aria-pressed={mine === i + 1} onClick={() => pick(i + 1)}>
                <Html html={Giri.orb(i + 1, 44)} />{name}
              </button>
            ))}
          </div>
        ) : <p className="mk-empty">{moods.length ? 'Chỉ ghi được cảm xúc cho hôm nay.' : 'Tháng này chưa ghi cảm xúc nào.'}</p>}
      </section>
    </>
  );
}
