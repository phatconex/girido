// Màn hình Project: mindmap. Gốc bên trái là project, giữa là các công việc, lá bên phải là từng việc;
// đường nối chuyển xanh khi việc đã xong.
import { useState, type CSSProperties, type ReactNode } from 'react';
import GG from '../lib/logic';
import type { Project, Todo, Work } from '../lib/logic';
import { useApp } from '../app-context';
import { useDialogs } from '../dialogs';
import { Icon, Progress, fmtShort } from '../ui';

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
  // work có giá trị: thêm vào công việc đó; không có: thêm thẳng vào project (việc chung)
  const addLeaf = (w?: Work) => {
    void dialogs.askTodo({ title: 'Thêm việc cho "' + (w ? w.name : p.name) + '"', date: today, yes: 'Thêm việc' }).then((r) => {
      if (r && !('danger' in r)) apply((s) => GG.addTodo(s, w ? { workId: w.id, text: r.text, date: r.date } : { workId: '', projectId: p.id, text: r.text, date: r.date }));
    });
  };
  const addWork = () => {
    void dialogs.ask({ title: 'Công việc mới của "' + p.name + '"', placeholder: 'Chia project thành công việc gì?', yes: 'Thêm công việc' }).then((v) => { if (typeof v === 'string') apply((s) => GG.addWork(s, p.id, v)); });
  };

  /* ---- xếp chỗ cho từng nút của mindmap ---- */
  const nodes: ReactNode[] = [], links: { d: string; done: boolean }[] = [], centers: { y: number; done: boolean }[] = [];
  let y = 8;
  // Nhánh đầu là "việc chung": việc nằm thẳng trong project. Nó hiện khi project chưa có công việc nào, hoặc đã có việc chung.
  const direct = GG.directTodos(st, p.id), showDirect = direct.length > 0 || !works.length;
  const branches: { id: string; work?: Work; list: Todo[] }[] = (showDirect ? [{ id: 'direct-' + p.id, list: direct }] : [] as { id: string; work?: Work; list: Todo[] }[])
    .concat(works.map((w) => ({ id: w.id, work: w, list: st.todos.filter((t) => t.workId === w.id) })));
  branches.forEach((b) => {
    const w = { id: b.id }, wi = b.work ? works.indexOf(b.work) : -1;
    const doneCount = b.list.filter((t) => t.done).length;
    const ws = { total: b.list.length, done: doneCount, status: b.list.length && doneCount === b.list.length ? 'done' : doneCount > 0 ? 'now' : 'new' };
    const top = y, cys: { cy: number; done: boolean }[] = [], head = nodes.length;   // head: chỗ chèn nút công việc, đứng trước các việc của nó
    const todos = b.list.slice().sort((a, b2) => (a.date < b2.date ? -1 : a.date > b2.date ? 1 : 0));
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
          <button className="mk-leaf__text" id={'leaf-edit-' + t.id} type="button" aria-label={'Sửa: ' + t.text} onClick={() => editTodo(t)}>{t.text}{t.subs?.length ? ' (' + t.subs.filter((s) => s.done).length + '/' + t.subs.length + ')' : ''}</button>
          <span className={'gg-chip' + (isNow ? ' gg-chip--sun' : late ? ' gg-chip--ember' : '')}>{isNow ? 'Hôm nay' : (late ? 'Trễ ' : '') + fmtShort(t.date)}</span>
        </div>,
      );
      cys.push({ cy: y + 20, done: t.done }); y += ROW;
    });
    nodes.push(<button className="mk-node mk-leaf mk-leaf--add" id={'add-leaf-' + w.id} key={'add-' + w.id} type="button" style={at(X[2], y)} onClick={() => addLeaf(b.work)}>+ Thêm việc</button>);
    y += ROW;
    const wy = (top + y - ROW) / 2 + 20, cls = ws.status === 'done' ? ' is-done' : ws.status === 'now' ? ' is-now' : '';
    const work = b.work;
    nodes.splice(head, 0, work ? (
      <button className={'mk-node mk-work gg-work' + cls} id={'work-' + w.id} key={w.id} type="button" aria-label={'Sửa công việc ' + work.name} style={at(X[1], wy - 28)} onClick={() => editWork(work, ws.total)}>
        <span className="gg-work__num">{pad2(wi + 1)}</span>
        <span className="gg-work__name">{work.name}<span className="gg-work__meta">{ws.done} / {ws.total} việc</span></span>
      </button>
    ) : (
      <div className={'mk-node mk-work mk-work--direct gg-work' + cls} id="work-direct" key={w.id} style={at(X[1], wy - 28)}>
        <span className="gg-work__num">✓</span>
        <span className="gg-work__name">Việc chung<span className="gg-work__meta">{ws.done} / {ws.total} việc · thẳng trong project</span></span>
      </div>
    ));
    cys.forEach((c) => links.push({ done: c.done, d: 'M' + (X[1] + 250) + ' ' + wy + ' C' + (X[1] + 290) + ' ' + wy + ' ' + (X[2] - 44) + ' ' + c.cy + ' ' + X[2] + ' ' + c.cy }));
    centers.push({ y: wy, done: ws.status === 'done' });
    y += 20;
  });
  nodes.push(<button className="mk-node mk-leaf mk-leaf--add" id="add-work" key="add-work" type="button" style={at(X[1], y)} onClick={addWork}>+ Thêm công việc</button>);
  if (!showDirect) nodes.push(<button className="mk-node mk-leaf mk-leaf--add" id="add-direct" key="add-direct" type="button" style={at(X[1] + 176, y)} onClick={() => addLeaf()}>+ Thêm việc chung</button>);
  const height = Math.max(y + 56, 200), ry = centers.length ? (centers[0].y + centers[centers.length - 1].y) / 2 : 90;
  centers.forEach((c) => links.push({ done: c.done, d: 'M190 ' + ry + ' C230 ' + ry + ' 222 ' + c.y + ' ' + X[1] + ' ' + c.y }));

  return (
    <>
      <section className="mk-sec">
        <div className="mk-head">
          <p className="mk-h1 mk-grow">Project</p>
          <div className="mk-tools">
            <button className="mk-tool" id="rename-project" type="button" onClick={renameProject}><Icon name="edit" />Đổi tên</button>
            <button className="mk-tool mk-tool--danger" id="delete-project" type="button" onClick={deleteProject}><Icon name="trash" />Xóa</button>
          </div>
        </div>
        <div className="mk-ptabs" role="group" aria-label="Chọn project">
          {st.projects.map((q) => (
            <button className={'mk-ptab' + (q.id === p.id ? ' is-on' : '')} id={'proj-' + q.id} key={q.id} type="button" aria-pressed={q.id === p.id} onClick={() => go('#project-' + q.id)}>
              <span className="mk-ptab__name">{q.name}</span><span className="mk-ptab__pct">{GG.projectStats(st, q.id).pct}%</span>
            </button>
          ))}
          <button className="mk-ptab mk-ptab--new" id="proj-new" type="button" onClick={newProject}><Icon name="plus" />Project mới</button>
        </div>
        <p className="gg-muted">Project nhỏ thì thêm việc thẳng vào "Việc chung"; project lớn thì chia thành các công việc. Bấm vòng tròn để tick xong, bấm chữ để sửa.</p>
      </section>
      <div className="mk-mindwrap">
        <div className="mk-mind" style={{ height }}>
          <svg aria-hidden="true">{links.map((l, i) => <path className={'mk-link' + (l.done ? ' mk-link--done' : '')} d={l.d} key={i} />)}</svg>
          <div className="mk-node mk-root" id="mind-root" style={at(0, Math.max(0, ry - 64))}>
            <p className="mk-root__name">{p.name}</p>
            <span className={'gg-chip' + (ps.total && ps.done === ps.total ? ' gg-chip--leaf' : '')}>{ps.total ? ps.done + ' / ' + ps.total + ' việc · ' + ps.pct + '%' : 'Chưa có việc'}</span>
            <Progress cls="gg-progress--leaf" value={ps.pct} label={'Tiến độ của ' + p.name} />
          </div>
          {nodes}
        </div>
      </div>
    </>
  );
}
