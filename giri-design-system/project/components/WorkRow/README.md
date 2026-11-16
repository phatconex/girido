Một công việc trong project, vẽ như một chặng trên lối mòn trong rừng: huy hiệu số nghiêng, dải tên bằng đá cát và thẻ trạng thái.

- Bọc các `button.gg-work` trong `gg-works`; các hàng chẵn tự lùi vào để tạo đường zíc zắc.
- Mỗi hàng gồm `gg-work__num` (số thứ tự hai chữ số), `gg-work__name` (tên công việc và một `gg-work__meta` ghi số việc đã xong), và `gg-work__tag` nếu có trạng thái.
- `is-done` tô huy hiệu xanh lá và thẻ ghi "Xong"; `is-now` tô xanh dương và thẻ ghi "Đang làm"; chưa bắt đầu thì để màu đá cát, không có thẻ.
- Nhấn một hàng mở danh sách việc từng ngày của công việc đó.
- Bạn cung cấp: thứ tự, tên (tối đa 4 từ), số việc đã xong trên tổng số, và trạng thái.
