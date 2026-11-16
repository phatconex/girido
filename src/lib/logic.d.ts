export interface Work { id: string; name: string; order: number }
export interface Project { id: string; name: string; createdAt: string; works: Work[] }
export interface Todo { id: string; workId: string; text: string; date: string; done: boolean; doneAt: string | null }
export interface Day { kind?: string; planted?: boolean; mood?: number }
export interface State { projects: Project[]; todos: Todo[]; days: Record<string, Day> }
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
  plant(st: State, date: string, today: string): State;
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
  addTodo(st: State, t: { workId: string; text: string; date: string }): State;
  updateTodo(st: State, id: string, patch: { text?: string; date?: string; workId?: string }): State;
  toggleTodo(st: State, id: string, nowIso: string): State;
  deleteTodo(st: State, id: string): State;
  overdue(st: State, today: string): Todo[];
  carryOver(st: State, ids: string[], today: string): State;
  workStats(st: State, workId: string): { total: number; done: number; status: 'done' | 'now' | 'new' };
  projectStats(st: State, projectId: string): Progress;
  exportData(st: State, nowIso: string): ExportFile;
  validateImport(o: unknown): ImportResult;
};
export default GG;
