# Giri Garden: bản thiết kế app

Ngày viết: 14/11/2026. Trạng thái: chờ duyệt.

## 1. Mục đích

Một web todolist cho một người dùng duy nhất (chủ app), chạy dưới dạng artifact trên claude.ai. Người dùng chia việc theo project, trong project có các công việc, trong công việc có việc cần làm gắn với từng ngày.

Động lực để quay lại mỗi ngày: xong hết việc trong ngày thì được trồng một cái cây vào khu đất của tháng. Cuối tháng khu đất thành một mảnh rừng nhỏ. Chú hươu cao cổ Giri đi cùng và phản ứng theo tình hình.

Cảm giác cần có: một khu rừng mát, màu pastel xanh dương và xanh lá, dễ thương, mọi tương tác đều có chuyển động kiểu Duolingo.

## 2. Mục tiêu, ngoài phạm vi, điều phải tránh

Mục tiêu:
- Thêm, tick, sửa, xóa việc nhanh, không quá hai lần chạm cho thao tác thường gặp.
- Mỗi lần tick đều có phản hồi nhìn thấy được: giọt nước bắn ra, cây của hôm nay được tưới.
- Dữ liệu tự lưu và không mất khi đổi máy; xuất được ra file JSON và nhập lại được.
- Dùng tốt trên điện thoại (rộng khoảng 400px) và máy tính, ở cả chế độ sáng và tối.

Ngoài phạm vi (bản đầu):
- Việc lặp lại hằng ngày, nhắc nhở bằng thông báo, giờ hẹn cho việc.
- Nhiều người dùng, chia sẻ project, bạn bè.
- Cây riêng cho project (đã quyết định bỏ).
- Âm thanh.

Điều phải tránh:
- Mất dữ liệu, hoặc nhập JSON ghi đè mà không hỏi lại.
- Hiệu ứng làm chậm thao tác: không hiệu ứng nào chặn người dùng tick việc tiếp theo.
- Giao diện trống trơn khi chưa có dữ liệu.

## 3. Ràng buộc

- App chỉ có một người dùng là chủ artifact, và artifact luôn để riêng tư. Không xử lý trường hợp người khác mở trang; khai báo kho sao cho chỉ chủ artifact ghi được.
- Một trang artifact duy nhất, một file HTML. Không tải thư viện ngoài; chỉ tải phông Baloo 2 và Nunito từ Google Fonts.
- Giao diện lấy từ design system Giri Garden (https://claude.ai/artifact/1Sr4oRHY8xDqzfhZMg4uEU). Mã nguồn nằm ở `giri-design-system/project/`: `tokens.json` (màu, chữ, khoảng cách), `components/bundle.css` (kiểu dáng), `components/bundle.js` (vẽ Giri, cây, lọ, khu đất, lối mòn, hiệu ứng). App nhúng thẳng nội dung `bundle.css` và `bundle.js` vào trang, không viết lại các component đã có. `bundle.css` chỉ dùng biến `var(--tên-token)` chứ không khai báo chúng: app tự sinh khối biến cho chế độ sáng và tối từ `tokens.json`, và tự làm phần chọn sáng, tối, theo máy.
- Những thứ design system chưa có (thanh điều hướng dưới, hộp xác nhận trong trang, danh sách xổ xuống gom nhóm, thông báo lỗi, đầu trang có nút quay lại) thì viết kiểu dáng riêng trong app, dựng từ token và theo quy tắc trong `README.md`. Được sửa nhỏ trong bundle khi một component thiếu thứ app cần, ví dụ gắn mã tháng vào tấm biển của `Giri.trail` để chạm được; sửa xong phải xuất bản lại design system.
- Mỗi component có hướng dẫn dùng ở `components/<Tên>/README.md` và ví dụ chạy được ở `components/<Tên>/preview.html`.
- Toàn bộ chữ trên giao diện là tiếng Việt, theo giọng trong `README.md` của design system. Không dùng emoji.
- Artifact không tự ghi được file xuống máy; tải file phải qua khả năng `downloads` và người dùng xác nhận mỗi lần.
- Hộp thoại `alert`, `confirm`, `prompt` không hoạt động trong artifact; mọi bước xác nhận phải vẽ ngay trong trang.
- Tôn trọng cài đặt giảm chuyển động của máy.

## 4. Các cách lưu dữ liệu đã cân nhắc

1. **Tự lưu vào kho của artifact (`db`) và có nút xuất, nhập JSON.** Dữ liệu còn nguyên khi đổi máy; file JSON là bản sao lưu người dùng tự tải. Bản chính nằm trên máy chủ.
2. Chỉ lưu trong trình duyệt, kèm xuất và nhập JSON. Không gì rời máy, nhưng xóa dữ liệu trình duyệt hay đổi máy là mất.
3. File HTML chạy trên máy, ghi thẳng vào một file JSON. Đúng nghĩa file trên máy, nhưng không còn là artifact và chỉ chạy trên Chrome hoặc Edge máy tính.

Người dùng chọn cách 1.

## 5. Luật của app

Những điều người dùng đã quyết định:
- Cấu trúc ba tầng: project, công việc, việc cần làm gắn với một ngày.
- Mỗi ngày tối đa một cây. Chỉ được trồng khi mọi việc của ngày đó đã tick xong.
- Cây trồng vào khu đất của tháng; mỗi tháng một khu đất; có khu vườn lớn xem lại mọi tháng.
- Có 19 loại cây chia ba nhóm để chọn.
- Có lọ cảm xúc: mỗi ngày một viên, năm mức.
- Project không có cây riêng.
- Tự lưu vào kho của artifact, có xuất và nhập JSON.

Những điều người viết bản này tự quyết, người dùng có thể sửa:
- Việc là việc làm một lần. Một việc thuộc đúng một công việc và đúng một ngày.
- Tick một việc là tưới cây luôn, không cần bấm thêm nút tưới: mưa rơi lên cây của hôm nay, và cây lên cấp khi phần trăm việc xong vượt ngưỡng. Lý do: bớt một lần chạm cho thao tác thường gặp nhất.
- Cấp của cây hôm nay theo phần trăm việc đã xong trong ngày: 0% hạt, từ 1% mầm, từ 25% cây non, từ 50% cây lớn, từ 75% ra hoa, 100% ra trái.
- Trồng cây là hành động bấm nút, không tự động, để người dùng có khoảnh khắc ăn mừng.
- Hôm nay đã trồng mà sau đó còn việc chưa xong (thêm việc mới, bỏ tick, mang việc trễ sang) thì cây quay về đang lớn và phải xong hết rồi trồng lại. Cây của ngày đã qua thì ở lại, dù sau đó có sửa việc của ngày ấy. (Người dùng yêu cầu ngày 15/11, thay cho luật cũ "đã trồng thì cây ở lại".)
- Ngày đã qua mà chưa trồng thì ô đất để trống, không trồng bù.
- Ngày không có việc nào thì không trồng được.
- Việc chưa xong của các ngày trước hiện trong một dải "Việc trễ" ở màn hình hôm nay, có nút mang từng việc hoặc tất cả sang hôm nay. Mang sang là đổi ngày của việc đó.
- Loại cây của hôm nay chọn trong bảng chọn cây; chưa chọn thì dùng loại của lần trồng gần nhất, lần đầu tiên là cây tán tròn. Đổi loại được cho đến khi trồng.
- Chuỗi ngày là số ngày liên tiếp đã trồng cây, tính đến hôm nay, hoặc đến hôm qua nếu hôm nay chưa trồng.
- Cảm xúc ghi độc lập với việc trồng cây; chọn lại trong ngày thì thay viên của hôm nay.
- Ngày tính theo giờ của máy đang dùng.
- Khi chọn một ngày khác hôm nay trên dải 7 ngày, cả màn hình theo ngày đó: cây và thanh cấp độ hiện cây và phần trăm của ngày được chọn. Tick việc của ngày nào cũng được và vẫn có giọt nước bắn ra. Nút trồng cây chỉ bấm được với hôm nay: ngày đã qua thì thay bằng dòng "Đã trồng" hoặc "Ngày này đã qua", ngày chưa tới thì ghi "Chưa tới ngày". Nút "đổi" loại cây cũng chỉ có với hôm nay.
- Việc trong dải "Việc trễ" tick trực tiếp được mà không cần mang sang; khi đó nó tính là xong ở ngày cũ của nó và không tạo ra cây.
- App dùng trên một máy tại một thời điểm là chính. Nếu mở ở hai nơi, trang đang mở tự cập nhật theo thay đổi từ kho, và thay đổi ghi sau thắng. Không cần gộp dữ liệu phức tạp hơn.
- Khi ghi vào kho thất bại, app vẫn chạy tiếp với dữ liệu trong bộ nhớ, hiện dải báo "Chưa lưu được" kèm nút thử lại, và nút xuất JSON vẫn dùng được.
- Xóa project hoặc công việc thì xóa luôn các việc bên trong, sau một bước xác nhận vẽ trong trang. Cây đã trồng không bị ảnh hưởng.

## 6. Các màn hình

Thanh điều hướng dưới cùng có bốn mục: Hôm nay, Project, Khu vườn, Cảm xúc. Nút bánh răng ở góc trên mở Cài đặt. Mỗi màn hình có một địa chỉ dạng `#ten` để mở lại đúng chỗ.

### 6.1 Hôm nay (`#hom-nay`), màn hình mở đầu

```
┌──────────────────────────────┐
│  mây      Thứ Bảy, 14/11  ⚙  │  cảnh rừng (ForestScene)
│  Giri ┌ Giri ─────────────┐  │
│   ||  │ Còn 2 việc nữa là │  │  bong bóng thoại
│   ||  │ trồng được cây!   │  │
│  [cây của hôm nay]  ~đồi~    │  cây lớn theo việc đã xong
├──────────────────────────────┤
│ T2 T3 T4 T5 T6 [T7] CN       │  dải 7 ngày (DayStrip)
│ Hoa sen · cấp 3 · 60% [đổi]  │  thanh cấp độ (ProgressBar)
│ ┌ Việc trễ (2) ─ mang sang ┐ │  chỉ hiện khi có việc trễ
│ VIỆC HÔM NAY                 │
│ ☐ Nghe Cam 18 Test 1  IELTS  │  dòng việc (TodoItem)
│ ☑ Học 20 từ mới       IELTS  │
│ [ Hôm nay bạn muốn làm gì? +]│  ô thêm việc (Input)
│ [   Trồng vào khu đất      ] │  khóa cho đến khi xong hết
├──────────────────────────────┤
│ Hôm nay Project Vườn Cảm xúc │
└──────────────────────────────┘
```

- Chọn một ngày khác trên dải 7 ngày thì danh sách đổi sang việc của ngày đó; thêm việc sẽ thêm vào ngày đang chọn. Có nút lùi và tiến tuần.
- Thêm việc: gõ nội dung, chọn công việc (danh sách xổ xuống gom theo project, nhớ lựa chọn gần nhất), bấm nút cộng hoặc Enter. Chưa có project nào thì ô thêm việc dẫn sang tạo project.
- Tick: ô tick bật lên, giọt nước bắn ra, mưa rơi lên cây, cây lên cấp nếu qua ngưỡng, Giri ăn mừng 2 giây.
- Chạm vào chữ của một việc để sửa nội dung, đổi ngày hoặc xóa.
- Nút "Trồng vào khu đất": khi còn việc thì khóa và ghi "Còn 2 việc nữa"; khi xong hết thì bật. Bấm thì chuyển sang màn hình Khu vườn, cây nảy lên ở ô của hôm nay kèm confetti. Sau khi trồng, nút ghi "Đã trồng hôm nay".
- Trạng thái của Giri: có việc trễ thì buồn; hôm nay chưa có việc thì ngủ gật; vừa tick hoặc vừa trồng thì ăn mừng; đang tưới thì nhai lá; còn lại thì lim dim.

### 6.2 Project (`#project`)

- Danh sách project dạng khung (Card), mỗi khung có tên, thanh phần trăm việc đã xong, số việc còn lại. Nút "Thêm project".
- Mở một project: lối mòn công việc (WorkRow), mỗi chặng ghi số thứ tự, tên, "4 / 9 việc" và thẻ "Xong" hoặc "Đang làm". Nút "Thêm công việc". Đổi tên, xóa project ở đây.
- Mở một công việc: các việc của nó gom theo ngày, ngày gần nhất trước; thêm việc cho một ngày bất kỳ; đổi tên, xóa công việc.
- Một công việc là "Xong" khi có ít nhất một việc và mọi việc đã tick; "Đang làm" khi có việc đã tick nhưng chưa hết.

### 6.3 Khu vườn (`#khu-vuon`)

- Trên cùng: tên tháng với hai nút lùi và tiến tháng. Giữa: khu đất tháng (GardenPlot). Dưới: "13 / 30 cây trong tháng" và chuỗi ngày.
- Chạm một cây hoặc một ô đất thì về màn hình Hôm nay với ngày đó được chọn.
- Nút "Khu vườn lớn" mở lối mòn mọi tháng (GardenTrail), tháng mới nhất ở trên. Chạm tấm biển tháng thì mở khu đất tháng đó.

### 6.4 Cảm xúc (`#cam-xuc`)

- Lọ cảm xúc của tháng (MoodJar) có nút lùi và tiến tháng. Dưới lọ là năm mức để chọn cho hôm nay. Chỉ ghi được cho hôm nay.

### 6.5 Bảng chọn cây

- Mở từ nút "đổi" cạnh tên cây ở màn hình Hôm nay. Ba tab nhóm cây, các ô khung (SeedPicker), nút xác nhận ghi "Trồng hoa sen". Bị khóa sau khi hôm nay đã trồng.

### 6.6 Cài đặt (`#cai-dat`)

- "Xuất JSON": tải file `giri-garden-2026-11-14.json`.
- "Nhập JSON": chọn file, app kiểm tra file, hiện tóm tắt (bao nhiêu project, việc, cây) và hỏi "Thay toàn bộ dữ liệu hiện tại?" trước khi ghi. File sai định dạng thì báo lỗi nói rõ sai ở đâu và không đổi gì.
- Chọn chế độ sáng, tối hoặc theo máy.

### 6.7 Lần đầu mở app

- Chưa có dữ liệu: màn hình Hôm nay hiện Giri chào, khu đất trống, và một nút "Tạo project đầu tiên". Không tự tạo dữ liệu mẫu trong kho.

## 7. Dữ liệu

File JSON xuất ra có dạng cố định như sau. Đây cũng là dạng mà chức năng nhập chấp nhận.

```json
{
  "app": "giri-garden",
  "version": 1,
  "exportedAt": "2026-11-14T08:30:00+07:00",
  "projects": [
    { "id": "p1", "name": "Học IELTS", "createdAt": "2026-11-01",
      "works": [ { "id": "w1", "name": "Luyện Listening", "order": 1 } ] }
  ],
  "todos": [
    { "id": "t1", "workId": "w1", "text": "Nghe Cam 18 Test 1",
      "date": "2026-11-14", "done": true, "doneAt": "2026-11-14T08:12:00+07:00" }
  ],
  "days": {
    "2026-11-14": { "kind": "sen", "planted": true, "mood": 4 }
  }
}
```

- `days[ngày].kind` là khóa loại cây trong `Giri.kinds`; `planted` là đã trồng hay chưa; `mood` từ 1 đến 5 hoặc không có.
- Cách chia dữ liệu thành các tài liệu trong kho `db` do người dựng quyết định, miễn là xuất ra đúng dạng trên, một năm dùng (vài nghìn việc) vẫn tải nhanh, và mỗi lần tick chỉ ghi phần nhỏ thay đổi.
- Khi kho không dùng được (trang mở ngoài claude.ai), app xử lý như khi ghi thất bại: vẫn chạy, báo rõ "Chưa lưu được".

## 8. Phần để người dựng quyết định

- Cách tổ chức mã trong file HTML và cách chia tài liệu trong kho.
- Bố cục trên màn hình rộng (máy tính): có thể đặt cây của hôm nay và danh sách việc cạnh nhau.
- Câu thoại cụ thể của Giri cho từng tình huống, theo giọng trong design system.
- Chi tiết hình thức của các bước xác nhận và thông báo lỗi.

## 9. Kiểm tra

- Các phép tính thuần (cấp của cây theo phần trăm, chuỗi ngày, việc trễ, kiểm tra file nhập, xuất rồi nhập lại ra đúng dữ liệu cũ) viết thành hàm riêng và có kiểm thử chạy bằng Node.
- Mở trang thật ở chiều rộng điện thoại và máy tính, chế độ sáng và tối; đi hết luồng: tạo project, thêm việc, tick hết, trồng cây, xem khu vườn, ghi cảm xúc, xuất rồi nhập JSON.
