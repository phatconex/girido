import type { State } from '../lib/logic';

/** Nơi cất dữ liệu. App chỉ nói chuyện với kho qua hai hàm này. */
export interface Repo {
  kind: 'local' | 'supabase';
  load(): Promise<State>;
  /** Ghi phần khác nhau giữa `prev` (bản đã lưu lần trước) và `next`. Ném lỗi nếu chưa ghi được. */
  save(prev: State, next: State): Promise<void>;
}
