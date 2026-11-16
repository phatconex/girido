Cây trong khu vườn: 19 loại cây Việt Nam chia ba nhóm (cây xanh, hoa, cây ăn trái), vẽ kiểu phẳng hai tông có chi tiết (thân hai tông, cành, cụm lá sáng tối, gân lá, đĩa cỏ dưới gốc), mỗi loại lớn qua sáu cấp từ hạt đến ra trái.

- Gọi `Giri.plant(stage, kind, size, bare)`; `stage` từ 0 đến 5, `kind` là một khóa trong `Giri.kinds`, `size` là chiều rộng px, `bare` là `true` khi không cần đĩa cỏ dưới gốc (trong ô khung, trên lối mòn).
- Ba nhóm trong `Giri.groups`. Cây xanh: `tron`, `thong`, `bach`, `giot`, `bui`, `tan` (bàng), `tre`, `xuongrong`. Hoa: `sen`, `huongduong`, `mai`, `dao`, `phuong`. Cây ăn trái: `dua`, `xoai`, `cam`, `chuoi`, `dudu`, `thanhlong`.
- Ở cấp 4 cây nở hoa, ở cấp 5 cây ăn trái có trái; các loại hoa giữ hoa ở cả hai cấp. Tre không có hoa và trái.
- Loại cây chọn lúc trồng và không đổi về sau.
- Cây của hôm nay lớn theo phần trăm việc đã xong trong ngày: 0% hạt, từ 1% mầm, 25% cây non, 50% cây lớn, 75% ra hoa, 100% ra trái. Cây đã trồng vào khu đất luôn ở cấp 5.
- Khi lên cấp, thay SVG bằng cấp mới và thêm lớp `is-grown` để cây nảy lên; xem GrowthJourney.
- Mỗi cây đứng trên một đĩa cỏ có vành đất. Mọi loại cây, kể cả hoa, tre, xương rồng và cây họ dừa, đều cố ý méo mó: thân cong hoặc ngả, lá to nhỏ không đều. Tán cây mỗi loại một dáng (tròn lệch, tam giác bo, vuông bo, quả trứng nghiêng, mũ nấm có cành lộ ra bên dưới…). Bóng đổ luôn ở góc dưới phải, có vài chiếc lá con chĩa ra khỏi tán. Khi vẽ thêm loại mới, giữ ba quy tắc đó và chỉ dùng bốn màu `tree-lime`, `tree-light`, `tree-mid`, `tree-dark`.
- Tên cấp trong `Giri.stages`. Luôn hiện tên cấp bằng chữ cạnh cây.
