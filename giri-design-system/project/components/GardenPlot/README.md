Khu đất của một tháng, vẽ kiểu isometric: mỗi ngày trồng được một cây thì cây đó mọc lên ở một ô, hết tháng là một mảnh rừng nhỏ.

- Vẽ bằng `Giri.plot(days, opts)`; `days` là mảng dài bằng số ngày của tháng, phần tử thứ i là khóa loại cây trồng ngày i + 1, hoặc `null` nếu ngày đó chưa trồng.
- `opts.today` là ngày hôm nay: ô của nó sáng vàng và nhấp nháy nếu chưa trồng. `opts.fresh` là ngày vừa trồng xong: cây ở ô đó nảy lên một lần. `opts.size` là chiều rộng px.
- Khu đất có 36 ô (6 x 6), xếp từ góc xa đến góc gần; ngày 1 ở góc xa nhất. Ô của ngày chưa trồng là một vệt đất nhạt.
- Cây trong khu đất luôn ở dạng trưởng thành: hoa đang nở, cây ăn trái đang có trái.
- Mỗi cây là một nhóm `g.gg-pl-tree` mang `data-day`; nhấn vào để mở danh sách việc của ngày đó.
- Chỉ được trồng cây của một ngày khi mọi việc của ngày đó đã tick xong. Khi còn việc, nút "Trồng cây hôm nay" ở trạng thái `disabled` và ghi "Còn 2 việc nữa"; ngày không có việc nào thì không trồng được.
- Chuỗi ngày đếm số ngày liên tiếp đã trồng cây.
- Sau khi trồng, gọi `Giri.burst(cây vừa trồng, 'confetti')`.
- Đặt khu đất trên cảnh rừng `gg-forest`, phía trên là tên tháng với hai nút đá cát để lùi và tiến tháng, phía dưới là số cây trong tháng.
