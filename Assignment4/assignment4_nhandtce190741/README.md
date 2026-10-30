# Assignment 4 - Bug Report Management

Project: `assignment4_nhandtce190741`

Member code: `nhandtce190741`

## Yêu cầu

- Node.js 22.12+ và npm.
- Backend Assignment 3 cùng MongoDB đã được cấu hình và chạy.
- Backend URL: `http://localhost:8002`.

## Cài đặt và chạy frontend

Giải nén ZIP, mở terminal trong thư mục `assignment4_nhandtce190741`, chạy:

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173` hoặc URL được Vite in trong terminal.

Chạy backend Assignment 3 bằng `npm start` trong một terminal khác. Giữ cả hai terminal hoạt động.

## Cấu hình

File `.env` frontend đã có:

```env
VITE_API_BASE_URL=/api
BACKEND_URL=http://localhost:8002
```

Vite proxy chuyển request `/api` đến backend Assignment 3. Nếu đổi cổng backend, sửa `BACKEND_URL` và khởi động lại frontend.
