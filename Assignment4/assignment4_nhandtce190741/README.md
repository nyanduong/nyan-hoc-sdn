# Assignment 4 — Bug Report Management

- Project: `assignment4_nhandtce190741`
- Member code: `nhandtce190741`
- Frontend: React + Vite, React Router DOM, Axios, Bootstrap.
- Backend: dùng lại Assignment 3, URL mặc định `http://localhost:8002`. Không tạo backend mới hoặc sửa API.

## Cài đặt và chạy

Cần Node.js 22.12+ (khuyến nghị Node.js 24) và npm.

1. Mở terminal tại backend `Assignment3/assignment3_nhandtce190741`:

   ```powershell
   npm install
   npm start
   ```

   Backend dùng `.env` hiện có với `PORT=8002`, `MONGO_URI`, `JWT_SECRET`. MongoDB cần có các role `admin`, `moderator`, `user` theo Assignment 3.

2. Mở terminal khác tại frontend `assignment4_nhandtce190741`:

   ```powershell
   npm install
   npm run dev
   ```

3. Truy cập URL Vite in ra, mặc định `http://127.0.0.1:5173`.

Vite proxy chuyển `/api` đến backend và bỏ tiền tố `/api`. Ví dụ `/api/users/signin` gọi `http://localhost:8002/users/signin`. Cấu hình này hoạt động với cả `npm run dev` và `npm run preview`, không cần sửa CORS trong backend.

Nếu backend dùng địa chỉ khác, copy `.env.example` thành `.env`, sửa `BACKEND_URL`, rồi khởi động lại Vite. Giữ `VITE_API_BASE_URL=/api` khi dùng proxy. Không đưa thông tin bí mật của backend vào frontend.

## Các chức năng theo đề

| Trang             | Quyền truy cập | API                  |
| ----------------- | -------------- | -------------------- |
| `/signup`         | Chưa đăng nhập | `POST /users/signup` |
| `/signin`         | Chưa đăng nhập | `POST /users/signin` |
| `/reports`        | Đã đăng nhập   | `GET /reports`       |
| `/reports/create` | Admin          | `POST /reports`      |

- Đăng ký: username, email, password, role; kiểm tra dữ liệu cơ bản; thông báo thành công/lỗi.
- Đăng nhập: email, password; lưu JWT trong localStorage; chuyển trang sau đăng nhập.
- Đăng xuất: xóa token và trạng thái đăng nhập. Không thu hồi JWT trên server.
- Báo cáo: hiển thị Title, Project, Severity, Status, Assigned To từ dữ liệu backend trả về cho tài khoản hiện tại. Có loading, lỗi và trạng thái không có dữ liệu.
- Admin tạo báo cáo: title, description, severity (`low`, `medium`, `high`), project, assignedTo. Backend xác nhận người nhận tồn tại và có role `user`, tự đặt status `open`.
- Người không phải Admin bị chặn bằng trang 403 khi truy cập trang tạo báo cáo.
- Request được bảo vệ gửi `Authorization: Bearer <token>`. HTTP 401 xóa phiên và chuyển về đăng nhập.

`assignedTo` được nhập dưới dạng ID MongoDB gồm 24 ký tự hexadecimal. Người nhận có thể đăng nhập để xem **My user ID** phía trên trang. Không giả định có API lấy danh sách người dùng vì đề không cung cấp API này.

Admin tạo báo cáo giao cho User thì báo cáo xuất hiện ở tài khoản User, không xuất hiện ở danh sách của Admin. Đây là hành vi đúng của `GET /reports` trong Assignment 3.

Giao diện sử dụng các lớp Bootstrap cơ bản; không có CSS riêng, trang trí, thống kê, tìm kiếm hoặc lọc. Các lớp container, grid, table-responsive giúp trang co giãn theo kích thước màn hình, không có giao diện mobile riêng.

## Cấu trúc

```text
src/
  api/client.js             Axios, Bearer JWT và xử lý lỗi
  services/                 Hàm gọi API và đọc token
  context/AuthContext.jsx   Trạng thái đăng nhập
  routes/ProtectedRoute.jsx Bảo vệ route và quyền Admin
  components/               Thanh điều hướng, thông báo
  pages/                    Đăng ký/đăng nhập, báo cáo, tạo báo cáo, 403
  App.jsx                   Khai báo route
  main.jsx                  Entry React và import Bootstrap
  app.test.jsx              Kiểm thử
```

Frontend chỉ đọc JWT payload để điều hướng và hiển thị. Backend vẫn xác minh chữ ký JWT và quyền truy cập.

Khi tab khác thay đổi tài khoản, nội dung trang riêng tư được khởi tạo lại theo user ID, request cũ bị hủy và báo cáo được tải lại. Response cũ không được cập nhật lên trang; lỗi 401 của token cũ không xóa phiên mới.

## Kiểm tra

```powershell
npm test
npm run build
npm run preview
```

Bộ test dùng dữ liệu kiểm soát qua Axios adapter, bao gồm phân quyền, 401, loading/empty/error, body tạo báo cáo và hồi quy đổi tài khoản giữa tab. Chạy demo thật vẫn cần backend và MongoDB.

Nếu đưa bản build lên static hosting, cần cấu hình chuyển `/api` đến backend và fallback về `index.html` cho các route SPA. Không cần triển khai hosting để làm bài local.

## Demo và ảnh minh chứng

1. Đăng ký một tài khoản User và một tài khoản Admin. Có thể dùng email trùng để minh họa lỗi backend.
2. Đăng nhập User, ghi lại **My user ID**, sau đó đăng xuất.
3. Đăng nhập Admin, tạo báo cáo giao cho ID trên; kiểm tra thông báo thành công và status `open`.
4. Đăng nhập lại User, xem đủ năm cột báo cáo. Đăng nhập một User khác để minh họa báo cáo không được chia sẻ sang tài khoản khác.
5. User/Moderator truy cập trực tiếp `/reports/create` để xem 403.
6. Dùng DevTools giảm tốc mạng để xem loading; dừng backend và tải lại trang để xem lỗi; dùng tài khoản chưa được giao báo cáo để xem empty.
7. Đăng xuất, truy cập `/reports` để xác nhận được chuyển về đăng nhập.

Thư mục `screenshots/` chứa ảnh của giao diện Bootstrap hiện tại, chụp với backend Assignment 3. Tài khoản và báo cáo QA dùng để kiểm tra đã được xóa sau khi chụp. Tạo tài khoản của bạn để demo. Nếu giảng viên có mẫu screenshot riêng, chụp lại theo mẫu đó.

## Nộp bài

File nộp: **assignment4_nhandtce190741.zip**. Bao gồm source, README, `package.json`, `package-lock.json`, cấu hình và ảnh minh chứng. Không đưa `node_modules`, `dist` hoặc `.env` thật vào ZIP. Backend được dùng từ Assignment 3, không sao chép vào frontend.
