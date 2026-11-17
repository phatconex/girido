import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** true khi trang được mở từ link đặt lại mật khẩu trong thư. Phải đọc trước khi tạo client, vì client đọc xong sẽ xóa phần này khỏi địa chỉ. */
export const openedFromRecoveryLink = typeof window !== 'undefined' && /(^|[#&?])type=recovery(&|$)/.test(window.location.hash + window.location.search);

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** null khi chưa điền .env.local: app chạy ở chế độ lưu trên máy. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
