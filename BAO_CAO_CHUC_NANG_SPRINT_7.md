# BÁO CÁO NGHIỆM THU TÍNH NĂNG CHI TIẾT SPRINT 7
## HỆ THỐNG QUẢN LÝ QUAN HỆ KHÁCH HÀNG & DOANH THU B2B (NEXUS CRM)
**Phạm vi:** User Stories S7-01 đến S7-09  
**Phiên bản nghiệm thu:** v2.7.0 (Sprint 7 Release)  
**Tài liệu Word đính kèm:** [`BAO_CAO_CHUC_NANG_SPRINT_7_S7_01_DEN_S7_09.docx`](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/BAO_CAO_CHUC_NANG_SPRINT_7_S7_01_DEN_S7_09.docx) (5.26 MB, nhúng đầy đủ 15 ảnh chụp thực tế chất lượng cao)

---

## I. BẢNG TỔNG HỢP MA TRẬN TÍNH NĂNG SPRINT 7 (S7-01 ĐẾN S7-09)

| Mã Story | Tên chức năng / User Story | Phân hệ (Module) | Phạm vi dữ liệu (Scope) | Trạng thái nghiệm thu |
| :--- | :--- | :--- | :--- | :---: |
| **S7-01** | Soạn thảo Báo giá Đa sản phẩm (Quote Builder) | Báo giá (Quotes & Deals) | Kế thừa Cơ hội / Khách hàng | **ĐÃ ĐẠT (100%)** |
| **S7-02** | Cơ chế Đa chiết khấu & Hàng đợi Phê duyệt phân cấp | Báo giá & Phê duyệt | Hàng đợi Chờ duyệt / Lịch sử | **ĐÃ ĐẠT (100%)** |
| **S7-03** | So sánh trực quan giữa các phiên bản Báo giá (Visual Diff) | Báo giá & Quản lý phiên bản | Lịch sử phiên bản v1, v2... | **ĐÃ ĐẠT (100%)** |
| **S7-04** | Chuyển đổi Báo giá sang Hợp đồng & Đóng thắng Deal | Báo giá -> Hợp đồng -> Deals | Kế thừa tự động dòng hàng | **ĐÃ ĐẠT (100%)** |
| **S7-05** | Xuất file PDF & Mẫu in Báo giá chuẩn Doanh nghiệp | Báo giá & Mẫu in tài liệu | Pháp nhân & Điều khoản | **ĐÃ ĐẠT (100%)** |
| **S7-06** | Cổng thông tin Khách hàng xem & ký duyệt trực tuyến | Cổng khách hàng (Public Portal) | Liên kết an toàn có mã token | **ĐÃ ĐẠT (100%)** |
| **S7-07** | Quản lý Hợp đồng & Cảnh báo Tái ký 1-click | Hợp đồng (Contracts & Renewal) | Đếm ngược hạn & Tạo Deal tái ký | **ĐÃ ĐẠT (100%)** |
| **S7-08** | Trung tâm Thông báo Hệ thống & Cảnh báo Tự động | Hạ tầng Thông báo (TopBar) | Thông báo đa kênh thời gian thực | **ĐÃ ĐẠT (100%)** |
| **S7-09** | Động cơ Tự động hóa Quy trình IF–THEN (Rules Engine) | Tự động hóa (Automation) | Trigger -> Condition -> Action | **ĐÃ ĐẠT (100%)** |

---

## II. BÁO CÁO CHI TIẾT TỪNG TÍNH NĂNG & HÌNH ẢNH MINH HỌA

### 1. USER STORY S7-01: TRÌNH SOẠN THẢO BÁO GIÁ ĐA SẢN PHẨM (QUOTE BUILDER)
- **Tuyến đường (Route):** `/quotes/builder` hoặc `/deals/:id/quote-builder`
- **Mục tiêu & Nghiệp vụ:** Soạn thảo báo giá chuyên nghiệp từ Cơ hội bán hàng, tự động kế thừa thông tin Khách hàng, Công ty, Mã số thuế và danh sách sản phẩm quan tâm.
- **Quy cách tính năng:**
  + Thêm sản phẩm từ Danh mục sản phẩm (Catalog) hoặc thêm dòng tùy chỉnh.
  + Điều chỉnh Số lượng, Đơn vị tính, Đơn giá niêm yết, Chiết khấu dòng (% hoặc số tiền cố định), Thuế suất VAT (0%, 8%, 10%).
  + Cảnh báo giá sàn (Floor Price Guard) khi đơn giá thấp hơn giá vốn quy định.
  + Thiết lập thời hạn hiệu lực báo giá, điều khoản thanh toán nhiều đợt và điều khoản giao hàng.
- **Hình ảnh minh họa:**
  + [s7_01_quote_builder_overview.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_01_quote_builder_overview.png): Tổng quan giao diện soạn thảo báo giá.
  + [s7_01_quote_items_list.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_01_quote_items_list.png): Bảng chi tiết các dòng sản phẩm và tính toán tự động.

---

### 2. USER STORY S7-02: CƠ CHẾ ĐA CHIẾT KHẤU & QUY TRÌNH PHÊ DUYỆT PHÂN CẤP
- **Tuyến đường (Route):** `/quotes/approvals`
- **Mục tiêu & Nghiệp vụ:** Kiểm soát chính sách giá bán và biên lợi nhuận, ngăn chặn rủi ro thất thoát doanh thu khi nhân viên giảm giá sâu.
- **Quy tắc phân cấp phê duyệt tự động:**
  + Chiết khấu $\le 10\%$: Tự động phê duyệt (Auto-approved).
  + Chiết khấu $10.1\% - 20\%$: Chờ Trưởng nhóm kinh doanh (Team Leader) duyệt.
  + Chiết khấu $> 20\%$ hoặc bán dưới giá sàn: Bắt buộc Giám đốc kinh doanh (Director) phê duyệt.
- **Quy cách tính năng:**
  + Cảnh báo vi phạm trần chiết khấu trực quan màu vàng/đỏ trong form soạn thảo.
  + Hàng đợi phê duyệt tập trung với các hành động: **Phê duyệt**, **Từ chối**, **Trả lại chỉnh sửa** kèm ghi chú bắt buộc.
  + Tab **Lịch sử xét duyệt (Audit Trail)** lưu trữ chuỗi thời gian, danh tính người duyệt và lý do.
- **Hình ảnh minh họa:**
  + [s7_02_approval_queue.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_02_approval_queue.png): Hàng đợi các báo giá đang chờ cấp trên phê duyệt.
  + [s7_02_approval_history.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_02_approval_history.png): Tab lịch sử và nhật ký xét duyệt của cấp quản lý.

---

### 3. USER STORY S7-03: SO SÁNH TRỰC QUAN GIỮA CÁC PHIÊN BẢN BÁO GIÁ (VERSION COMPARISON DIFF)
- **Tuyến đường (Route):** Mở modal từ nút **So sánh phiên bản** tại Quote Builder.
- **Mục tiêu & Nghiệp vụ:** Giúp nhân viên và quản lý đối chiếu tức thì những thay đổi giữa bản báo giá mới nhất với các bản cũ (v1, v2, v3...) trong quá trình đàm phán hợp đồng B2B.
- **Quy cách tính năng:**
  + Tự động snapshot lưu trữ các phiên bản qua từng lần chỉnh sửa.
  + Giải thuật Visual Diff làm nổi bật: Màu xanh lá cho dòng hàng mới thêm, màu đỏ cho dòng hàng đã xóa, màu vàng cho dòng hàng có thay đổi Đơn giá / Số lượng / Chiết khấu.
  + Bảng đối soát tài chính chi tiết: Chênh lệch Tiền hàng trước thuế, Tiền chiết khấu, Thuế VAT và Tổng thanh toán.
- **Hình ảnh minh họa:**
  + [s7_03_version_comparison_modal.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_03_version_comparison_modal.png): Cửa sổ đối soát phiên bản báo giá trực quan.

---

### 4. USER STORY S7-04: CHUYỂN ĐỔI BÁO GIÁ SANG HỢP ĐỒNG & ĐÓNG THẮNG DEAL
- **Tuyến đường (Route):** Nút **Chuyển thành Hợp đồng** (kích hoạt khi báo giá đạt trạng thái Accepted).
- **Mục tiêu & Nghiệp vụ:** Kết nối chu trình Quote-to-Cash, tự động kế thừa dữ liệu sang Hợp đồng pháp lý và tự động cập nhật trạng thái Cơ hội bán hàng sang Won.
- **Quy cách tính năng:**
  + Modal nhập Số hợp đồng, Ngày ký, Ngày hiệu lực, Ngày hết hạn, Điều khoản thanh toán.
  + Kế thừa 100% các dòng sản phẩm, đơn giá thỏa thuận và chiết khấu vào hợp đồng.
  + Tự động cập nhật Cơ hội bán hàng (Deal) tương ứng sang giai đoạn **Đóng Thắng (Closed Won)**.
- **Hình ảnh minh họa:**
  + [s7_04_convert_to_contract_modal.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_04_convert_to_contract_modal.png): Cửa sổ chuyển đổi báo giá sang hợp đồng chính thức.

---

### 5. USER STORY S7-05: XUẤT FILE PDF & MẪU IN BÁO GIÁ CHUẨN DOANH NGHIỆP
- **Tuyến đường (Route):** Nút **Xuất PDF Doanh nghiệp** và **In Báo Giá**.
- **Mục tiêu & Nghiệp vụ:** Cung cấp tài liệu báo giá thương mại chuyên nghiệp, đầy đủ pháp nhân và điều khoản để in ấn hoặc gửi khách hàng.
- **Quy cách tính năng:**
  + Đầy đủ thông tin pháp lý doanh nghiệp: Logo NexusCRM, Tên công ty, MST, Trụ sở, Tài khoản ngân hàng.
  + Bảng hàng hóa chuẩn mực kế toán: STT, Tên mặt hàng, ĐVT, Số lượng, Đơn giá, Chiết khấu, Thành tiền.
  + Bảng tổng hợp thanh toán & Dòng đọc số tiền bằng chữ (tiếng Việt chuẩn mực).
  + Điều khoản thương mại, thời hạn hiệu lực và khu vực ký duyệt đại diện hai bên.
- **Hình ảnh minh họa:**
  + [s7_05_quote_totals_terms.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_05_quote_totals_terms.png): Khu vực tổng thanh toán, thuế VAT và các điều khoản giao dịch.

---

### 6. USER STORY S7-06: CỔNG THÔNG TIN KHÁCH HÀNG TRỰC TUYẾN (CUSTOMER QUOTE PORTAL)
- **Tuyến đường (Route):** `/portal/quotes/:token`
- **Mục tiêu & Nghiệp vụ:** Cung cấp cổng trực tuyến độc lập cho khách hàng xem chi tiết và ký duyệt chấp thuận hoặc yêu cầu chỉnh sửa báo giá ngay tức thì.
- **Quy cách tính năng:**
  + Sinh liên kết an toàn độc quyền (Shareable Token) không cần đăng nhập.
  + Khách hàng bấm **Chấp thuận báo giá**: Nhập họ tên, chức danh người ký duyệt -> Trạng thái báo giá chuyển sang Accepted -> Gửi thông báo tức thì về CRM.
  + Khách hàng bấm **Từ chối / Yêu cầu sửa đổi**: Nhập lý do cụ thể -> Trạng thái chuyển sang Rejected kèm lưu vết phản hồi.
- **Hình ảnh minh họa:**
  + [s7_06_share_portal_modal.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_06_share_portal_modal.png): Modal tạo và sao chép liên kết duyệt trực tuyến.
  + [s7_06_customer_portal_view.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_06_customer_portal_view.png): Giao diện cổng thông tin khách hàng trực tuyến với 2 nút tương tác.

---

### 7. USER STORY S7-07: QUẢN LÝ HỢP ĐỒNG & CẢNH BÁO TÁI KÝ 1-CLICK (CONTRACT RENEWAL)
- **Tuyến đường (Route):** `/contracts`
- **Mục tiêu & Nghiệp vụ:** Quản lý vòng đời hợp đồng, theo dõi thời hạn hiệu lực và chủ động tạo cơ hội tái ký trước khi hợp đồng hết hạn để duy trì doanh thu định kỳ.
- **Quy cách tính năng:**
  + Bảng hợp đồng hiển thị số ngày còn lại (Remaining Days) đếm ngược theo thời gian thực.
  + Huy hiệu trạng thái: **Đang hiệu lực**, **Sắp hết hạn** (vàng cam, $\le 30$ ngày), **Đã hết hạn**, **Đã tái ký**.
  + Bộ lọc nhanh theo tình trạng hiệu lực và tùy chỉnh ngưỡng cảnh báo (30/60/90 ngày).
  + Nút bấm **Tái ký (1-Click Renewal)**: Mở modal tự động khởi tạo Cơ hội bán hàng tái ký mới trong pipeline với giá trị và khách hàng kế thừa từ hợp đồng cũ.
- **Hình ảnh minh họa:**
  + [s7_07_contracts_list.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_07_contracts_list.png): Danh sách hợp đồng với số ngày đếm ngược và gắn cờ cảnh báo.
  + [s7_07_renewal_opportunity_modal.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_07_renewal_opportunity_modal.png): Modal tạo cơ hội tái ký hợp đồng tự động.

---

### 8. USER STORY S7-08: TRUNG TÂM THÔNG BÁO HỆ THỐNG & CẢNH BÁO TỰ ĐỘNG (NOTIFICATION CENTER)
- **Tuyến đường (Route):** Tích hợp trên thanh điều hướng đầu trang (TopBar).
- **Mục tiêu & Nghiệp vụ:** Luân chuyển thông tin nội bộ tức thì: cảnh báo báo giá cần duyệt, báo giá được khách chấp thuận, hợp đồng sắp hết hạn và phân công nhiệm vụ mới.
- **Quy cách tính năng:**
  + Biểu tượng chuông với huy hiệu đếm số lượng thông báo chưa đọc thời gian thực.
  + Menu trượt phân loại thông báo theo màu sắc và icon trực quan.
  + Nhấp vào thông báo sẽ tự động điều hướng người dùng thẳng tới màn hình xử lý công việc tương ứng.
  + Nút đánh dấu đã đọc từng thông báo hoặc **Đánh dấu tất cả đã đọc (Mark All as Read)**.
- **Hình ảnh minh họa:**
  + [s7_08_notifications_dropdown.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_08_notifications_dropdown.png): Menu thả xuống danh sách thông báo và cảnh báo hệ thống.

---

### 9. USER STORY S7-09: ĐỘNG CƠ TỰ ĐỘNG HÓA QUY TRÌNH IF–THEN (AUTOMATION RULES ENGINE)
- **Tuyến đường (Route):** `/automation`
- **Mục tiêu & Nghiệp vụ:** Cung cấp công cụ thiết lập kịch bản tự động hóa không cần viết code theo logic: NẾU sự kiện xảy ra (IF) thỏa mãn điều kiện (AND) THÌ thực hiện hành động (THEN).
- **Quy cách tính năng:**
  + **Sự kiện kích hoạt (Trigger):** Giai đoạn Cơ hội thay đổi, Tạo Báo giá mới, Báo giá được chấp thuận, Hợp đồng đến hạn tái ký,...
  + **Điều kiện lọc (Condition):** Giá trị cơ hội $\ge$ X, Khách hàng thuộc ngành nghề Y,...
  + **Hành động tự động (Action):** Tự động tạo công việc kèm hạn xử lý, Tự động gửi thông báo hệ thống, Tự động phân công người phụ trách mới.
  + Công tắc Bật/Tắt (Toggle Active/Inactive) từng quy tắc trực tiếp trên danh sách.
  + Tab **Nhật ký thực thi (Execution Logs)** ghi nhận chi tiết lịch sử kích hoạt, thời gian chạy và trạng thái Thành công / Thất bại.
- **Hình ảnh minh họa:**
  + [s7_09_automation_rules_list.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_09_automation_rules_list.png): Danh sách các quy tắc tự động hóa IF–THEN.
  + [s7_09_create_automation_modal.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_09_create_automation_modal.png): Cửa sổ cấu hình quy tắc tự động hóa mới.
  + [s7_09_automation_execution_logs.png](file:///d:/HOC/PHAMMEM/DUAN_CODEGYM/screenshots_s7/s7_09_automation_execution_logs.png): Tab nhật ký thực thi các kịch bản tự động.

---

## III. TỔNG KẾT & ĐÁNH GIÁ NGHIỆM THU KỸ THUẬT

1. **Chuẩn hóa Mã nguồn (Code Quality):** 100% mã nguồn TypeScript Strict Mode, 0% kiểu `any`, vượt qua kiểm tra biên dịch `tsc --noEmit` với mã thoát 0.
2. **Bảo mật & Phân quyền:** Phân cấp phê duyệt chiết khấu rõ ràng giữa Nhân viên, Trưởng nhóm và Giám đốc; bảo vệ liên kết Cổng khách hàng bằng token mã hóa độc nhất.
3. **Tính liên tục của dữ liệu (Data Integrity):** Chuỗi giá trị khép kín từ Deal -> Quote -> Version Diff -> Contract -> Renewal Deal vận hành thông suốt và nhất quán.
4. **Kết luận:** **Sprint 7 ĐÃ HOÀN THÀNH 100% VÀ ĐẠT TẤT CẢ TIÊU CHÍ NGHIỆM THU.**
