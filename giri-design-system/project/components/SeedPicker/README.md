Bảng chọn cây để trồng: 19 loại cây chia ba nhóm (cây xanh, hoa, cây ăn trái), mỗi ô khung là một loại ở dạng trưởng thành.

- Phía trên là `gg-tabs` với ba nhóm trong `Giri.groups` (mỗi nhóm có `key`, `name`, `kinds`).
- Đặt `gg-seeds` trong `gg-card__paper` của một `gg-card--panel` có `gg-tag` ghi câu hỏi.
- Mỗi lựa chọn là một `gg-seed` gồm `button.gg-frame` chứa `Giri.plant(5, kind, 58, true)` và tên loại cây bên dưới.
- Ô đang chọn mang `aria-pressed="true"`: khung chuyển vàng, nhấc lên và có dấu tick. Lựa chọn được giữ khi đổi nhóm.
- Nút xác nhận ghi rõ hành động kèm tên cây, ví dụ "Trồng hoa sen".
