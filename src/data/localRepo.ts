// Kho trên máy: cất toàn bộ state vào localStorage của trình duyệt. Dùng khi chưa nối Supabase.
import GG from '../lib/logic';
import type { State } from '../lib/logic';
import type { Repo } from './repo';

const KEY = 'girido-state-v1';

export function localAvailable(): boolean {
  try { localStorage.setItem(KEY + '-probe', '1'); localStorage.removeItem(KEY + '-probe'); return true; } catch { return false; }
}

export function createLocalRepo(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): Repo {
  return {
    kind: 'local',
    async load(): Promise<State> {
      const raw = storage.getItem(KEY);
      if (!raw) return GG.emptyState();
      const r = GG.validateImport(JSON.parse(raw));
      if (!r.ok) throw new Error(r.error);
      return r.state;
    },
    async save(_prev: State, next: State) {
      storage.setItem(KEY, JSON.stringify(GG.exportData(next, new Date().toISOString())));
    },
  };
}
