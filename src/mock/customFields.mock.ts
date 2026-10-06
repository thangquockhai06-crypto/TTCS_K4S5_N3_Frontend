import { ICustomField } from '../interfaces';

export const CUSTOM_FIELDS_STORAGE_KEY = 'nexus_crm_custom_fields_v1';

export const DEFAULT_CUSTOM_FIELDS: ICustomField[] = [
  {
    id: 'cf-cust-001',
    entity_type: 'customer',
    field_name: 'tax_code',
    field_label: 'Mã số thuế doanh nghiệp',
    field_type: 'text',
    is_required: true,
    options: null,
    default_value: '',
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'cf-cust-002',
    entity_type: 'customer',
    field_name: 'employee_count',
    field_label: 'Quy mô nhân sự',
    field_type: 'number',
    is_required: false,
    options: null,
    default_value: '50',
    created_at: '2026-03-01T08:30:00Z',
  },
  {
    id: 'cf-cust-003',
    entity_type: 'customer',
    field_name: 'deployment_type',
    field_label: 'Hình thức triển khai',
    field_type: 'select',
    options: 'Cloud SaaS,On-Premises,Hybrid Cloud',
    is_required: true,
    default_value: 'Cloud SaaS',
    created_at: '2026-03-02T09:00:00Z',
  },
  {
    id: 'cf-cust-004',
    entity_type: 'customer',
    field_name: 'target_launch_date',
    field_label: 'Ngày dự kiến vận hành',
    field_type: 'date',
    is_required: false,
    options: null,
    default_value: '2026-11-01',
    created_at: '2026-03-02T09:30:00Z',
  },
  {
    id: 'cf-deal-001',
    entity_type: 'deal',
    field_name: 'contract_number',
    field_label: 'Mã số hợp đồng kinh tế',
    field_type: 'text',
    is_required: false,
    options: null,
    default_value: '',
    created_at: '2026-03-03T10:00:00Z',
  },
  {
    id: 'cf-deal-002',
    entity_type: 'deal',
    field_name: 'competitor',
    field_label: 'Đối thủ cạnh tranh trực tiếp',
    field_type: 'select',
    options: 'Salesforce,HubSpot,Zoho CRM,Khác',
    is_required: false,
    default_value: 'Salesforce',
    created_at: '2026-03-03T10:30:00Z',
  },
  {
    id: 'cf-deal-003',
    entity_type: 'deal',
    field_name: 'decision_deadline',
    field_label: 'Hạn chốt phê duyệt',
    field_type: 'date',
    is_required: true,
    options: null,
    default_value: '2026-12-15',
    created_at: '2026-03-03T11:00:00Z',
  },
  {
    id: 'cf-deal-004',
    entity_type: 'deal',
    field_name: 'approved_budget',
    field_label: 'Ngân sách được duyệt ($)',
    field_type: 'number',
    is_required: false,
    options: null,
    default_value: '50000',
    created_at: '2026-03-03T11:30:00Z',
  },
];

export function getStoredCustomFields(entityType?: 'customer' | 'deal'): ICustomField[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY);
    let list: ICustomField[] = [];
    if (!raw) {
      list = [...DEFAULT_CUSTOM_FIELDS];
      localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(list));
    } else {
      list = JSON.parse(raw) as ICustomField[];
    }

    if (entityType) {
      return list.filter((f) => f.entity_type === entityType);
    }
    return list;
  } catch {
    if (entityType) {
      return DEFAULT_CUSTOM_FIELDS.filter((f) => f.entity_type === entityType);
    }
    return DEFAULT_CUSTOM_FIELDS;
  }
}

export function saveStoredCustomFields(fields: ICustomField[]): void {
  try {
    localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(fields));
  } catch (err: unknown) {
    console.error('Không thể lưu trường tùy chỉnh vào localStorage:', err);
  }
}

export function mockCreateCustomField(data: Partial<ICustomField>): ICustomField {
  const current = getStoredCustomFields();
  const newField: ICustomField = {
    id: `cf-${Date.now()}`,
    entity_type: data.entity_type || 'customer',
    field_name: (data.field_name || `field_${Date.now()}`).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    field_label: data.field_label || 'Trường mới',
    field_type: data.field_type || 'text',
    options: data.field_type === 'select' ? data.options || null : null,
    is_required: Boolean(data.is_required),
    default_value: data.default_value || null,
    created_at: new Date().toISOString(),
  };

  const updated = [...current, newField];
  saveStoredCustomFields(updated);
  return newField;
}

export function mockUpdateCustomField(id: string, data: Partial<ICustomField>): ICustomField {
  const current = getStoredCustomFields();
  let updatedItem: ICustomField | null = null;

  const next = current.map((item) => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        ...data,
        options: data.field_type === 'select' ? data.options : null,
      };
      return updatedItem;
    }
    return item;
  });

  if (!updatedItem) {
    throw new Error('Không tìm thấy trường tùy chỉnh để cập nhật.');
  }

  saveStoredCustomFields(next);
  return updatedItem;
}

export function mockDeleteCustomField(id: string): { message: string } {
  const current = getStoredCustomFields();
  const next = current.filter((item) => item.id !== id);
  saveStoredCustomFields(next);
  return { message: 'Đã xóa trường tùy chỉnh thành công.' };
}
