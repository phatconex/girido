// Màn hình Project: mindmap. Gốc bên trái là project, giữa là các công việc, lá bên phải là từng việc;
// đường nối chuyển xanh khi việc đã xong.
import { useState, type CSSProperties, type ReactNode } from 'react';
import GG from '../lib/logic';
import type { Project, Work } from '../lib/logic';
import { useApp } from '../app-context';
import { useDialogs } from '../dialogs';
import { Progress, fmtShort } from '../ui';

const ROW = 50, X = [0, 262, 572];
const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);
const at = (x: number, top: number): CSSProperties => ({ left: x, top });

export default function Projects() {
  const { state: st, store, today, params, go, apply, tick, editTodo } = useApp();
  const dialogs = useDialogs();
  const [open, setOpen] = useState<Record<string, boolean>>({});   // open[workId]: đang mở hết các việc đã xong
  const p: Project | undefined = st.projects.find((x) => x.id === params) || st.projects[0];

  const newProject = () => {
    void dialogs.ask({ title: 'Project mới', placeholder: 'Project của bạn tên gì?', yes: 'Tạo project' }).then((v) => {
      if (typeof v !== 'string') return;
      const before = store.state().projects.length;
      apply((s) => GG.addProject(s, v, today));
      const all = store.state().projects;
      if (all.length > before) go('#project-' + all[all.length - 1].id);
    });
  };

  if (!p) {
    return (
      <section className="mk-sec">
        <p className="mk-h1">Project</p>
        <p className="mk-empty">Chưa có project nào. Đặt tên cho việc lớn bạn muốn làm, rồi chia nó thành các công việc nhỏ.</p>
        <div><button className="gg-btn" id="proj-new" type="button" onClick={newProject}>Tạo project đầu tiên</button></div>
      </section>
    );
  }
  const ps = GG.projectStats(st, p.id), works = p.works.slice().sort((a, b) => a.order - b.order);

  const renameProject = () => { void dialogs.ask({ title: 'Đổi tên project', value: p.name }).then((v) => { if (typeof v === 'string') apply((s) => GG.renameProject(s, p.id, v)); }); };
  const deleteProject = () => {
    void dialogs.confirm({ title: 'Xóa project "' + p.name + '"?', body: 'Xóa project này cùng ' + works.length + ' công việc và ' + ps.total + ' việc bên trong? Cây đã trồng vẫn còn.', yes: 'Xóa project', danger: true }).then((ok) => {
      if (!ok) return;
      apply((s) => GG.deleteProject(s, p.id)); dialogs.toast('Đã xóa project'); go('#project');
    });
  };
  const editWork = (w: Work, total: number) => {
    void dialogs.ask({ title: 'Công việc', value: w.name, danger: 'Xóa công việc' }).then((v) => {
      if (typeof v === 'string') { apply((s) => GG.renameWork(s, w.id, v)); return; }
      if (!v) return;
      void dialogs.confirm({ title: 'Xóa công việc "' + w.name + '"?', body: 'Xóa công việc này cùng ' + total + ' việc bên trong? Cây đã trồng vẫn còn.', yes: 'Xóa công việc', danger: true }).then((ok) => {
        if (ok) { apply((s) => GG.deleteWork(s, w.id)); dialogs.toast('Đã xóa công việc'); }
      });
    });
  };
  const addLeaf = (w: Work) => {
    void dialogs.askTodo({ title: 'Thêm việc cho "' + w.name + '"', date: today, yes: 'Thêm việc' }).then((r) => {
      if (r && !('danger' in r)) apply((s) => GG.addTodo(s, { workId: w.id, text: r.text, date: r.date }));
    });
  };
  const addWork = () => {
    void dialogs.ask({ title: 'Công việc mới của "' + p.name + '"', placeholder: 'Chia project thành công việc gì?', yes: 'Thêm công việc' }).then((v) => { if (typeof v === 'string') apply((s) => GG.addWork(s, p.id, v)); });
  };

  /* ---- xếp chỗ cho từng nút của mindmap ---- */
  const nodes: ReactNode[] = [], links: { d: string; done: boolean }[] = [], centers: { y: number; done: boolean }[] = [];
  let y = 8;
  works.forEach((w, wi) => {
    const top = y, ws = GG.workStats(st, w.id), cys: { cy: number; done: boolean }[] = [];
    const todos = st.todos.filter((t) => t.workId === w.id).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    // việc đã xong nhiều thì gộp thành một lá, để nhánh không dài lê thê
    const doneList = todos.filter((t) => t.done), fold = doneList.length > 3 && !open[w.id];
    if (doneList.length > 3) {
      nodes.push(
        <button className="mk-node mk-leaf is-done" id={'fold-' + w.id} key={'fold-' + w.id} type="button" aria-expanded={!fold} style={at(X[2], y)} onClick={() => setOpen((o) => ({ ...o, [w.id]: fold }))}>
          <span className="mk-leaf__dot">✓</span>
          <span className="mk-leaf__text" style={{ textDecoration: 'none' }}>{doneList.length} việc đã xong</span>
          <span className="gg-chip gg-chip--leaf">{fold ? 'Mở ra' : 'Thu lại'}</span>
        </button>,
      );
      cys.push({ cy: y + 20, done: true }); y += ROW;
    }
    (fold ? todos.filter((t) => !t.done) : todos).forEach((t) => {
      const late = !t.done && t.date < today, isNow = t.date === today;
      nodes.push(
        <div className={'mk-node mk-leaf' + (t.done ? ' is-done' : '')} key={t.id} style={at(X[2], y)}>
          <button className="mk-leaf__dot" id={'leaf-' + t.id} type="button" aria-pressed={t.done} aria-label={(t.done ? 'Bỏ tick: ' : 'Xong: ') + t.text} onClick={(e) => tick(t, e.currentTarget)}>{t.done ? '✓' : ''}</button>
          <button className="mk-leaf__text" id={'leaf-edit-' + t.id} type="button" aria-label={'Sửa: ' + t.text} onClick={() => editTodo(t)}>{t.text}</button>
          <span className={'gg-chip' + (isNow ? ' gg-chip--sun' : late ? ' gg-chip--ember' : '')}>{isNow ? 'Hôm nay' : (late ? 'Trễ ' : '') + fmtShort(t.date)}</span>
        </div>,
      );
      cys.push({ cy: y + 20, done: t.done }); y += ROW;
    });
    nodes.push(<button className="mk-node mk-leaf mk-leaf--add" id={'add-leaf-' + w.id} key={'add-' + w.id} type="button" style={at(X[2], y)} onClick={() => addLeaf(w)}>+ Thêm việc</button>);
    y += ROW;
    const wy = (top + y - ROW) / 2 + 20, cls = ws.status === 'done' ? ' is-done' : ws.status === 'now' ? ' is-now' : '';
    nodes.push(
      <button className={'mk-node mk-work gg-work' + cls} id={'work-' + w.id} key={w.id} type="button" aria-label={'Sửa công việc ' + w.name} style={at(X[1], wy - 28)} onClick={() => editWork(w, ws.total)}>
        <span className="gg-work__num">{pad2(wi + 1)}</span>
        <span className="gg-work__name">{w.name}<span className="gg-work__meta">{ws.done} / {ws.total} việc</span></span>
      </button>,
    );
    cys.forEach((c) => links.push({ done: c.done, d: 'M' + (X[1] + 250) + ' ' + wy + ' C' + (X[1] + 290) + ' ' + wy + ' ' + (X[2] - 44) + ' ' + c.cy + ' ' + X[2] + ' ' + c.cy }));
    centers.push({ y: wy, done: ws.status === 'done' });
    y += 20;
  });
  nodes.push(<button className="mk-node mk-leaf mk-leaf--add" id="add-work" key="add-work" type="button" style={at(X[1], y)} onClick={addWork}>+ Thêm công việc</button>);
  const height = Math.max(y + 56, 200), ry = centers.length ? (centers[0].y + centers[centers.length - 1].y) / 2 : 90;
  centers.forEach((c) => links.push({ done: c.done, d: 'M190 ' + ry + ' C230 ' + ry + ' 222 ' + c.y + ' ' + X[1] + ' ' + c.y }));

  return (
    <>
      <section className="mk-sec">
        <div className="mk-head">
          <p className="mk-h1 mk-grow">Project</p>
          <div className="mk-row">
            {st.projects.map((q) => (
              <button className={'gg-btn ' + (q.id === p.id ? '' : 'gg-btn--ghost ') + 'mk-mini'} id={'proj-' + q.id} key={q.id} type="button" aria-pressed={q.id === p.id} onClick={() => go('#project-' + q.id)}>
                {q.name} · {GG.projectStats(st, q.id).pct}%
              </button>
            ))}
            <button className="gg-btn gg-btn--ghost mk-mini" id="proj-new" type="button" onClick={newProject}>+ Project mới</button>
          </div>
        </div>
        <div className="mk-row">
          <p className="gg-muted mk-grow">Bấm vòng tròn để tick xong, bấm chữ để sửa. Đường nối chuyển xanh khi việc đã xong.</p>
          <button className="gg-btn gg-btn--ghost mk-mini" id="rename-project" type="button" onClick={renameProject}>Đổi tên</button>
          <button className="gg-btn gg-btn--clay mk-mini" id="delete-project" type="button" onClick={deleteProject}>Xóa project</button>
        </div>
      </section>
      <div className="mk-mindwrap">
        <div className="mk-mind" style={{ height }}>
          <svg aria-hidden="true">{links.map((l, i) => <path className={'mk-link' + (l.done ? ' mk-link--done' : '')} d={l.d} key={i} />)}</svg>
          {nodes}
          <div className="mk-node mk-root" id="mind-root" style={at(0, Math.max(0, ry - 64))}>
            <p className="mk-root__name">{p.name}</p>
            <span className={'gg-chip' + (ps.total && ps.done === ps.total ? ' gg-chip--leaf' : '')}>{ps.total ? ps.done + ' / ' + ps.total + ' việc · ' + ps.pct + '%' : 'Chưa có việc'}</span>
            <Progress cls="gg-progress--leaf" value={ps.pct} label={'Tiến độ của ' + p.name} />
          </div>
        </div>
      </div>
    </>
  );
}
