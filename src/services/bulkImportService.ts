import {
  BulkImportRowStatus,
  IBulkImportRow,
  IBulkImportStats,
  IBulkImportResult,
  IBulkImportTemplateColumn,
} from '../interfaces/bulk-import.interface';
import {
  ICustomer,
  CreateCustomerDTO,
  CustomerTierType,
  CustomerStatusType,
} from '../interfaces/customer.interface';

// ---------------------------------------------------------------------------
// Template definition
// ---------------------------------------------------------------------------

export const BULK_IMPORT_TEMPLATE_COLUMNS: IBulkImportTemplateColumn[] = [
  { key: 'ho_va_ten',    label: 'Họ và tên',              required: true,  example: 'Nguyễn Văn An',        hint: 'Tên đầu mối liên hệ chính' },
  { key: 'chuc_danh',   label: 'Chức danh',              required: true,  example: 'Giám đốc Công nghệ',   hint: 'Chức vụ/vai trò trong công ty' },
  { key: 'email',       label: 'Email',                  required: true,  example: 'an@congty.vn',          hint: 'Email làm việc' },
  { key: 'dien_thoai',  label: 'Số điện thoại',          required: false, example: '0901234567',            hint: 'Số điện thoại liên lạc' },
  { key: 'cong_ty',     label: 'Tên công ty',            required: true,  example: 'ABC Technology',        hint: 'Tên doanh nghiệp khách hàng' },
  { key: 'domain',      label: 'Website/Domain',         required: false, example: 'abc.vn',                hint: 'Tên miền website công ty' },
  { key: 'nganh_nghe',  label: 'Ngành nghề',             required: false, example: 'Công nghệ phần mềm',   hint: 'Lĩnh vực hoạt động' },
  { key: 'dia_diem',    label: 'Địa điểm',               required: false, example: 'Hà Nội',               hint: 'Thành phố/quốc gia' },
  { key: 'phan_khuc',   label: 'Phân khúc',              required: false, example: 'Enterprise',            hint: 'Enterprise / Mid-Market / Growth / Startup' },
  { key: 'trang_thai',  label: 'Trạng thái',             required: false, example: 'New Lead',              hint: 'Active / New Lead / Negotiation / At Risk / Churned' },
  { key: 'gia_tri_hd',  label: 'Giá trị HĐ dự kiến ($)', required: false, example: '50000',                hint: 'Nhập số nguyên, đơn vị USD' },
  { key: 'ghi_chu',     label: 'Ghi chú',                required: false, example: 'Khách hàng tiềm năng', hint: 'Mô tả tổng quan về khách hàng' },
];

// ---------------------------------------------------------------------------
// CSV generation helpers
// ---------------------------------------------------------------------------

/** Tạo nội dung file CSV mẫu để người dùng tải về */
export function generateTemplateCsv(): string {
  const headers = BULK_IMPORT_TEMPLATE_COLUMNS.map((c) => c.label).join(',');
  const examples = BULK_IMPORT_TEMPLATE_COLUMNS.map((c) => `"${c.example}"`).join(',');
  const hint    = BULK_IMPORT_TEMPLATE_COLUMNS.map((c) => `"${c.hint}"`).join(',');
  return `${headers}\n${examples}\n${hint}\n`;
}

/** Kích hoạt tải file CSV mẫu trong trình duyệt */
export function downloadTemplateCsv(): void {
  const content = generateTemplateCsv();
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nexuscrm_template_nhap_khach_hang.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

/** Tách một dòng CSV thô ra mảng các ô (xử lý trường hợp có dấu phẩy trong ngoặc kép) */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Phân tích toàn bộ nội dung file CSV thành mảng object */
function parseCsv(content: string): Array<Record<string, string>> {
  // Loại bỏ BOM nếu có
  const clean = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx]?.trim() ?? '';
    });
    results.push(row);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Column key normalization (map Vietnamese column headers → internal keys)
// ---------------------------------------------------------------------------

const COLUMN_KEY_MAP: Record<string, string> = {
  'họ và tên': 'ho_va_ten',
  'ho va ten': 'ho_va_ten',
  'ho_va_ten': 'ho_va_ten',
  'tên': 'ho_va_ten',
  'chức danh': 'chuc_danh',
  'chuc danh': 'chuc_danh',
  'chuc_danh': 'chuc_danh',
  'chức vụ': 'chuc_danh',
  'email': 'email',
  'số điện thoại': 'dien_thoai',
  'so dien thoai': 'dien_thoai',
  'dien_thoai': 'dien_thoai',
  'điện thoại': 'dien_thoai',
  'phone': 'dien_thoai',
  'tên công ty': 'cong_ty',
  'ten cong ty': 'cong_ty',
  'cong_ty': 'cong_ty',
  'công ty': 'cong_ty',
  'company': 'cong_ty',
  'website/domain': 'domain',
  'domain': 'domain',
  'website': 'domain',
  'ngành nghề': 'nganh_nghe',
  'nganh nghe': 'nganh_nghe',
  'nganh_nghe': 'nganh_nghe',
  'industry': 'nganh_nghe',
  'địa điểm': 'dia_diem',
  'dia diem': 'dia_diem',
  'dia_diem': 'dia_diem',
  'location': 'dia_diem',
  'phân khúc': 'phan_khuc',
  'phan khuc': 'phan_khuc',
  'phan_khuc': 'phan_khuc',
  'tier': 'phan_khuc',
  'trạng thái': 'trang_thai',
  'trang thai': 'trang_thai',
  'trang_thai': 'trang_thai',
  'status': 'trang_thai',
  'giá trị hđ dự kiến ($)': 'gia_tri_hd',
  'gia tri hd du kien ($)': 'gia_tri_hd',
  'gia_tri_hd': 'gia_tri_hd',
  'deal value': 'gia_tri_hd',
  'ghi chú': 'ghi_chu',
  'ghi chu': 'ghi_chu',
  'ghi_chu': 'ghi_chu',
  'notes': 'ghi_chu',
};

function normalizeRowKeys(raw: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const mapped = COLUMN_KEY_MAP[key.toLowerCase()] ?? key;
    normalized[mapped] = value;
  }
  return normalized;
}

// ---------------------------------------------------------------------------
// Tier & Status normalization
// ---------------------------------------------------------------------------

function normalizeTier(raw: string): CustomerTierType {
  const val = raw.trim().toLowerCase();
  if (val.includes('enterprise')) return 'Enterprise';
  if (val.includes('mid') || val.includes('market')) return 'Mid-Market';
  if (val.includes('growth')) return 'Growth';
  return 'Startup';
}

function normalizeStatus(raw: string): CustomerStatusType {
  const val = raw.trim().toLowerCase();
  if (val.includes('active') || val.includes('đang hoạt động')) return 'Active';
  if (val.includes('negotiation') || val.includes('đàm phán')) return 'Negotiation';
  if (val.includes('at risk') || val.includes('rủi ro')) return 'At Risk';
  if (val.includes('churned') || val.includes('mất')) return 'Churned';
  return 'New Lead';
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateRow(row: Record<string, string>): string[] {
  const errs: string[] = [];
  if (!row['ho_va_ten']) errs.push('Thiếu "Họ và tên" (bắt buộc)');
  if (!row['chuc_danh']) errs.push('Thiếu "Chức danh" (bắt buộc)');
  if (!row['email']) {
    errs.push('Thiếu "Email" (bắt buộc)');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['email'])) {
    errs.push(`Email không hợp lệ: "${row['email']}"`);
  }
  if (!row['cong_ty']) errs.push('Thiếu "Tên công ty" (bắt buộc)');
  const dv = row['gia_tri_hd'];
  if (dv && isNaN(Number(dv))) {
    errs.push(`Giá trị hợp đồng không hợp lệ: "${dv}" (phải là số)`);
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

function detectDuplicate(
  row: Record<string, string>,
  existingCustomers: ICustomer[]
): { id: string; name: string } | null {
  const email = row['email']?.toLowerCase().trim();
  const company = row['cong_ty']?.toLowerCase().trim();
  const fullName = row['ho_va_ten']?.toLowerCase().trim();

  for (const c of existingCustomers) {
    if (email && c.email.toLowerCase() === email) {
      return { id: c.id, name: c.fullName };
    }
    if (company && fullName && c.company.toLowerCase() === company && c.fullName.toLowerCase() === fullName) {
      return { id: c.id, name: c.fullName };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Đọc file CSV/TXT và trả về mảng IBulkImportRow đã được validate */
export async function parseAndValidateFile(
  file: File,
  existingCustomers: ICustomer[]
): Promise<IBulkImportRow[]> {
  const text = await file.text();
  const rawRows = parseCsv(text);

  return rawRows.map((rawData, idx) => {
    const normalized = normalizeRowKeys(rawData);
    const errors = validateRow(normalized);
    const dup = errors.length === 0 ? detectDuplicate(normalized, existingCustomers) : null;

    let rowStatus: BulkImportRowStatus;
    if (errors.length > 0) {
      rowStatus = 'error';
    } else if (dup) {
      rowStatus = 'duplicate';
    } else {
      rowStatus = 'valid';
    }

    return {
      rowIndex: idx + 2,
      rawData: normalized,
      status: rowStatus,
      errors,
      duplicateCustomerId: dup?.id,
      duplicateCustomerName: dup?.name,
      duplicateAction: dup ? 'skip' : undefined,
      fullName: normalized['ho_va_ten'] ?? '',
      role: normalized['chuc_danh'] ?? '',
      email: normalized['email'] ?? '',
      phone: normalized['dien_thoai'] ?? '',
      company: normalized['cong_ty'] ?? '',
      companyDomain: normalized['domain'] ?? '',
      industry: normalized['nganh_nghe'] ?? 'Chưa xác định',
      location: normalized['dia_diem'] ?? 'Việt Nam',
      tier: normalizeTier(normalized['phan_khuc'] ?? ''),
      customerStatus: normalizeStatus(normalized['trang_thai'] ?? ''),
      dealValue: Number(normalized['gia_tri_hd'] ?? 0) || 0,
      summary: normalized['ghi_chu'] ?? '',
    };
  });
}

/** Tính thống kê từ danh sách dòng đã parse */
export function computeStats(rows: IBulkImportRow[]): IBulkImportStats {
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === 'valid').length,
    duplicates: rows.filter((r) => r.status === 'duplicate').length,
    errors: rows.filter((r) => r.status === 'error').length,
  };
}

/** Thực thi nhập dữ liệu, trả về kết quả */
export function executeImport(
  rows: IBulkImportRow[],
  addCustomer: (dto: CreateCustomerDTO) => ICustomer
): IBulkImportResult {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.status === 'error') {
      skipped++;
      continue;
    }
    if (row.status === 'duplicate') {
      if (row.duplicateAction === 'skip' || !row.duplicateAction) {
        skipped++;
        continue;
      }
      // 'update' — tạo mới bản ghi (frontend chưa có API update, tạo mới là hành vi hợp lý)
      const dto: CreateCustomerDTO = buildDto(row);
      addCustomer(dto);
      updated++;
      continue;
    }
    // valid
    const dto: CreateCustomerDTO = buildDto(row);
    addCustomer(dto);
    imported++;
  }

  return { imported, updated, skipped };
}

function buildDto(row: IBulkImportRow): CreateCustomerDTO {
  return {
    fullName: row.fullName,
    role: row.role || 'Liên hệ chính',
    email: row.email,
    phone: row.phone || 'Chưa cập nhật',
    company: row.company,
    companyDomain: row.companyDomain || `${row.company.toLowerCase().replace(/\s+/g, '')}.com`,
    industry: row.industry,
    location: row.location,
    tier: row.tier,
    status: row.customerStatus,
    dealValue: row.dealValue,
    ownerName: 'Quản Trị Viên Hệ Thống',
    tags: ['Nhập hàng loạt', row.tier],
    summary: row.summary || `${row.company} — Nhập qua tính năng nhập hàng loạt.`,
  };
}
