import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** null khi chưa điền .env.local: app chạy ở chế độ lưu trên máy. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
