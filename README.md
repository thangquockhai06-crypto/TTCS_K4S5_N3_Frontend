# NexusCRM Enterprise - Frontend Web Application

Giao diện Web tương tác cao cấp dành cho hệ thống **NexusCRM SaaS** phục vụ quản trị quan hệ khách hàng, phân quyền vai trò doanh nghiệp, phân tích phễu chuyển đổi doanh số và quản lý người dùng.

---

## 🛠 Công nghệ sử dụng
- **Framework UI**: React 19 + TypeScript 5.8
- **Bundler & Dev Server**: Vite 6 (Lightning fast HMR & Rollup build)
- **Styling**: CSS Modules hiện đại, Glassmorphism, CSS Custom Properties / Design Tokens chuẩn UX B2B
- **Biểu tượng (Icons)**: Lucide React
- **Chuyển động (Animations)**: Framer Motion
- **Quản lý biểu mẫu & Xác thực**: Axios, Custom Hooks (`useAuth`, `useAuthorization`, `useCountdown`)
- **Tương thích hoàn toàn**: FastAPI Backend tại `http://127.0.0.1:8000`

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Cài đặt các gói thư viện
```bash
npm install
```

### 2. Cấu hình biến môi trường (Tùy chọn)
Mặc định hệ thống kết nối trực tiếp với backend tại `http://localhost:8000/api/v1`. Bạn có thể tạo file `.env` nếu cần tùy biến:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Khởi động môi trường Phát triển (Development)
```bash
npm run dev
```
Ứng dụng sẽ khả dụng tại: **`http://localhost:5173`**

### 4. Đóng gói cho Môi trường Sản xuất (Production Build)
```bash
npm run build
```
Thư mục sản phẩm sau khi build nằm tại `dist/`. Bạn có thể kiểm tra bản build bằng:
```bash
npm run preview
```

---

## 📋 Các phân hệ & Màn hình chính
1. **Xác thực Doanh nghiệp (Sprint 1)**:
   - Đăng nhập bảo mật JWT Bearer + Refresh Token
   - Quên mật khẩu & Đặt lại mật khẩu an toàn
   - Đổi mật khẩu trong phiên làm việc
   - Trang thông báo lỗi chuẩn UX (403 Forbidden, 404 Not Found, 500 Server Error)
2. **Quản trị Người dùng & Phân quyền (Sprint 1 & 2)**:
   - Danh sách người dùng trực tiếp từ Backend API (`GET /api/v1/users`)
   - Thêm mới, cập nhật thông tin và cấp quyền địa bàn
   - Gán vai trò & nhóm (Ràng buộc Trưởng nhóm, bảo vệ Quản trị viên)
   - Vô hiệu hóa tài khoản & bàn giao dữ liệu khách hàng/cơ hội
3. **Phân hệ Mở rộng (Sprint 2)**:
   - Sơ đồ tổ chức phân cấp (Org Tree)
   - Quản lý danh mục & Sản phẩm, phân quyền giá vốn
   - Cấu hình trường động (Custom Fields)
   - Cấu hình giai đoạn phễu bán hàng (Pipeline Stages)
   - Phân tích nguyên nhân Thắng/Thua (Win/Loss Reasons)
   - Nhật ký kiểm toán bảo mật (Audit Logs) kèm xem chi tiết thay đổi (Diff Viewer)
