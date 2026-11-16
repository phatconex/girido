Màn hình cây của hôm nay: Giri, cái cây đang lớn theo số việc đã xong trong ngày, thanh cấp độ và nút tưới, cùng trình tự chuyển động khi cây lên cấp.

- Bố cục từ trên xuống: `gg-talk` (Giri + bong bóng), cây trong `gg-plantbox`, rồi một `gg-card` chứa tên cấp, phần trăm, `gg-progress--lg` và nút `gg-btn--lg`.
- Mỗi việc tick xong cho một giọt nước. Nhấn Tưới cây: Giri chuyển sang `munch`, `Giri.rain(khung cây)` rơi 0,5 giây, sau đó đổi cây sang cấp mới với lớp `is-grown`, thanh cấp độ đầy lên, bong bóng thoại đổi câu, Giri `cheer` trong 2 giây rồi về `happy`.
- Khi xong hết việc trong ngày, cây lên cấp 5: gọi thêm `Giri.burst(khung cây, 'confetti')`, giữ Giri ở `cheer`, và nút đổi thành "Trồng vào khu đất". Nhấn nút thì chuyển sang khu đất tháng, cây nảy lên ở ô của hôm nay.
- Loại cây của hôm nay chọn ở bảng chọn cây trước khi tưới lần đầu; chưa chọn thì dùng loại của hôm qua.
- Bạn cung cấp: cấp hiện tại, phần trăm việc đã xong trong ngày, loại cây, và câu thoại cho từng cấp.
- Trong lúc mưa đang rơi, bỏ qua các lần nhấn tiếp theo.
