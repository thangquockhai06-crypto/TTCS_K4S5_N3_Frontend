# NexusCRM — Hệ thống Quản trị Quan hệ Khách hàng & Doanh thu Doanh nghiệp (Phiên bản 2026)

> **Công nghệ sử dụng:** 
> - **Frontend:** React 19 · TypeScript (Strict Mode, `0% any`) · Vite 6 · React Router DOM v7 · Framer Motion · Lucide React · Axios Interceptor
> - **Backend:** Python 3.10+ · FastAPI · SQLAlchemy 2.0 · PyMySQL · PyJWT · Bcrypt · MySQL Workbench (`nexuscrm_db`)

---

## I. Hướng Dẫn Cài Đặt & Khởi Chạy Hệ Thống

### 1. Chuẩn bị Cơ sở dữ liệu MySQL (MySQL Workbench)
1. Mở **MySQL Workbench**, kết nối vào máy chủ cục bộ (Localhost cổng `3306`).
2. Mở file `server/init_db.sql` hoặc chạy lệnh:
   ```sql
   CREATE DATABASE IF NOT EXISTS nexuscrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Mở file `server/.env`, chỉnh sửa mật khẩu root MySQL của máy bạn:
   ```env
   DATABASE_URL="mysql+pymysql://root:MAT_KHAU_CUA_BAN@localhost:3306/nexuscrm_db?charset=utf8mb4"
   ```

### 2. Cài đặt và Chạy Backend (Python FastAPI)
Mở Terminal tại thư mục `server/` (hoặc nhấp đúp file `server/start-server.bat` trên Windows):
```bash
cd server

# Cài đặt thư viện Python
pip install -r requirements.txt

# Nạp tài khoản Admin & dữ liệu mẫu vào CSDL
python seed.py

# Khởi chạy Backend Server (http://localhost:8000)
python run.py
```
> **Tài liệu Swagger API tự động:** Truy cập `http://localhost:8000/docs` để kiểm thử toàn bộ API.

### 3. Cài đặt và Chạy Frontend (React Vite)
Mở một cửa sổ Terminal khác tại thư mục gốc của dự án:
```bash
# Cài đặt thư viện
npm install

# Khởi chạy Frontend (http://localhost:5173)
npm run dev
```
*(Trên Windows, bạn có thể nhấp đúp vào `start-all.bat` để chạy đồng thời cả Backend và Frontend).*

### 4. Tài khoản Quản trị viên (Admin) & Đăng nhập Đa phương thức
- **Tên hiển thị:** `Quản Trị Viên Hệ Thống`
- **Email:** `admin@nexuscrm.vn`
- **Mật khẩu:** `Admin@2026`
- **Đăng ký tài khoản mới:** Tạo tài khoản trực tiếp tại trang **Đăng ký (`/register`)**.
- **Đăng nhập / Đăng ký bằng Mạng xã hội & Số điện thoại (OAuth 2.0 / OIDC):**
  - Hỗ trợ 4 phương thức: **Google cá nhân**, **Apple ID**, **LinkedIn**, và **Số điện thoại (SMS OTP)**.
  - Thiết kế chuẩn **Google Identity Services (GSI) Account Chooser** (`#g_id_onload`, giải mã JWT ID Token chuẩn OpenID Connect).
  - Người dùng có thể chọn mục **"Sử dụng một tài khoản ... khác"** để tự thêm/liên kết tài khoản thực tế của mình vào dữ liệu hệ thống (`localStorage`) và đăng nhập nhanh cho các lần tiếp theo (mã OTP thử nghiệm cho Số điện thoại: `123456`).

---

## II. Tiến Độ Triển Khai & Phân Chia Công Việc

| Mã Jira | Hạng mục / Task | Mô tả chi tiết & Tiêu chí nghiệm thu | File triển khai chính | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **SCRUM-32**<br>`SCRUM-100 FE`<br>`SCRUM-101 BE` | **Đăng nhập hệ thống & Khóa 15 phút** | - Đăng nhập đúng vào trang chủ tương ứng với vai trò.<br>- Sai thông tin hiển thị thông báo chung (Anti-Enumeration).<br>- Khóa tạm 15 phút sau 5 lần sai liên tiếp (`lockout_until`). | **BE:** `server/app/routers/auth.py`, `auth_service.py`<br>**FE:** `src/components/auth/LoginForm.tsx`, `useCountdown.ts` | Đã hoàn thành |
| **SCRUM-34**<br>`SCRUM-102 FE`<br>`SCRUM-103 BE` | **Duy trì phiên & Đăng xuất an toàn** | - Phiên gia hạn tự động qua Refresh Token khi còn hoạt động.<br>- Đăng xuất vô hiệu hóa phiên ngay lập tức phía server (`refresh_tokens.is_revoked`).<br>- Phiên hết hạn điều hướng về đăng nhập kèm thông báo. | **BE:** `server/app/routers/auth.py`, `models/token.py`<br>**FE:** `src/utils/axiosInstance.ts`, `AuthContext.tsx` | Đã hoàn thành |
| **SCRUM-72 / FE** | **Đổi mật khẩu tài khoản** | - Form đổi mật khẩu bảo mật trong trang Cài đặt.<br>- Kiểm tra mật khẩu cũ, độ mạnh mật khẩu mới, cập nhật hash. | `src/features/change-password/*`, `src/pages/SettingsPage.tsx` | Đã hoàn thành |
| **SCRUM-76 / FE** | **Quản lý người dùng & Phân quyền** | - Danh sách người dùng, kích hoạt/vô hiệu hóa tài khoản, bàn giao việc, phân quyền RBAC. | `src/pages/UserManagementPage.tsx`, `src/components/users/*` | Đã hoàn thành |
| **UI-CORE** | **Hệ thống giao diện CRM 100% Tiếng Việt** | Dashboard KPI, 50 Khách hàng 360°, Kanban Deal Pipeline, Nhật ký hoạt động, Cài đặt, Báo cáo | `src/pages/*`, `src/components/*` | Đã hoàn thành |

---

## III. Cấu Trúc Thư Mục Dự Án

```text
TTCS_K4S5_N3/
├── server/                          # [BACKEND PYTHON - FastAPI + MySQL]
│   ├── app/                         # Routers, Services, Repositories, Models, Schemas
│   ├── init_db.sql                  # Cấu trúc CSDL MySQL
│   ├── requirements.txt             # Thư viện Python Backend
│   ├── run.py                       # Điểm khởi chạy FastAPI Server
│   └── seed.py                      # Dữ liệu mẫu khởi tạo
├── Subtask Backend/                 # [CÁC MODULE SUBTASK PYTHON - SCRUM 71, 72, 74, 75]
├── src/                             # [FRONTEND REACT 19 + VITE]
│   ├── components/                  # auth, users, customer, dashboard, layout, audit
│   ├── features/                    # change-password...
│   ├── context/                     # AuthContext, CRMDataContext
│   ├── pages/                       # Toàn bộ màn hình CRM & Quản trị
│   └── routes/                      # Định tuyến AppRoutes
├── start-all.bat                    # Script khởi chạy đồng thời cả Backend và Frontend
└── package.json
```
