Một dòng việc cần làm với ô tick; tick xong thì ô bật lên, chữ gạch ngang và giọt nước bắn ra.

- Dùng `label.gg-todo` chứa `input.gg-check`, `gg-todo__text` và tối đa một `gg-chip` ở cuối.
- `gg-todo--sub` là việc con, nằm trong thẻ của việc cha, không có cạnh đáy.
- Bạn cung cấp: nội dung việc (một câu, bắt đầu bằng động từ), trạng thái `checked`, và chip ngày nếu có.
- Khi tick, gọi `Giri.burst(ô tick, 'drops')` rồi cộng một giọt nước cho cây của hôm nay.
- Bỏ tick thì trừ lại giọt nước, không có hiệu ứng.
