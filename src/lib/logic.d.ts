export interface Work { id: string; name: string; order: number }
export interface Project { id: string; name: string; createdAt: string; works: Work[] }
export interface Sub { id: string; text: string; done: boolean }
/** `workId` rỗng: việc không nằm trong công việc nào. Khi đó có `projectId` là việc nằm thẳng trong project, không có là việc lẻ.
    `date` rỗng: việc trong project chưa hẹn ngày (việc lẻ thì luôn có ngày). `pomos`: số pomodoro đã xong. `subs`: các mục con. */
export interface Todo { id: string; workId: string; projectId?: string; text: string; date: string; done: boolean; doneAt: string | null; pomos?: number; subs?: Sub[] }
export interface Note { id: string; text: string; createdAt: string; updatedAt: string; pinned?: boolean }
/** `slot`: ô trên khu đất của tháng mà cây ngày này đứng (0 đến SLOTS - 1); không có thì app tự xếp. */
export interface Day { kind?: string; planted?: boolean; mood?: number; slot?: number }
export interface PlotCell { day: number; kind: string }
export interface State { projects: Project[]; todos: Todo[]; days: Record<string, Day>; notes: Note[] }
export interface Progress { total: number; done: number; pct: number }
export type PlantReason = 'ok' | 'no-todos' | 'remaining' | 'planted' | 'past' | 'future';
export interface ImportSummary { projects: number; works: number; todos: number; trees: number }
export type ImportResult = { ok: true; state: State; summary: ImportSummary } | { ok: false; error: string };
export interface ExportFile extends State { app: 'giri-garden'; version: 1; exportedAt: string }

declare const GG: {
  KINDS: string[];
  emptyState(): State;
  todayStr(d?: Date): string;
  parseDate(s: string): Date;
  isDate(s: unknown): s is string;
  addDays(s: string, n: number): string;
  weekOf(s: string): string[];
  monthKey(s: string): string;
  isMonthKey(s: unknown): s is string;
  daysInMonth(mk: string): number;
  shiftMonth(mk: string, n: number): string;
  todosOn(st: State, date: string): Todo[];
  dayProgress(st: State, date: string): Progress;
  stageFor(pct: number, total: number): number;
  kindFor(st: State, date: string): string;
  canPlant(st: State, date: string, today: string): { ok: boolean; reason: PlantReason; remaining: number };
  SLOTS: number;
  isSlot(n: unknown): n is number;
  monthLayout(st: State, mk: string): (PlotCell | null)[];
  plant(st: State, date: string, today: string, slot?: number): State;
  moveTree(st: State, mk: string, from: number, to: number): State;
  settleToday(st: State, today: string): State;
  streak(st: State, today: string): number;
  monthDays(st: State, mk: string): (string | null)[];
  monthMoods(st: State, mk: string): number[];
  setKind(st: State, date: string, kind: string): State;
  setMood(st: State, date: string, level: number): State;
  newId(prefix: string): string;
  findWork(st: State, workId: string): { project: Project; work: Work } | null;
  addProject(st: State, name: string, today: string): State;
  renameProject(st: State, id: string, name: string): State;
  deleteProject(st: State, id: string): State;
  addWork(st: State, projectId: string, name: string): State;
  renameWork(st: State, id: string, name: string): State;
  deleteWork(st: State, id: string): State;
  addTodo(st: State, t: { workId: string; projectId?: string; text: string; date: string }): State;
  addSub(st: State, todoId: string, text: string, nowIso: string): State;
  toggleSub(st: State, todoId: string, subId: string, nowIso: string): State;
  renameSub(st: State, todoId: string, subId: string, text: string): State;
  deleteSub(st: State, todoId: string, subId: string, nowIso: string): State;
  directTodos(st: State, projectId: string): Todo[];
  addNote(st: State, text: string, nowIso: string): State;
  updateNote(st: State, id: string, text: string, nowIso: string): State;
  pinNote(st: State, id: string): State;
  deleteNote(st: State, id: string): State;
  sortNotes(st: State): Note[];
  updateTodo(st: State, id: string, patch: { text?: string; date?: string; workId?: string }): State;
  toggleTodo(st: State, id: string, nowIso: string): State;
  deleteTodo(st: State, id: string): State;
  addPomo(st: State, id: string): State;
  overdue(st: State, today: string): Todo[];
  carryOver(st: State, ids: string[], today: string): State;
  workStats(st: State, workId: string): { total: number; done: number; status: 'done' | 'now' | 'new' };
  projectStats(st: State, projectId: string): Progress;
  exportData(st: State, nowIso: string): ExportFile;
  validateImport(o: unknown): ImportResult;
};
export default GG;
