// Đổi qua lại giữa state của app và các dòng trong bảng Supabase, và tính phần chênh giữa hai state.
// Hàm thuần, không gọi mạng.
import type { State, Project, Todo, Day, Sub, Note } from '../lib/logic';

export interface ProjectRow { id: string; name: string; created_on: string; pos: number }
export interface WorkRow { id: string; project_id: string; name: string; sort: number }
/** `work_id` null: việc không nằm trong công việc nào; khi đó `project_id` có giá trị là việc nằm thẳng trong project, null là việc lẻ. */
export interface TodoRow { id: string; work_id: string | null; project_id: string | null; text: string; date: string | null; done: boolean; done_at: string | null; pomos: number; subs: Sub[]; pos: number }
export interface NoteRow { id: string; body: string; pinned: boolean; noted_at: string; edited_at: string; pos: number }
export interface DayRow { date: string; kind: string | null; planted: boolean; mood: number | null; slot: number | null }
export interface Rows { projects: ProjectRow[]; works: WorkRow[]; todos: TodoRow[]; days: DayRow[]; notes: NoteRow[] }

export interface Change<T> { upsert: T[]; remove: string[] }
export interface Changes { projects: Change<ProjectRow>; works: Change<WorkRow>; todos: Change<TodoRow>; days: Change<DayRow>; notes: Change<NoteRow> }

export function toRows(st: State): Rows {
  const projects: ProjectRow[] = [], works: WorkRow[] = [];
  st.projects.forEach((p: Project, i) => {
    projects.push({ id: p.id, name: p.name, created_on: p.createdAt, pos: i });
    p.works.forEach((w) => works.push({ id: w.id, project_id: p.id, name: w.name, sort: w.order }));
  });
  const todos = st.todos.map((t: Todo, i): TodoRow => ({
    id: t.id, work_id: t.workId || null, project_id: (!t.workId && t.projectId) || null, text: t.text, date: t.date || null, done: t.done, done_at: t.doneAt,
    pomos: t.pomos || 0, subs: (t.subs || []).map((s) => ({ id: s.id, text: s.text, done: s.done })), pos: i,
  }));
  const days = Object.keys(st.days).sort().map((date): DayRow => {
    const d: Day = st.days[date];
    return { date, kind: d.kind ?? null, planted: !!d.planted, mood: d.mood ?? null, slot: d.slot ?? null };
  });
  const notes = (st.notes || []).map((n: Note, i): NoteRow => ({ id: n.id, body: n.text, pinned: !!n.pinned, noted_at: n.createdAt, edited_at: n.updatedAt, pos: i }));
  return { projects, works, todos, days, notes };
}

/** Các dòng phải được xếp sẵn theo thứ tự hiển thị (xem supabaseRepo.load). */
export function fromRows(rows: Rows): State {
  const byProject = new Map<string, WorkRow[]>();
  rows.works.forEach((w) => { const l = byProject.get(w.project_id) || []; l.push(w); byProject.set(w.project_id, l); });
  const workIds = new Set(rows.works.map((w) => w.id));
  const projects = rows.projects.map((p) => ({
    id: p.id, name: p.name, createdAt: p.created_on,
    works: (byProject.get(p.id) || []).slice().sort((a, b) => a.sort - b.sort).map((w) => ({ id: w.id, name: w.name, order: w.sort })),
  }));
  const projectIds = new Set(rows.projects.map((p) => p.id));
  // việc lẻ mà không có ngày thì không hiện được ở đâu: bỏ qua (cơ sở dữ liệu cũng đã chặn trường hợp này)
  const todos = rows.todos.filter((t) => t.date || t.work_id || t.project_id).filter((t) => (t.work_id == null ? t.project_id == null || projectIds.has(t.project_id) : workIds.has(t.work_id))).map((t): Todo => {
    const todo: Todo = { id: t.id, workId: t.work_id || '', text: t.text, date: t.date || '', done: t.done, doneAt: t.done_at };
    if (!t.work_id && t.project_id) todo.projectId = t.project_id;
    if (t.pomos) todo.pomos = t.pomos;
    if (Array.isArray(t.subs) && t.subs.length) todo.subs = t.subs.map((s) => ({ id: s.id, text: s.text, done: !!s.done }));
    return todo;
  });
  const days: State['days'] = {};
  rows.days.forEach((r) => {
    const d: Day = {};
    if (r.kind) d.kind = r.kind;
    if (r.planted) d.planted = true;
    if (r.mood != null) d.mood = r.mood;
    if (r.slot != null) d.slot = r.slot;
    days[r.date] = d;
  });
  const notes = (rows.notes || []).map((n): Note => {
    const note: Note = { id: n.id, text: n.body, createdAt: n.noted_at, updatedAt: n.edited_at };
    if (n.pinned) note.pinned = true;
    return note;
  });
  return { projects, todos, days, notes };
}

// `pos` chỉ dùng để giữ thứ tự lúc mới thêm, nên không tính là thay đổi: xóa một việc không làm ghi lại mọi việc đứng sau.
const sig = (row: object) => JSON.stringify({ ...row, pos: undefined });

function change<T extends object>(prev: T[], next: T[], key: (r: T) => string): Change<T> {
  const old = new Map(prev.map((r) => [key(r), sig(r)]));
  const now = new Set(next.map(key));
  return {
    upsert: next.filter((r) => old.get(key(r)) !== sig(r)),
    remove: prev.map(key).filter((k) => !now.has(k)),
  };
}

export function diff(prev: State, next: State): Changes {
  const a = toRows(prev), b = toRows(next);
  return {
    projects: change(a.projects, b.projects, (r) => r.id),
    works: change(a.works, b.works, (r) => r.id),
    todos: change(a.todos, b.todos, (r) => r.id),
    days: change(a.days, b.days, (r) => r.date),
    notes: change(a.notes, b.notes, (r) => r.id),
  };
}

export function isEmpty(c: Changes): boolean {
  return [c.projects, c.works, c.todos, c.days, c.notes].every((x) => !x.upsert.length && !x.remove.length);
}
