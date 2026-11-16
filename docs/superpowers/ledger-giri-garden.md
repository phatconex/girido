# Ledger — plan: docs/superpowers/plans/2026-11-14-giri-garden-app.md

Ruling: thư mục không phải kho git nên bỏ các script workspace/commit của quy trình; sổ này ghi tay — mất lịch sử từng bước nếu sai.
Ruling: gộp Task 2–4 (logic) thành một lượt viết sau khi cả ba file kiểm thử đã đỏ — khó biết bước nào làm hỏng nếu có lỗi; cả 13 bài đã xanh ngay lượt đầu.
Ruling: thêm GG.shiftMonth, GG.isDate, GG.isMonthKey ngoài danh sách của plan — cần cho nút lùi/tiến tháng; có kiểm thử cho shiftMonth.
Ruling: bố cục máy tính là chính (thanh điều hướng dọc, hai cột, lưới thẻ) theo lời người dùng nhắn giữa chừng "ứng dụng chạy chủ yếu trên web" — plan chỉ ghi max 960px.
Ruling: Giri và cây của ngày đứng cạnh nhau dưới bong bóng thoại (plan vẽ bong bóng bên phải Giri) — vừa chiều rộng điện thoại hơn.
Ruling: nếu lần tải đầu từ kho lỗi, thay đổi làm trước khi thử lại thành công bị bỏ — tránh ghi đè kho bằng dữ liệu rỗng; người dùng mất vài thao tác trong tình huống hiếm.
Ruling: xóa một việc không hỏi lại (chỉ có toast) — spec chỉ yêu cầu xác nhận cho project và công việc.
Task 1–11: complete (tests: node --test app/test/*.test.mjs → 26/26)
Final: fixed bản chụp một nửa kéo nửa kia về bản cũ (store.js) — 3 bài kiểm thử RED→GREEN, suite 26/26
Final: fixed replaceAll không báo kết quả lưu — 'replaceAll báo kết quả lưu' RED→GREEN
Final: fixed dải trạng thái không ẩn, mất chữ đang gõ khi tick, trồng nhầm ngày sau nửa đêm, Enter khi đang gõ dấu, hash hỏng, không lưu khi rời trang, hộp thoại thiếu Escape và nút đóng, lọ cảm xúc không vẽ lại khi cùng số viên — kiểm bằng tay trong trình duyệt (không có DOM trong Node)
Final: minor (deferred): ô đất và cây trong khu đất tháng chưa bấm được bằng bàn phím
Final: minor (deferred): bảng chọn cây mất tiêu điểm sau mỗi lần chọn
Final: minor (deferred): đăng ký nhận thay đổi từ kho bị ngắt thì không báo
Final: minor (deferred): chưa chặn trước trường hợp một tháng vượt 256 KiB
Ruling (15/11): theo phản hồi của người dùng, bỏ bố cục hai cột và thanh điều hướng dọc; mọi màn hình là một cột 560px ở giữa trên nền đất cỏ, cảnh rừng tràn ngang ở đầu trang, thanh điều hướng dưới có thêm mục Cài đặt — thay cho quyết định "bố cục máy tính hai cột" trước đó.
Ruling (15/11, lần 2): người dùng duyệt bản phác 2D và yêu cầu đưa vào app — thay bố cục một cột bằng: cảnh hồ động phủ nền, thanh trạng thái của cây hôm nay (có nút trồng và đổi cây), Giri và cây đứng trong cảnh, một bảng có thẻ chọn màn hình. Nút trồng cây và chọn loại cây chuyển từ màn hình Hôm nay sang thanh trạng thái. Màn hình "một công việc" bỏ, thay bằng mindmap của project (tick và sửa ngay trên lá). App chỉ còn chế độ sáng.
Ruling (15/11, lần 3): theo phản hồi của người dùng, hôm nay đã trồng mà còn việc chưa xong thì bỏ trạng thái đã trồng (GG.settleToday); ngày đã qua và ngày không còn việc nào thì giữ cây — kiểm thử 'đã trồng hôm nay mà còn việc chưa xong…' RED→GREEN, suite 28/28.
