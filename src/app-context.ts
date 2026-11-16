import { createContext, useContext } from 'react';
import type { State, Todo } from './lib/logic';
import type { Store, Status } from './data/store';

export interface Account { email: string; signOut(): Promise<void> }

export interface AppCtx {
  state: State;
  status: Status;
  store: Store;
  today: string;
  /** Phần sau tên màn hình trong địa chỉ, ví dụ ngày hoặc tháng đang xem. */
  params: string;
  account: Account | null;
  go(hash: string): void;
  /** Sửa state. Nếu hôm nay đã trồng mà sau khi sửa vẫn còn việc chưa xong thì cây quay về chờ. */
  apply(fn: (s: State) => State): void;
  /** Tick hoặc bỏ tick một việc; `el` là nơi giọt nước bắn ra. */
  tick(todo: Todo, el?: Element | null): void;
  editTodo(todo: Todo): void;
  /** true khi vừa sang ngày mới (màn hình sẽ vẽ lại theo ngày mới). */
  syncDay(): boolean;
  /** Ngày vừa trồng cây, để khu đất cho cây đó mọc lên có hiệu ứng. */
  fresh: { date: string; at: number } | null;
}

export const AppContext = createContext<AppCtx | null>(null);
export function useApp(): AppCtx {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp phải nằm trong Shell');
  return c;
}
