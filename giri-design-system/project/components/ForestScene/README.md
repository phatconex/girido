Cảnh rừng làm nền cho đầu mỗi màn hình: trời xanh nhạt, mây trôi chậm, hai ngọn đồi và một hàng cây phía sau nội dung.

- Thêm lớp `gg-forest` vào vùng đầu trang; trời và hai ngọn đồi tự vẽ. Nội dung đặt bên trong luôn nằm trên cảnh.
- Mây là các `span.gg-cloud` đặt vị trí bằng `left` và `top`; dùng 2 đến 3 đám, lệch nhịp bằng `animation-delay`.
- Hàng cây là `gg-forest__trees` chứa 3 đến 4 `Giri.plant()` cỡ khác nhau, nằm ở nửa phải để chừa chỗ cho Giri bên trái. Dùng chính các cây đã trồng gần đây nhất trong tháng.
- Chữ đặt trực tiếp lên cảnh chỉ ở nửa trên (phần trời); phần chữ dài đặt trong bong bóng thoại hoặc `gg-card--glass`.
- Cảnh rừng chỉ dùng ở đầu trang. Phần danh sách bên dưới nằm trên `bg` trơn để dễ đọc.
