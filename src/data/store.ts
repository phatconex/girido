// Giữ state của app trong bộ nhớ và tự lưu xuống kho sau mỗi thay đổi.
import GG from '../lib/logic';
import type { State } from '../lib/logic';
import type { Repo } from './repo';

/** loading: đang tải · saved: đã lưu · saving: đang lưu · error: chưa lưu được · load-error: chưa tải được (chặn ghi cho tới khi tải lại được) */
export type Status = 'loading' | 'saved' | 'saving' | 'error' | 'load-error';
export interface Snapshot { state: State; status: Status }

export interface Store {
  kind: Repo['kind'];
  ready: Promise<void>;
  get(): Snapshot;
  state(): State;
  subscribe(fn: () => void): () => void;
  apply(fn: (s: State) => State): void;
  replaceAll(st: State): Promise<Status>;
  retry(): Promise<void>;
  flush(): Promise<void>;
  /** Tải lại từ kho nếu không có gì đang chờ lưu (dùng khi quay lại trang, để thấy thay đổi từ máy khác). */
  refresh(): Promise<void>;
}

export function createStore(repo: Repo, opts: { delay?: number } = {}): Store {
  const delay = opts.delay ?? 300;
  let snap: Snapshot = { state: GG.emptyState(), status: 'loading' };
  let base: State = snap.state;            // bản mà kho đang giữ
  let loaded = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  const subs = new Set<() => void>();

  function set(patch: Partial<Snapshot>) {
    const next = { ...snap, ...patch };
    if (next.state === snap.state && next.status === snap.status) return;
    snap = next; subs.forEach((fn) => fn());
  }
  const dirty = () => snap.state !== base;

  function save(): Promise<void> {
    if (running) return running.then(() => (dirty() && snap.status !== 'error' ? save() : undefined));
    if (!loaded) { set({ status: 'load-error' }); return Promise.resolve(); }
    if (!dirty()) { set({ status: 'saved' }); return Promise.resolve(); }
    const target = snap.state;
    set({ status: 'saving' });
    running = repo.save(base, target).then(
      () => { base = target; running = null; if (dirty()) { if (!timer) schedule(0); } else set({ status: 'saved' }); },
      () => { running = null; set({ status: 'error' }); },
    );
    return running;
  }
  function schedule(ms: number) {
    if (!loaded) { set({ status: 'load-error' }); return; }
    set({ status: 'saving' });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void save(); }, ms);
  }
  function load(): Promise<void> {
    return repo.load().then(
      (st) => {
        // Bản trong kho luôn thắng lúc tải: thứ sửa khi chưa tải được không được phép đè lên dữ liệu thật.
        base = st; loaded = true;
        set({ state: st, status: 'saved' });
      },
      () => { loaded = false; set({ status: 'load-error' }); },
    );
  }

  const store: Store = {
    kind: repo.kind,
    ready: Promise.resolve(),
    get: () => snap,
    state: () => snap.state,
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    apply(fn) {
      const next = fn(snap.state);
      if (next === snap.state) return;
      set({ state: next }); schedule(delay);
    },
    replaceAll(st) {
      if (timer) { clearTimeout(timer); timer = null; }
      set({ state: st });
      return save().then(() => snap.status);
    },
    retry() {
      if (!loaded) return load();
      if (timer) { clearTimeout(timer); timer = null; }
      return save();
    },
    flush() {
      if (timer) { clearTimeout(timer); timer = null; return save(); }
      return running || Promise.resolve();
    },
    refresh() {
      if (!loaded || timer || running || dirty()) return Promise.resolve();
      return repo.load().then((st) => {
        if (timer || running || dirty()) return;             // người dùng vừa sửa trong lúc tải: giữ bản đang sửa
        if (JSON.stringify(st) === JSON.stringify(base)) return;
        base = st; set({ state: st, status: 'saved' });
      }, () => {});
    },
  };
  store.ready = load();
  return store;
}
