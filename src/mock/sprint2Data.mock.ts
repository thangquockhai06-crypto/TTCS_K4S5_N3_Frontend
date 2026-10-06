import {
  ICategory,
  IOrgNode,
  IPipelineStage,
  IWinLossReason,
  ICompetitor,
  IAuditLogResponse,
  IAuditLogItem,
} from '../interfaces';
import { INITIAL_MOCK_AUDIT_LOGS } from './audit.mock';

const STORAGE_KEYS = {
  CATEGORIES: 'nexus_crm_categories_v2',
  ORG_TREE: 'nexus_crm_org_tree_v2',
  PIPELINE_STAGES: 'nexus_crm_pipeline_stages_v2',
  WIN_LOSS_REASONS: 'nexus_crm_win_loss_reasons_v2',
  COMPETITORS: 'nexus_crm_competitors_v2',
  AUDIT_LOGS: 'nexus_crm_audit_logs_v2',
} as const;

export const DEFAULT_CATEGORIES: ICategory[] = [
  // Nguồn khách hàng (Lead Source)
  {
    id: 'cat-src-01',
    type: 'lead_source',
    code: 'WEBSITE',
    name: 'Website & Form Đăng Ký',
    order_index: 1,
    usage_count: 42,
    is_system: true,
    is_active: true,
  },
  {
    id: 'cat-src-02',
    type: 'lead_source',
    code: 'REFERRAL',
    name: 'Khách hàng Giới thiệu (Referral)',
    order_index: 2,
    usage_count: 28,
    is_system: false,
    is_active: true,
  },
  {
    id: 'cat-src-03',
    type: 'lead_source',
    code: 'FACEBOOK_ADS',
    name: 'Quảng cáo Facebook & LinkedIn',
    order_index: 3,
    usage_count: 15,
    is_system: false,
    is_active: true,
  },
  {
    id: 'cat-src-04',
    type: 'lead_source',
    code: 'WORKSHOP',
    name: 'Sự kiện & Hội thảo Doanh nghiệp',
    order_index: 4,
    usage_count: 9,
    is_system: false,
    is_active: true,
  },
  {
    id: 'cat-src-05',
    type: 'lead_source',
    code: 'COLD_CALL',
    name: 'Tiếp cận trực tiếp (Outbound Telesales)',
    order_index: 5,
    usage_count: 0,
    is_system: false,
    is_active: true,
  },

  // Ngành nghề kinh doanh (Industry)
  {
    id: 'cat-ind-01',
    type: 'industry',
    code: 'FINTECH',
    name: 'Tài chính - Ngân hàng & Fintech',
    order_index: 1,
    usage_count: 31,
    is_system: true,
    is_active: true,
  },
  {
    id: 'cat-ind-02',
    type: 'industry',
    code: 'RETAIL',
    name: 'Bán lẻ & Thương mại Điện tử',
    order_index: 2,
    usage_count: 22,
    is_system: false,
    is_active: true,
  },
  {
    id: 'cat-ind-03',
    type: 'industry',
    code: 'REAL_ESTATE',
    name: 'Bất động sản & Xây dựng',
    order_index: 3,
    usage_count: 18,
    is_system: false,
    is_active: true,
  },
  {
    id: 'cat-ind-04',
    type: 'industry',
    code: 'HEALTHCARE',
    name: 'Y tế & Chăm sóc Sức khỏe',
    order_index: 4,
    usage_count: 12,
    is_system: false,
    is_active: true,
  },
  {
    id: 'cat-ind-05',
    type: 'industry',
    code: 'LOGISTICS',
    name: 'Logistics & Chuỗi cung ứng',
    order_index: 5,
    usage_count: 0,
    is_system: false,
    is_active: true,
  },
];

export const DEFAULT_ORG_TREE: IOrgNode[] = [
  {
    id: 'org-root',
    name: 'Ban Tổng Giám Đốc Nexus Group',
    region: 'Toàn quốc',
    leader_id: 'usr-admin-01',
    leader_name: 'Trần Văn Tổng Giám Đốc',
    member_count: 8,
    children: [
      {
        id: 'org-sales-north',
        name: 'Khối Kinh Doanh Miền Bắc',
        region: 'Hà Nội & Miền Bắc',
        leader_id: 'usr-dir-north',
        leader_name: 'Nguyễn Văn Hùng (Giám đốc KV)',
        member_count: 24,
        children: [
          {
            id: 'org-sales-ent-hn',
            name: 'Phòng Khách Hàng Doanh Nghiệp (Enterprise HN)',
            region: 'Hà Nội',
            leader_id: 'usr-lead-01',
            leader_name: 'Phạm Thị Lan',
            member_count: 12,
            children: [],
          },
          {
            id: 'org-sales-smb-hn',
            name: 'Phòng Doanh Nghiệp Vừa & Nhỏ (SMB HN)',
            region: 'Miền Bắc',
            leader_id: 'usr-lead-02',
            leader_name: 'Vũ Đức Nam',
            member_count: 12,
            children: [],
          },
        ],
      },
      {
        id: 'org-sales-south',
        name: 'Khối Kinh Doanh Miền Nam',
        region: 'TP. Hồ Chí Minh & Miền Tây',
        leader_id: 'usr-dir-south',
        leader_name: 'Lê Hoàng Long (Giám đốc KV)',
        member_count: 32,
        children: [
          {
            id: 'org-sales-hcm-01',
            name: 'Phòng Kinh Doanh Quận 1 & Quận 3',
            region: 'TP. Hồ Chí Minh',
            leader_id: 'usr-lead-03',
            leader_name: 'Đỗ Mỹ Linh',
            member_count: 16,
            children: [],
          },
          {
            id: 'org-sales-mientay',
            name: 'Phòng Phát Triển Thị Trường Đồng Bằng Sông Cửu Long',
            region: 'Miền Tây',
            leader_id: 'usr-lead-04',
            leader_name: 'Nguyễn Tấn Tài',
            member_count: 16,
            children: [],
          },
        ],
      },
    ],
  },
];

export const DEFAULT_PIPELINE_STAGES: IPipelineStage[] = [
  {
    id: 'stage-1',
    name: '1. Khảo sát Yêu cầu & Lead mới',
    stage_key: 'lead',
    order_index: 1,
    probability: 10,
    exit_rules: JSON.stringify({ require_contact: true, require_meeting: false, require_budget: false }),
    color: '#3b82f6',
    is_won: false,
    is_lost: false,
  },
  {
    id: 'stage-2',
    name: '2. Demo Giải pháp & Tư vấn Chuyên sâu',
    stage_key: 'contact',
    order_index: 2,
    probability: 30,
    exit_rules: JSON.stringify({ require_contact: true, require_meeting: true, require_budget: false }),
    color: '#8b5cf6',
    is_won: false,
    is_lost: false,
  },
  {
    id: 'stage-3',
    name: '3. Gửi Báo giá & Phương án Kỹ thuật',
    stage_key: 'proposal',
    order_index: 3,
    probability: 60,
    exit_rules: JSON.stringify({ require_contact: true, require_meeting: true, require_budget: true, require_quote: true }),
    color: '#f59e0b',
    is_won: false,
    is_lost: false,
  },
  {
    id: 'stage-4',
    name: '4. Đàm phán Hợp đồng & Pháp lý',
    stage_key: 'negotiation',
    order_index: 4,
    probability: 85,
    exit_rules: JSON.stringify({ require_approval: true }),
    color: '#ec4899',
    is_won: false,
    is_lost: false,
  },
  {
    id: 'stage-5',
    name: '5. Ký kết Thành công (WON)',
    stage_key: 'won',
    order_index: 5,
    probability: 100,
    exit_rules: JSON.stringify({}),
    color: '#10b981',
    is_won: true,
    is_lost: false,
  },
  {
    id: 'stage-6',
    name: '6. Thất bại (LOST)',
    stage_key: 'lost',
    order_index: 6,
    probability: 0,
    exit_rules: JSON.stringify({}),
    color: '#ef4444',
    is_won: false,
    is_lost: true,
  },
];

export const DEFAULT_WIN_LOSS_REASONS: IWinLossReason[] = [
  // WON
  {
    id: 'rs-won-01',
    result_type: 'WON',
    code: 'PRICE_COMPETITIVE',
    reason: 'Chính sách giá & Chiết khấu cạnh tranh vượt trội',
    description: 'Báo giá tốt hơn đối thủ từ 10-15% kèm chính sách trả góp linh hoạt',
    is_active: true,
    usage_count: 48,
  },
  {
    id: 'rs-won-02',
    result_type: 'WON',
    code: 'FEATURE_RICH',
    reason: 'Tính năng phân quyền & Tùy biến đa cấp đáp ứng 100% nghiệp vụ',
    description: 'Khách hàng đánh giá rất cao phân hệ trường tùy chỉnh và sơ đồ cây phòng ban',
    is_active: true,
    usage_count: 36,
  },
  {
    id: 'rs-won-03',
    result_type: 'WON',
    code: 'SUPPORT_EXCELLENT',
    reason: 'Dịch vụ Onboarding & Hỗ trợ kỹ thuật 24/7 tận tâm',
    description: 'Cam kết SLA phản hồi dưới 15 phút và hỗ trợ trực tiếp tại doanh nghiệp',
    is_active: true,
    usage_count: 24,
  },

  // LOST
  {
    id: 'rs-lost-01',
    result_type: 'LOST',
    code: 'BUDGET_CUT',
    reason: 'Khách hàng cắt giảm ngân sách đầu tư CNTT năm nay',
    description: 'Dự án bị hoãn sang quý sau do biến động kinh doanh nội bộ khách hàng',
    is_active: true,
    usage_count: 19,
  },
  {
    id: 'rs-lost-02',
    result_type: 'LOST',
    code: 'CHOSE_COMPETITOR',
    reason: 'Khách hàng chọn đối thủ có giá thành thấp hơn',
    description: 'Khách hàng chấp nhận giải pháp ít tính năng hơn để tiết kiệm chi phí ban đầu',
    is_active: true,
    usage_count: 14,
  },
  {
    id: 'rs-lost-03',
    result_type: 'LOST',
    code: 'INTERNAL_BUILD',
    reason: 'Khách hàng quyết định tự xây dựng phần mềm nội bộ (In-house)',
    description: 'Đội ngũ IT nội bộ của khách hàng tiếp quản dự án',
    is_active: true,
    usage_count: 5,
  },
];

export const DEFAULT_COMPETITORS: ICompetitor[] = [
  {
    id: 'comp-01',
    name: 'Salesforce CRM Enterprise',
    strengths: 'Thương hiệu toàn cầu, hệ sinh thái AppExchange phong phú',
    weaknesses: 'Chi phí triển khai cực kỳ đắt đỏ, giao diện tiếng Anh khó sử dụng',
    pricing_tier: 'Rất cao (2.500.000đ/user/tháng)',
    win_rate: 68,
    is_active: true,
  },
  {
    id: 'comp-02',
    name: 'HubSpot Sales Hub',
    strengths: 'Marketing Automation mạnh mẽ, giao diện trực quan',
    weaknesses: 'Tính năng phân quyền sâu và quản lý giá sàn còn hạn chế',
    pricing_tier: 'Trung bình - Cao (1.200.000đ/user/tháng)',
    win_rate: 74,
    is_active: true,
  },
  {
    id: 'comp-03',
    name: 'Zoho CRM Plus',
    strengths: 'Nhiều phân hệ tích hợp, chi phí bản quyền ban đầu cạnh tranh',
    weaknesses: 'Tốc độ tải chậm tại Việt Nam, quy trình tùy biến phễu phức tạp',
    pricing_tier: 'Trung bình (650.000đ/user/tháng)',
    win_rate: 82,
    is_active: true,
  },
];

// LocalStorage Helper functions
export function getStoredCategories(type?: 'lead_source' | 'industry'): ICategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    let list: ICategory[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
    if (type) {
      list = list.filter((c) => c.type === type);
    }
    return list;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function mockCreateCategory(cat: Partial<ICategory>): ICategory {
  const all = getStoredCategories();
  const newCat: ICategory = {
    id: `cat-${Date.now()}`,
    type: cat.type || 'lead_source',
    code: (cat.code || cat.name || 'CODE').toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    name: cat.name || 'Danh mục mới',
    order_index: all.filter((c) => c.type === cat.type).length + 1,
    usage_count: 0,
    is_system: false,
    is_active: cat.is_active ?? true,
  };
  const next = [...all, newCat];
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
  return newCat;
}

export function mockUpdateCategory(id: string, updates: Partial<ICategory>): ICategory {
  const all = getStoredCategories();
  let updatedItem: ICategory = all.find((c) => c.id === id) || all[0];
  const next = all.map((c) => {
    if (c.id === id) {
      updatedItem = { ...c, ...updates };
      return updatedItem;
    }
    return c;
  });
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
  return updatedItem;
}

export function mockDeleteCategory(id: string): { message: string } {
  const all = getStoredCategories();
  const target = all.find((c) => c.id === id);
  if (target && target.usage_count > 0) {
    throw new Error('Không thể xóa danh mục đang có dữ liệu sử dụng.');
  }
  const next = all.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
  return { message: 'Đã xóa danh mục thành công.' };
}

export function mockReorderCategories(orderedIds: string[]): { message: string } {
  const all = getStoredCategories();
  const next = all.map((c) => {
    const idx = orderedIds.indexOf(c.id);
    if (idx !== -1) {
      return { ...c, order_index: idx + 1 };
    }
    return c;
  });
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
  return { message: 'Đã cập nhật thứ tự danh mục thành công.' };
}

// Org Tree
export function getStoredOrgTree(): IOrgNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORG_TREE);
    return raw ? JSON.parse(raw) : DEFAULT_ORG_TREE;
  } catch {
    return DEFAULT_ORG_TREE;
  }
}

export function mockUpdateOrgNode(id: string, data: { leader_id?: string; leader_name?: string; region?: string }): IOrgNode {
  const tree = getStoredOrgTree();

  const updateRecursive = (nodes: IOrgNode[]): { updated: boolean; node?: IOrgNode } => {
    for (const node of nodes) {
      if (node.id === id) {
        if (data.leader_id !== undefined) node.leader_id = data.leader_id;
        if (data.leader_name !== undefined) node.leader_name = data.leader_name;
        if (data.region !== undefined) node.region = data.region;
        return { updated: true, node };
      }
      if (node.children && node.children.length > 0) {
        const res = updateRecursive(node.children);
        if (res.updated) return res;
      }
    }
    return { updated: false };
  };

  const result = updateRecursive(tree);
  localStorage.setItem(STORAGE_KEYS.ORG_TREE, JSON.stringify(tree));
  return result.node || tree[0];
}

// Pipeline Stages
export function getStoredPipelineStages(): IPipelineStage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIPELINE_STAGES);
    return raw ? JSON.parse(raw) : DEFAULT_PIPELINE_STAGES;
  } catch {
    return DEFAULT_PIPELINE_STAGES;
  }
}

export function mockCreatePipelineStage(stage: Partial<IPipelineStage>): IPipelineStage {
  const all = getStoredPipelineStages();
  const newStage: IPipelineStage = {
    id: `stage-${Date.now()}`,
    name: stage.name || 'Giai đoạn mới',
    stage_key: stage.stage_key || `custom_${Date.now()}`,
    order_index: all.length + 1,
    probability: stage.probability ?? 50,
    exit_rules: stage.exit_rules || JSON.stringify({}),
    color: stage.color || '#2563eb',
    is_won: stage.is_won || false,
    is_lost: stage.is_lost || false,
  };
  const next = [...all, newStage];
  localStorage.setItem(STORAGE_KEYS.PIPELINE_STAGES, JSON.stringify(next));
  return newStage;
}

export function mockUpdatePipelineStage(id: string, updates: Partial<IPipelineStage>): IPipelineStage {
  const all = getStoredPipelineStages();
  let updatedItem: IPipelineStage = all.find((s) => s.id === id) || all[0];
  const next = all.map((s) => {
    if (s.id === id) {
      updatedItem = { ...s, ...updates };
      return updatedItem;
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEYS.PIPELINE_STAGES, JSON.stringify(next));
  return updatedItem;
}

export function mockDeletePipelineStage(id: string): { message: string } {
  const all = getStoredPipelineStages();
  const next = all.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.PIPELINE_STAGES, JSON.stringify(next));
  return { message: 'Đã xóa giai đoạn phễu thành công.' };
}

export function mockReorderPipelineStages(orderedIds: string[]): { message: string } {
  const all = getStoredPipelineStages();
  const next = all.map((s) => {
    const idx = orderedIds.indexOf(s.id);
    if (idx !== -1) {
      return { ...s, order_index: idx + 1 };
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEYS.PIPELINE_STAGES, JSON.stringify(next));
  return { message: 'Đã cập nhật thứ tự giai đoạn phễu thành công.' };
}

// Win/Loss Reasons
export function getStoredWinLossReasons(resultType?: 'WON' | 'LOST'): IWinLossReason[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WIN_LOSS_REASONS);
    let list: IWinLossReason[] = raw ? JSON.parse(raw) : DEFAULT_WIN_LOSS_REASONS;
    if (resultType) {
      list = list.filter((r) => r.result_type === resultType);
    }
    return list;
  } catch {
    return DEFAULT_WIN_LOSS_REASONS;
  }
}

export function mockCreateWinLossReason(reason: Partial<IWinLossReason>): IWinLossReason {
  const all = getStoredWinLossReasons();
  const newReason: IWinLossReason = {
    id: `rs-${Date.now()}`,
    result_type: reason.result_type || 'WON',
    code: (reason.code || reason.reason || 'REASON').toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    reason: reason.reason || 'Lý do mới',
    description: reason.description || '',
    is_active: reason.is_active ?? true,
    usage_count: 0,
  };
  const next = [...all, newReason];
  localStorage.setItem(STORAGE_KEYS.WIN_LOSS_REASONS, JSON.stringify(next));
  return newReason;
}

export function mockUpdateWinLossReason(id: string, updates: Partial<IWinLossReason>): IWinLossReason {
  const all = getStoredWinLossReasons();
  let updatedItem: IWinLossReason = all.find((r) => r.id === id) || all[0];
  const next = all.map((r) => {
    if (r.id === id) {
      updatedItem = { ...r, ...updates };
      return updatedItem;
    }
    return r;
  });
  localStorage.setItem(STORAGE_KEYS.WIN_LOSS_REASONS, JSON.stringify(next));
  return updatedItem;
}

export function mockDeleteWinLossReason(id: string): { message: string } {
  const all = getStoredWinLossReasons();
  const next = all.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.WIN_LOSS_REASONS, JSON.stringify(next));
  return { message: 'Đã xóa lý do thắng/thua thành công.' };
}

// Competitors
export function getStoredCompetitors(): ICompetitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPETITORS);
    return raw ? JSON.parse(raw) : DEFAULT_COMPETITORS;
  } catch {
    return DEFAULT_COMPETITORS;
  }
}

export function mockCreateCompetitor(competitor: Partial<ICompetitor>): ICompetitor {
  const all = getStoredCompetitors();
  const newComp: ICompetitor = {
    id: `comp-${Date.now()}`,
    name: competitor.name || 'Đối thủ mới',
    strengths: competitor.strengths || '',
    weaknesses: competitor.weaknesses || '',
    pricing_tier: competitor.pricing_tier || 'Trung bình',
    win_rate: competitor.win_rate ?? 50,
    is_active: competitor.is_active ?? true,
  };
  const next = [...all, newComp];
  localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(next));
  return newComp;
}

export function mockUpdateCompetitor(id: string, updates: Partial<ICompetitor>): ICompetitor {
  const all = getStoredCompetitors();
  let updatedItem: ICompetitor = all.find((c) => c.id === id) || all[0];
  const next = all.map((c) => {
    if (c.id === id) {
      updatedItem = { ...c, ...updates };
      return updatedItem;
    }
    return c;
  });
  localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(next));
  return updatedItem;
}

export function mockDeleteCompetitor(id: string): { message: string } {
  const all = getStoredCompetitors();
  const next = all.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(next));
  return { message: 'Đã xóa đối thủ thành công.' };
}

// Audit Logs
export function getStoredAuditLogsResponse(params?: {
  page?: number;
  limit?: number;
}): IAuditLogResponse {
  const limit = params?.limit || 20;
  const page = params?.page || 1;
  const list: IAuditLogItem[] = INITIAL_MOCK_AUDIT_LOGS.map((item) => ({
    id: String(item.id),
    action: 'UPDATE',
    performed_by: item.performed_by,
    user_name: item.user_name,
    user_email: item.user_email,
    target_type: item.target_type,
    target_id: item.target_id,
    field_name: item.field_name,
    old_value: item.old_value ?? undefined,
    new_value: item.new_value ?? undefined,
    timestamp: item.created_at,
  }));
  const total = list.length;
  const startIndex = (page - 1) * limit;
  const pagedItems = list.slice(startIndex, startIndex + limit);

  return {
    items: pagedItems,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  };
}
