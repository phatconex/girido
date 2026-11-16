Lọ cảm xúc của một tháng: mỗi ngày chọn một trong năm mức, nắp lọ mở ra, viên tương ứng rơi vào rồi lăn và nảy như bi thật.

- Dựng lọ bằng `Giri.jarLive(phần tử, levels, size)`; `levels` là mảng các mức 1 đến 5 theo thứ tự ngày. Lọ hiện ra với các viên đã nằm yên sẵn, không rơi lại mỗi lần mở trang. Lọ chứa tối đa 32 viên.
- Hàm trả về ba lệnh: `add(level)` mở nắp, thả một viên mới rồi đóng nắp; `setLast(level)` đổi mặt viên của hôm nay và cho nó nảy lên; `count()` trả về số viên.
- Các viên va vào nhau và vào thành lọ, mặt xoay theo hướng lăn, rồi tự dừng sau vài giây.
- Hàng chọn dùng `gg-moods` với năm `button.gg-mood`, mỗi nút gồm `Giri.orb(level, 44)` và tên mức trong `Giri.feelings`.
- Mỗi ngày một viên: lần chọn đầu trong ngày gọi `add`, các lần chọn lại gọi `setLast`.
- Cần hình lọ tĩnh (ảnh thu nhỏ của tháng cũ) thì dùng `Giri.jar(levels, size)`.
- Năm màu `mood-*` luôn đi kèm nét mặt và tên mức; không dùng riêng màu để nói cảm xúc.
