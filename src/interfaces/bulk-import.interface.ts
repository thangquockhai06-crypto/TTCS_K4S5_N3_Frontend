export type { CustomerStatusType, CustomerTierType } from './customer.interface';
import { CustomerStatusType, CustomerTierType } from './customer.interface';

/** Trạng thái từng dòng trong bảng xem trước */
export type BulkImportRowStatus =
  | 'valid'      // Hợp lệ, sẵn sàng nhập
  | 'duplicate'  // Trùng lặp với bản ghi đã có
  | 'error'      // Lỗi dữ liệu (thiếu trường bắt buộc, sai định dạng)
  | 'skipped'    // Người dùng chọn bỏ qua
  | 'imported';  // Đã nhập thành công

/** Hành động xử lý bản ghi trùng lặp */
export type DuplicateActionType = 'skip' | 'update';

/** Một dòng dữ liệu trong file CSV đã được phân tích */
export interface IBulkImportRow {
  /** Số thứ tự dòng (bắt đầu từ 2, vì dòng 1 là header) */
  rowIndex: number;
  /** Dữ liệu thô từ CSV (key = tên cột) */
  rawData: Record<string, string>;
  /** Trạng thái xử lý của dòng */
  status: BulkImportRowStatus;
  /** Danh sách lỗi validation (nếu có) */
  errors: string[];
  /** ID khách hàng trùng lặp (nếu có) */
  duplicateCustomerId?: string;
  /** Tên khách hàng trùng lặp (nếu có) */
  duplicateCustomerName?: string;
  /** Hành động xử lý trùng lặp do người dùng chọn */
  duplicateAction?: DuplicateActionType;
  /** Dữ liệu đã parse - Họ và tên */
  fullName: string;
  /** Dữ liệu đã parse - Chức danh */
  role: string;
  /** Dữ liệu đã parse - Email */
  email: string;
  /** Dữ liệu đã parse - Số điện thoại */
  phone: string;
  /** Dữ liệu đã parse - Công ty */
  company: string;
  /** Dữ liệu đã parse - Domain công ty */
  companyDomain: string;
  /** Dữ liệu đã parse - Ngành nghề */
  industry: string;
  /** Dữ liệu đã parse - Địa điểm */
  location: string;
  /** Dữ liệu đã parse - Phân khúc khách hàng */
  tier: CustomerTierType;
  /** Dữ liệu đã parse - Trạng thái khách hàng */
  customerStatus: CustomerStatusType;
  /** Dữ liệu đã parse - Giá trị hợp đồng dự kiến */
  dealValue: number;
  /** Dữ liệu đã parse - Ghi chú tổng quan */
  summary: string;
}

/** Thống kê kết quả phân tích file */
export interface IBulkImportStats {
  /** Tổng số dòng dữ liệu (không tính header) */
  total: number;
  /** Số dòng hợp lệ */
  valid: number;
  /** Số dòng trùng lặp */
  duplicates: number;
  /** Số dòng có lỗi */
  errors: number;
}

/** Kết quả sau khi hoàn tất nhập dữ liệu */
export interface IBulkImportResult {
  /** Số bản ghi được tạo mới */
  imported: number;
  /** Số bản ghi được cập nhật (từ hành động "cập nhật" trùng lặp) */
  updated: number;
  /** Số bản ghi bị bỏ qua */
  skipped: number;
}

/** Bước hiển thị trong wizard nhập liệu hàng loạt */
export type BulkImportStep = 'upload' | 'preview' | 'result';

/** Cột template CSV cho chức năng nhập hàng loạt */
export interface IBulkImportTemplateColumn {
  key: string;
  label: string;
  required: boolean;
  example: string;
  hint: string;
}
