export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatVndCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

export function formatNumberWithCommas(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const clean = String(value).replace(/[^\d]/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('en-US');
}

export function parseNumberFromCommas(formatted: string): number {
  const clean = String(formatted).replace(/[^\d]/g, '');
  return clean ? Number(clean) : 0;
}

export function formatCountdownTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const paddedMin = String(minutes).padStart(2, '0');
  const paddedSec = String(seconds).padStart(2, '0');
  return `${paddedMin}:${paddedSec}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'NX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

const AVATAR_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#2563EB', '#4F46E5'],
  ['#8B5CF6', '#EC4899'],
  ['#0EA5E9', '#2563EB'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#EA580C'],
  ['#6366F1', '#8B5CF6'],
  ['#14B8A6', '#0284C7'],
  ['#EC4899', '#8B5CF6'],
];

export function createAvatarSvgDataUri(name: string, seedIndex = 0): string {
  const initials = getInitials(name);
  const [startColor, endColor] = AVATAR_GRADIENTS[seedIndex % AVATAR_GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${startColor}" />
        <stop offset="100%" stop-color="${endColor}" />
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="22" fill="url(#g)" />
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-weight="700" font-size="28">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function toLocalDateInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const AUDIT_ACTION_MAP: Record<string, string> = {
  // Deal actions
  DEAL_CLOSE_LOST: 'Đóng thất bại',
  DEAL_CLOSE_WON: 'Chốt thành công',
  DEAL_REASSIGNED: 'Bàn giao cơ hội',
  DEAL_STAGE_CHANGED: 'Chuyển giai đoạn',
  DEAL_CREATED: 'Tạo cơ hội mới',
  DEAL_UPDATED: 'Cập nhật cơ hội',
  DEAL_DELETED: 'Xóa cơ hội',

  // Lead actions
  LEAD_CONVERTED: 'Chuyển đổi thành công',
  LEAD_MERGED: 'Gộp đầu mối trùng lặp',
  LEAD_ASSIGNED: 'Phân bổ phụ trách Lead',
  LEAD_CREATED: 'Tạo đầu mối mới',
  LEAD_UPDATED: 'Cập nhật đầu mối',
  LEAD_DELETED: 'Xóa đầu mối',
  LEAD_STATUS_CHANGED: 'Đổi trạng thái đầu mối',

  // Customer actions
  MERGE_CUSTOMER: 'Gộp khách hàng trùng lặp',
  TRANSFER_CONTACT: 'Chuyển giao người liên hệ',
  CUSTOMER_CREATED: 'Tạo mới khách hàng',
  CUSTOMER_UPDATED: 'Cập nhật thông tin khách hàng',
  CUSTOMER_DELETED: 'Xóa khách hàng',

  // Task actions
  TASK_CREATED: 'Tạo mới công việc',
  TASK_UPDATED: 'Cập nhật công việc',
  TASK_COMPLETED: 'Hoàn thành công việc',
  TASK_DELETED: 'Xóa công việc',

  // General CRUD
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật dữ liệu',
  DELETE: 'Xóa bản ghi',

  // Auth / User actions
  LOGIN: 'Đăng nhập hệ thống',
  LOGOUT: 'Đăng xuất',
  PASSWORD_CHANGED: 'Đổi mật khẩu tài khoản',
  USER_CREATED: 'Tạo mới tài khoản người dùng',
  USER_UPDATED: 'Cập nhật người dùng',
  USER_DEACTIVATED: 'Vô hiệu hóa tài khoản',
  USER_ACTIVATED: 'Kích hoạt lại tài khoản',

  // Campaign & Product & Quote
  CAMPAIGN_CREATED: 'Tạo chiến dịch mới',
  CAMPAIGN_UPDATED: 'Cập nhật chiến dịch',
  PRODUCT_CREATED: 'Tạo sản phẩm mới',
  PRODUCT_UPDATED: 'Cập nhật sản phẩm',
  QUOTE_CREATED: 'Soạn báo giá mới',
  QUOTE_UPDATED: 'Cập nhật báo giá',
  QUOTE_SENT: 'Đã gửi báo giá cho khách',
};

const AUDIT_TARGET_MAP: Record<string, string> = {
  DEAL: 'Cơ hội bán hàng',
  deal: 'Cơ hội bán hàng',
  deals: 'Cơ hội bán hàng',

  LEAD: 'Đầu mối tiềm năng',
  lead: 'Đầu mối tiềm năng',
  leads: 'Đầu mối tiềm năng',

  CUSTOMER: 'Khách hàng',
  customer: 'Khách hàng',
  customers: 'Khách hàng',

  USER: 'Người dùng',
  user: 'Người dùng',
  users: 'Người dùng',

  TASK: 'Công việc',
  task: 'Công việc',
  tasks: 'Công việc',

  CONTACT: 'Người liên hệ',
  contact: 'Người liên hệ',
  contacts: 'Người liên hệ',

  CAMPAIGN: 'Chiến dịch tiếp thị',
  campaign: 'Chiến dịch tiếp thị',
  campaigns: 'Chiến dịch tiếp thị',

  PRODUCT: 'Sản phẩm / Dịch vụ',
  product: 'Sản phẩm / Dịch vụ',
  products: 'Sản phẩm / Dịch vụ',

  QUOTE: 'Báo giá',
  quote: 'Báo giá',
  quotes: 'Báo giá',

  ACTIVITY: 'Hoạt động tương tác',
  activity: 'Hoạt động tương tác',
  activities: 'Hoạt động tương tác',

  QUOTA: 'Chỉ tiêu doanh số',
  quota: 'Chỉ tiêu doanh số',
};

const AUDIT_FIELD_MAP: Record<string, string> = {
  stage: 'Giai đoạn',
  value: 'Giá trị hợp đồng',
  status: 'Trạng thái',
  owner_id: 'Người phụ trách',
  assigned_user_id: 'Người phụ trách',
  full_name: 'Họ và tên',
  name: 'Tên',
  email: 'Email',
  phone: 'Số điện thoại',
  company: 'Tên công ty / Doanh nghiệp',
  is_active: 'Trạng thái hoạt động',
  role: 'Vai trò / Quyền hạn',
  title: 'Tiêu đề',
  closing_date: 'Ngày chốt dự kiến',
  budget: 'Ngân sách',
  expected_revenue: 'Doanh thu kỳ vọng',
};

export function formatAuditAction(action?: string): string {
  if (!action) return 'Hoạt động hệ thống';
  const clean = action.trim();
  if (AUDIT_ACTION_MAP[clean]) {
    return AUDIT_ACTION_MAP[clean];
  }
  const upper = clean.toUpperCase();
  if (AUDIT_ACTION_MAP[upper]) {
    return AUDIT_ACTION_MAP[upper];
  }
  return clean.replace(/_/g, ' ');
}

export function formatAuditTargetType(targetType?: string): string {
  if (!targetType) return 'Dữ liệu';
  const clean = targetType.trim();
  if (AUDIT_TARGET_MAP[clean]) {
    return AUDIT_TARGET_MAP[clean];
  }
  const lower = clean.toLowerCase();
  if (AUDIT_TARGET_MAP[lower]) {
    return AUDIT_TARGET_MAP[lower];
  }
  return clean;
}

export function formatAuditFieldName(fieldName?: string): string {
  if (!fieldName) return '—';
  const clean = fieldName.trim();
  if (AUDIT_FIELD_MAP[clean]) {
    return AUDIT_FIELD_MAP[clean];
  }
  const lower = clean.toLowerCase();
  if (AUDIT_FIELD_MAP[lower]) {
    return AUDIT_FIELD_MAP[lower];
  }
  return clean;
}

export function getAuditActionBadgeStyle(action?: string): { color: string; bg: string; dot: string } {
  const a = (action || '').toUpperCase();
  if (a.includes('WON') || a.includes('COMPLETE') || a.includes('CONVERT') || a === 'CREATE') {
    return { color: '#15803d', bg: '#dcfce7', dot: '#16a34a' }; // Green
  }
  if (a.includes('LOST') || a.includes('DELETE') || a.includes('DEACTIVAT')) {
    return { color: '#b91c1c', bg: '#fee2e2', dot: '#dc2626' }; // Red
  }
  if (a.includes('MERGE') || a.includes('REASSIGN') || a.includes('TRANSFER')) {
    return { color: '#b45309', bg: '#fef3c7', dot: '#d97706' }; // Amber
  }
  if (a.includes('STAGE') || a === 'UPDATE') {
    return { color: '#0369a1', bg: '#e0f2fe', dot: '#0284c7' }; // Sky
  }
  return { color: '#1d4ed8', bg: '#eff6ff', dot: '#2563eb' }; // Blue default
}

const STAGE_MAP: Record<string, string> = {
  lead: 'Đầu mối',
  contact: 'Đã liên hệ',
  proposal: 'Đề xuất giải pháp',
  negotiation: 'Đàm phán giá',
  won: 'Đã chốt thành công',
  closed_won: 'Đã chốt thành công',
  lost: 'Đã thất bại',
  closed_lost: 'Đã thất bại',
  stalled: 'Đang ứ đọng',
};

export function formatDealStage(stage?: string): string {
  if (!stage) return 'Chưa xác định';
  const clean = stage.trim().toLowerCase();
  return STAGE_MAP[clean] || stage;
}

const LEAD_STATUS_MAP: Record<string, string> = {
  UNASSIGNED: 'Chưa phân bổ',
  ASSIGNED: 'Đã phân bổ',
  CONTACTED: 'Đã liên hệ',
  QUALIFIED: 'Đủ điều kiện',
  CONVERTED: 'Đã chuyển đổi',
  REJECTED: 'Không phù hợp',
  DISQUALIFIED: 'Không phù hợp',
  JUNK: 'Dữ liệu rác',
};

export function formatLeadStatus(status?: string): string {
  if (!status) return 'Chưa phân bổ';
  const clean = status.trim().toUpperCase();
  return LEAD_STATUS_MAP[clean] || status;
}

const LEAD_SOURCE_MAP: Record<string, string> = {
  'web form': 'Biểu mẫu Website',
  'web_form': 'Biểu mẫu Website',
  event: 'Hội thảo / Sự kiện',
  referral: 'Khách hàng giới thiệu',
  'cold call': 'Gọi điện trực tiếp',
  'cold_call': 'Gọi điện trực tiếp',
  partner: 'Đối tác kinh doanh',
  direct: 'Liên hệ trực tiếp',
  facebook: 'Mạng xã hội (Facebook)',
  google: 'Tìm kiếm Google',
  email: 'Tiếp thị Email',
};

export function formatLeadSource(source?: string): string {
  if (!source) return 'Không rõ nguồn';
  const clean = source.trim().toLowerCase();
  return LEAD_SOURCE_MAP[clean] || source;
}

const CUSTOMER_TIER_MAP: Record<string, string> = {
  standard: 'Tiêu chuẩn',
  silver: 'Bạc',
  gold: 'Vàng',
  platinum: 'Bạch kim',
  vip: 'Khách VIP',
};

export function formatCustomerTier(tier?: string): string {
  if (!tier) return 'Tiêu chuẩn';
  const clean = tier.trim().toLowerCase();
  return CUSTOMER_TIER_MAP[clean] || tier;
}

const CUSTOMER_STATUS_MAP: Record<string, string> = {
  active: 'Đang hợp tác',
  negotiation: 'Đang đàm phán',
  'new lead': 'Tiềm năng mới',
  new_lead: 'Tiềm năng mới',
  lead: 'Tiềm năng mới',
  'at risk': 'Có rủi ro rời bỏ',
  at_risk: 'Có rủi ro rời bỏ',
  churned: 'Đã ngừng hợp tác',
  prospect: 'Khách hàng tiềm năng',
};

export function formatCustomerStatus(status?: string): string {
  if (!status) return 'Tiềm năng mới';
  const clean = status.trim().toLowerCase();
  return CUSTOMER_STATUS_MAP[clean] || status;
}

const PRIORITY_MAP: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export function formatPriority(priority?: string): string {
  if (!priority) return 'Trung bình';
  const clean = priority.trim().toLowerCase();
  return PRIORITY_MAP[clean] || priority;
}

const TASK_STATUS_MAP: Record<string, string> = {
  pending: 'Đang chờ',
  in_progress: 'Đang thực hiện',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

export function formatTaskStatus(status?: string): string {
  if (!status) return 'Đang chờ';
  const clean = status.trim().toLowerCase();
  return TASK_STATUS_MAP[clean] || status;
}

const CAMPAIGN_TYPE_MAP: Record<string, string> = {
  EMAIL: 'Tiếp thị Email',
  EVENT: 'Hội thảo / Sự kiện',
  SOCIAL: 'Mạng xã hội',
  ADS: 'Quảng cáo số',
  WEBINAR: 'Hội thảo trực tuyến',
  COLD_CALL: 'Tiếp thị điện thoại',
  OTHER: 'Kênh khác',
};

export function formatCampaignType(type?: string): string {
  if (!type) return 'Khác';
  const clean = type.trim().toUpperCase();
  return CAMPAIGN_TYPE_MAP[clean] || type;
}

const CAMPAIGN_STATUS_MAP: Record<string, string> = {
  PLANNING: 'Lên kế hoạch',
  ACTIVE: 'Đang chạy',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

export function formatCampaignStatus(status?: string): string {
  if (!status) return 'Đang chạy';
  const clean = status.trim().toUpperCase();
  return CAMPAIGN_STATUS_MAP[clean] || status;
}

const USER_ROLE_MAP: Record<string, string> = {
  SUPER_ADMIN: 'Quản trị viên cấp cao',
  ADMIN: 'Quản trị viên',
  SALES_MANAGER: 'Trưởng nhóm kinh doanh',
  MANAGER: 'Trưởng nhóm kinh doanh',
  LEADER: 'Trưởng nhóm kinh doanh',
  VP_OF_SALES: 'Giám đốc kinh doanh',
  DIRECTOR: 'Giám đốc kinh doanh',
  ACCOUNT_EXECUTIVE: 'Chuyên viên kinh doanh',
  SALES: 'Chuyên viên kinh doanh',
  USER: 'Nhân viên kinh doanh',
};

export function formatUserRole(role?: string): string {
  if (!role) return 'Nhân viên';
  const clean = role.trim().toUpperCase();
  return USER_ROLE_MAP[clean] || role;
}

const TICKET_STATUS_MAP: Record<string, string> = {
  open: 'Mới mở',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý xong',
  closed: 'Đã đóng phiếu',
};

export function formatTicketStatus(status?: string): string {
  if (!status) return 'Đang xử lý';
  const clean = status.trim().toLowerCase();
  return TICKET_STATUS_MAP[clean] || status;
}

const TICKET_PRIORITY_MAP: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export function formatTicketPriority(priority?: string): string {
  if (!priority) return 'Trung bình';
  const clean = priority.trim().toLowerCase();
  return TICKET_PRIORITY_MAP[clean] || priority;
}
