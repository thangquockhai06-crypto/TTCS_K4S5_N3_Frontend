export interface IExcelImportUserRow {
  name: string;
  email: string;
  role?: string;
  group?: string;
  phone?: string;
}

export interface IInvalidRowDetail {
  row_index: number;
  data: Record<string, unknown>;
  error: string;
}

export interface IExcelImportResult {
  total: number;
  success_count: number;
  failed_count: number;
  failed_rows: IInvalidRowDetail[];
  inserted_users: Array<{ name: string; email: string; role: string }>;
}

export interface IUserProfileUpdate {
  full_name?: string;
  phone?: string;
  title?: string;
  department?: string;
  avatar_url?: string;
}

export interface IAuditLogItem {
  id: string;
  action: string;
  performed_by: string;
  user_name?: string;
  user_email?: string;
  target_type: string;
  target_id: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  metadata?: string;
  timestamp: string;
}

export interface IAuditLogResponse {
  items: IAuditLogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// S2-05: Product & Price List Interfaces (SCRUM-84)
export type ProductType = 'one_off' | 'subscription';

export interface IProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  product_type: ProductType; // 'one_off' (sản phẩm một lần) | 'subscription' (dịch vụ thuê bao)
  description?: string;
  cost_price?: number | null; // Giá vốn: Chỉ Giám đốc kinh doanh có quyền xem và sửa
  selling_price: number; // Giá bán niêm yết
  floor_price: number; // Giá sàn: Ngưỡng xác định duyệt chiết khấu
  currency: string;
  unit: string; // Đơn vị tính (Gói/Năm, Buổi, License, ...)
  quote_count: number; // Số báo giá liên kết (nếu > 0 thì không được xóa)
  is_active: boolean; // Trạng thái: Đang kinh doanh / Ngừng kinh doanh
  created_at?: string;
}

export interface IProductFormData {
  sku: string;
  name: string;
  category: string;
  product_type: ProductType;
  description?: string;
  cost_price?: number;
  selling_price: number;
  floor_price: number;
  currency?: string;
  unit: string;
  is_active?: boolean;
}

export interface IPriceList {
  id: string;
  name: string;
  code: string;
  description?: string;
  multiplier: number;
  is_active: boolean;
  created_at?: string;
}

export interface IOrgNode {
  id: string;
  name: string;
  region: string;
  leader_id?: string | null;
  leader_name?: string | null;
  member_count: number;
  children: IOrgNode[];
}

export interface ICategory {
  id: string;
  type: 'lead_source' | 'industry';
  code: string;
  name: string;
  order_index: number;
  usage_count: number;
  is_system: boolean;
  is_active: boolean;
}

export interface ICustomField {
  id: string;
  entity_type: 'customer' | 'deal';
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select';
  options?: string | null;
  is_required: boolean;
  default_value?: string | null;
  created_at?: string;
}

export interface IExitRules {
  require_contact?: boolean;
  require_meeting?: boolean;
  require_budget?: boolean;
  require_quote?: boolean;
  require_approval?: boolean;
  [key: string]: boolean | undefined;
}

export interface IPipelineStage {
  id: string;
  name: string;
  stage_key: string;
  order_index: number;
  probability: number;
  exit_rules: string; // JSON string
  color: string;
  is_won: boolean;
  is_lost: boolean;
}

export interface IWinLossReason {
  id: string;
  result_type: 'WON' | 'LOST';
  code: string;
  reason: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
}

export interface ICompetitor {
  id: string;
  name: string;
  strengths?: string;
  weaknesses?: string;
  pricing_tier?: string;
  win_rate: number;
  is_active: boolean;
}
