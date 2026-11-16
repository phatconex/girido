Giri, chú hươu cao cổ cổ dài quá khổ, dựng bằng các khối CSS và có năm trạng thái chuyển động.

- Gọi `Giri.mascot(mood, size)`; hàm trả về chuỗi HTML gồm các `span` lồng nhau. `size` là chiều rộng px (mặc định 120); Giri cao khoảng 1,36 lần chiều rộng.
- Năm trạng thái: `happy` (mắt lim dim, cổ đung đưa, đuôi vẫy), `cheer` (nhảy, cổ lắc như sợi mì, há miệng), `sleepy` (cổ gục dần, chữ z bay lên), `sad` (cổ rũ, tai cụp, rơi nước mắt), `munch` (nhai một chiếc lá).
- Chọn trạng thái theo dữ liệu thật: `cheer` trong 2 giây sau khi tick hoặc khi cây lên cấp, `munch` trong lúc tưới cây, `sad` khi có việc trễ, `sleepy` khi hôm nay chưa có việc nào, còn lại `happy`.
- Cổ là năm đốt lồng nhau; đổi độ uốn bằng ba biến CSS trên phần tử gốc: `--bend` (độ gục mỗi đốt), `--wave` (biên độ lắc), `--speed` (chu kỳ).
- Đầu Giri nghiêng về bên phải khi `sleepy` và `sad`, nên chừa trống bên phải ít nhất một phần ba chiều rộng.
- Không đổi màu, không lật ngược Giri. Giri luôn nhìn sang phải, về phía bong bóng thoại.
