Khu vườn lớn: cây của mọi tháng xếp dọc một lối mòn uốn lượn, tháng mới nhất ở trên cùng, mỗi tháng mở đầu bằng một tấm biển gỗ.

- Vẽ bằng `Giri.trail(months, opts)`; `months` là mảng `{ name, days }` theo thứ tự mới nhất trước, `days` cùng dạng với khu đất tháng.
- `opts.per` là số cây mỗi hàng (mặc định 9, hợp với chiều rộng điện thoại), `opts.size` là chiều rộng mỗi cây tính bằng px.
- Ngày không trồng thì bỏ qua, không để chỗ trống trên lối mòn.
- Lối mòn là đường đá cát 8px, tự rẽ ở cuối mỗi hàng. Không thêm nền hay khung cho từng hàng.
- Thêm `key` (khóa tháng dạng `YYYY-MM`) vào một phần tử của `months` thì tấm biển của tháng đó thành nút mang `data-month`; nhấn vào mở khu đất của tháng đó.
