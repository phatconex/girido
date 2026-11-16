Giri Garden là giao diện của một ứng dụng việc cần làm cá nhân: mỗi ngày có một cái cây, mỗi việc xong là một giọt nước, và khi xong hết việc trong ngày thì cây được trồng vào khu đất của tháng. Chú hươu cao cổ Giri đi cùng bạn suốt chặng đó. Cảm giác cần có: mát, mềm, vui như phim hoạt hình, nhưng vẫn đọc nhanh như một danh sách việc.

## Giọng nói

- Viết tiếng Việt, xưng "mình" (Giri) và gọi người dùng là "bạn". Câu ngắn, một ý.
- Giri khen việc cụ thể, không khen chung chung: "Xong 3 việc rồi, cây uống no nước!" thay vì "Tuyệt vời!".
- Việc trễ thì nhắc nhẹ, không trách: "Hôm qua còn 2 việc, mình mang sang hôm nay nhé?".
- Nút ghi đúng hành động: "Tưới cây", "Thêm việc", "Gieo hạt". Không dùng "OK", "Xác nhận".
- Không dùng emoji trong giao diện. Hình vui đến từ Giri, cây, giọt nước và viên cảm xúc vẽ bằng SVG.

## Màu

- Nền luôn là `bg`; vùng đầu trang có thể chuyển dần sang `bg-deep`. Thẻ dùng `surface`, thẻ đặt trên hình dùng `glass` kèm blur 16px.
- Chữ chính `ink`, chữ phụ `ink-soft`. Không đặt chữ lên `water-400` hay `sun-400` trừ khi dùng `on-sun`.
- Màu nền của nút và nhãn là pastel, nên chữ đặt lên luôn là màu đậm: `on-water` trên `water-500`, `on-leaf` trên `leaf-500`, `on-sun` trên `sun-400`. Không đặt chữ trắng lên màu pastel.
- Xanh dương là hành động: nút chính, tab đang chọn và thẻ đầu trang dùng `water-500`. Thứ cần nhìn rõ trên nền sáng (phần đầy của tiến độ, viền hôm nay, giọt nước) dùng `water-600`.
- Xanh lá là hoàn thành: ô tick đã chọn và nút hoàn thành dùng `leaf-500`, tiến độ công việc `leaf-600`, nhãn xong `leaf-100` + `leaf-text`.
- Vàng cam `giri-fur` và `giri-spot` chỉ dành cho Giri. Vàng `sun-400` mỗi màn hình chỉ dùng cho một thứ: phần thưởng hoặc chuỗi ngày.
- Lá cây chỉ dùng bốn tông `tree-lime`, `tree-light`, `tree-mid`, `tree-dark` cùng `bark`. Hoa và trái dùng `cream`, `sun-400`, `blush`, `petal-red`, `fruit-orange`, `fruit-magenta`.
- Quá hạn dùng `ember-500` trên `ember-100` và luôn có chữ "Trễ" đi kèm; không báo trạng thái chỉ bằng màu.
- Năm màu `mood-awful`, `mood-bad`, `mood-meh`, `mood-good`, `mood-great` chỉ dùng cho viên cảm xúc, không dùng cho nút hay nhãn.
- Chế độ ban đêm giữ nguyên các màu pastel và màu của mọi hình vẽ; chỉ nền và chữ đổi.

## Chất rừng

- Cả ứng dụng là một khu rừng mát: trời `bg-deep`, đồi và cây xanh pastel, mọi thứ bấm được trông như phiến đá hoặc thảm cỏ đặt trên nền.
- Đầu mỗi màn hình là cảnh rừng tràn hết chiều ngang: trời chuyển từ `bg-deep` sang `bg`, mây trôi, đồi sau màu `hill`, đồi trước màu `ground`. Phần còn lại của trang nằm trên nền đất cỏ `ground`, nối liền với ngọn đồi trước.
- Nội dung xếp thành một cột ở giữa, rộng tối đa 560px, ở mọi cỡ màn hình. Trên màn hình rộng, hai bên cột là cây trang trí đứng trên đồi.
- Đá cát (`sand-100`, `sand-300`, `sand-500`, chữ `sand-text`) là chất liệu ấm duy nhất: bong bóng thoại, bảng, khung thanh tiến độ, dải tên công việc, nút phụ. Dùng nó để làm nổi một thứ trên nền xanh, không phủ cả màn hình.
- Viền của nút, khung và huy hiệu cố ý hơi lệch (bốn góc bo khác nhau vài px quanh `radius-md` hoặc `radius-lg`) để trông như vật thật. Không làm lệch chip, tab và thanh tiến độ.
- Công việc trong project xếp thành lối mòn zíc zắc (`gg-works`), không xếp thành bảng. Project không có cây riêng; tiến độ của project hiện bằng lối mòn và thanh phần trăm.

## Chữ

- Tiêu đề dùng `display-xl`, `display-lg`, `title` (Baloo 2, tròn và đậm). Mỗi màn hình chỉ một `display`. Chữ trên nút, thẻ tên và huy hiệu số cũng dùng Baloo 2.
- Mọi thứ còn lại dùng Nunito: `heading` cho tên công việc, `body` cho việc cần làm, `caption` trong chip.
- Nhãn nhóm dùng `label`, viết hoa. Không viết hoa cả câu ở nơi khác.
- Số đếm (giọt nước, phần trăm, ngày) dùng `font-variant-numeric: tabular-nums`.

## Khối, viền và bóng

- Bo tròn theo vai trò: `radius-sm` cho ô tick, `radius-md` cho nút và dòng việc, `radius-lg` cho thẻ, `radius-pill` cho chip, tab và thanh tiến độ.
- Thứ bấm được có cạnh đáy cứng: `press-water`, `press-leaf`, `press-sun`, `press-sand`, `press-clay`. Khung chỉ để đọc có viền 3px `line` và cạnh đáy cùng màu.
- Viền thẻ dùng `line`; viền ô tick và ô nhập dùng `line-strong`.
- Focus: viền 3px `water-text`, cách 2px.
- Lề trang `space-4` trên điện thoại, khe giữa thẻ `space-6`, giữa các dòng việc `space-3`.

## Chuyển động

- Nhấn nút: lún 4px trong `dur-fast`, bóng đáy biến mất, thả ra thì nảy lại.
- Tick một việc: ô tick bật lên theo `ease-bounce` trong `dur-base`, chữ gạch ngang, 8 giọt nước bắn ra từ ô tick.
- Tưới cây: mưa rơi 0,5 giây, rồi cây lớn lên theo `ease-bounce` trong `dur-slow`, thanh cấp độ đầy theo.
- Ra trái: Giri nhảy, confetti 4 màu (`water-600`, `leaf-600`, `sun-400`, `blush`), tiêu đề `display-xl`.
- Chọn cảm xúc: nắp lọ bật mở, viên vừa chọn rơi vào, lăn và va vào các viên khác như bi thật rồi tự nằm yên; nắp đóng lại sau khoảng 1 giây.
- Lúc nghỉ, cổ Giri đung đưa, đuôi vẫy, tai thỉnh thoảng giật; cây đung đưa nhẹ. Không có chuyển động nào khác chạy liên tục.
- Khi máy bật giảm chuyển động, tắt hết hiệu ứng; trạng thái cuối vẫn hiển thị đủ.

## Linh vật, cây và lọ cảm xúc

- Giri là hươu cao cổ nhìn nghiêng, cổ dài quá khổ, mặt tỉnh bơ; dựng bằng khối CSS. Có năm trạng thái: `happy` (mặc định, mắt lim dim), `cheer` (vừa xong việc hoặc ra trái), `sleepy` (hôm nay chưa có việc), `sad` (có việc trễ), `munch` (đang tưới cây). Dựng bằng `Giri.mascot(mood, size)`.
- Giri luôn nói qua bong bóng thoại, không đứng một mình trên màn hình trống.
- Cây có sáu cấp: hạt, mầm, cây non, cây lớn, ra hoa, ra trái. Vẽ bằng `Giri.plant(stage, kind, size)`; có 19 loại cây Việt Nam trong `Giri.kinds`, chia ba nhóm trong `Giri.groups` (cây xanh, hoa, cây ăn trái), vẽ phẳng hai tông: nửa trái sáng, nửa phải đậm. Tên cấp luôn hiện cạnh thanh cấp độ.
- Cảm xúc có năm mức: Tồi tệ, Xấu, Tạm, Tốt, Tuyệt. Vẽ một viên bằng `Giri.orb(level, size)` và cả lọ của tháng bằng `Giri.jarLive(phần tử, levels, size)`. Mỗi ngày một viên.
- Mỗi tháng có một khu đất isometric (`Giri.plot`). Ngày nào xong hết việc của ngày đó thì được trồng một cây, và cây mọc lên ở ô của ngày ấy; còn việc chưa xong thì nút trồng cây bị khóa và ghi rõ còn mấy việc. Cây của mọi tháng xếp dọc lối mòn trong khu vườn lớn (`Giri.trail`).

## Biểu tượng

- Chưa có bộ biểu tượng riêng. Dùng nét SVG 2,5px đầu tròn, màu theo chữ. Giọt nước là hình CSS `gg-drop`.
