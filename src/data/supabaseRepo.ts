// Kho Supabase: năm bảng projects, works, todos, days, notes (xem supabase/schema.sql). Mỗi dòng thuộc về một người dùng,
// Row Level Security bảo đảm ai chỉ đọc và ghi được dòng của người đó.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Repo } from './repo';
import { diff, fromRows, type Rows, type Change } from './rows';

const PAGE = 1000;   // Supabase trả tối đa 1000 dòng mỗi lần hỏi
const CHUNK = 500;

export function createSupabaseRepo(db: SupabaseClient, userId: string): Repo {
  async function all<T>(table: string, columns: string, order: string[]): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; ; from += PAGE) {
      let q = db.from(table).select(columns).eq('user_id', userId);
      order.forEach((c) => { q = q.order(c, { ascending: true }); });
      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error) throw error;
      out.push(...((data || []) as T[]));
      if (!data || data.length < PAGE) return out;
    }
  }
  async function write<T extends object>(table: string, c: Change<T>, keyCol: string) {
    for (let i = 0; i < c.upsert.length; i += CHUNK) {
      const rows = c.upsert.slice(i, i + CHUNK).map((r) => ({ ...r, user_id: userId }));
      const { error } = await db.from(table).upsert(rows, { onConflict: 'user_id,' + keyCol });
      if (error) throw error;
    }
  }
  async function remove(table: string, keys: string[], keyCol: string) {
    for (let i = 0; i < keys.length; i += CHUNK) {
      const { error } = await db.from(table).delete().eq('user_id', userId).in(keyCol, keys.slice(i, i + CHUNK));
      if (error) throw error;
    }
  }

  return {
    kind: 'supabase',
    async load() {
      const [projects, works, todos, days, notes] = await Promise.all([
        all<Rows['projects'][number]>('projects', 'id,name,created_on,pos', ['created_at', 'pos', 'id']),
        all<Rows['works'][number]>('works', 'id,project_id,name,sort', ['sort', 'id']),
        all<Rows['todos'][number]>('todos', 'id,work_id,project_id,text,date,done,done_at,pomos,subs,pos', ['created_at', 'pos', 'id']),
        all<Rows['days'][number]>('days', 'date,kind,planted,mood,slot', ['date']),
        all<Rows['notes'][number]>('notes', 'id,body,pinned,noted_at,edited_at,pos', ['created_at', 'pos', 'id']),
      ]);
      return fromRows({ projects, works, todos, days, notes });
    },
    async save(prev, next) {
      const c = diff(prev, next);
      // thêm và sửa đi từ cha xuống con; xóa đi từ con lên cha
      await write('projects', c.projects, 'id');
      await write('works', c.works, 'id');
      await write('todos', c.todos, 'id');
      await write('days', c.days, 'date');
      await write('notes', c.notes, 'id');
      await remove('todos', c.todos.remove, 'id');
      await remove('works', c.works.remove, 'id');
      await remove('projects', c.projects.remove, 'id');
      await remove('days', c.days.remove, 'date');
      await remove('notes', c.notes.remove, 'id');
    },
  };
}
