# Girido

Ứng dụng việc cần làm cá nhân: mỗi ngày một cái cây, xong hết việc trong ngày thì trồng cây vào khu đất của tháng. Chú hươu cao cổ Giri đi cùng bạn.

Viết bằng React + TypeScript + Vite. Dữ liệu lưu trên Supabase, hoặc trong trình duyệt khi chưa nối Supabase.

## Chạy

```bash
npm install
npm run dev
```

Các lệnh khác: `npm test` (chạy test), `npm run build` (kiểm tra kiểu rồi build ra `dist/`), `npm run tokens` (sinh lại `src/styles/tokens.css` sau khi sửa `tokens.json`).

## Nối Supabase

1. Tạo một project trên supabase.com.
2. Mở **SQL Editor**, dán toàn bộ `supabase/schema.sql` rồi bấm Run. File này tạo bốn bảng `projects`, `works`, `todos`, `days` và bật Row Level Security để mỗi người chỉ thấy dữ liệu của mình.
3. Chép `.env.example` thành `.env.local`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (lấy ở Project Settings → API).
4. Chạy lại `npm run dev`. App sẽ hiện màn hình đăng nhập bằng email và mật khẩu.

Mặc định Supabase bắt xác nhận email khi tạo tài khoản. Muốn thử nhanh thì tắt ở Authentication → Sign In / Providers → Email → Confirm email.

Để trống `.env.local` thì app chạy ở chế độ lưu trên máy (localStorage), không cần đăng nhập.

## Chuyển dữ liệu

Cài đặt → Xuất JSON ở bản cũ (kể cả bản Giri Garden trên Claude), rồi Cài đặt → Khôi phục ở bản mới. Cách này cũng dùng để đưa dữ liệu đang lưu trên máy lên tài khoản Supabase.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/lib/logic.js` | Mọi luật của app (ngày, trồng cây, thêm/sửa/xóa, xuất/nhập). Hàm thuần, có test. |
| `src/lib/giri.js`, `world.js` | Hình vẽ SVG/CSS: Giri, 19 loại cây, khu đất, lọ cảm xúc, cảnh nền. |
| `src/data/` | `store.ts` giữ state và tự lưu; `localRepo.ts` và `supabaseRepo.ts` là hai kho; `rows.ts` đổi state thành dòng bảng và tính phần cần ghi. |
| `src/Shell.tsx` | Khung app: cây hôm nay, Giri, thẻ chọn màn hình. |
| `src/screens/` | Hôm nay, Project (mindmap), Khu vườn, Cảm xúc, Cài đặt, Đăng nhập. |
| `src/styles/` | `tokens.json` → `tokens.css`, `components.css` (design system), `app.css` (bố cục app). |
| `supabase/schema.sql` | Bảng và quyền truy cập. |
