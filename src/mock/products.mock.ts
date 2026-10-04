import { IPriceList, IProduct, IProductFormData } from '../interfaces';

export const PRODUCTS_STORAGE_KEYS = {
  PRODUCTS: 'nexus_crm_products_list_v2',
  PRICE_LISTS: 'nexus_crm_price_lists_v2',
} as const;

export const DEFAULT_PRODUCTS: IProduct[] = [
  {
    id: 'prod-001',
    sku: 'PRD-CRM-ENT',
    name: 'NexusCRM Bản Enterprise',
    category: 'Phần mềm CRM',
    product_type: 'subscription',
    description: 'Hệ thống CRM toàn diện cho tập đoàn & doanh nghiệp lớn, không giới hạn tính năng',
    cost_price: 6000000,
    selling_price: 12000000,
    floor_price: 9500000,
    currency: 'VND',
    unit: 'Gói/Năm',
    quote_count: 8,
    is_active: true,
    created_at: '2026-01-15T08:30:00Z',
  },
  {
    id: 'prod-002',
    sku: 'PRD-CRM-PRO',
    name: 'NexusCRM Bản Professional',
    category: 'Phần mềm CRM',
    product_type: 'subscription',
    description: 'Giải pháp quản lý quan hệ khách hàng tối ưu cho doanh nghiệp vừa và nhỏ (SMB)',
    cost_price: 3200000,
    selling_price: 6500000,
    floor_price: 5000000,
    currency: 'VND',
    unit: 'Gói/Năm',
    quote_count: 3,
    is_active: true,
    created_at: '2026-01-18T10:00:00Z',
  },
  {
    id: 'prod-003',
    sku: 'PRD-ONB-STD',
    name: 'Gói Triển Khai & Khởi Tạo Onboarding',
    category: 'Dịch vụ Đào tạo & Onboarding',
    product_type: 'one_off',
    description: 'Dịch vụ khảo sát quy trình bán hàng, nhập liệu ban đầu và thiết lập hệ thống chuẩn',
    cost_price: 12000000,
    selling_price: 25000000,
    floor_price: 20000000,
    currency: 'VND',
    unit: 'Gói',
    quote_count: 5,
    is_active: true,
    created_at: '2026-02-01T09:15:00Z',
  },
  {
    id: 'prod-004',
    sku: 'PRD-TRN-ADV',
    name: 'Đào Tạo Chuyên Sâu Quản Trị Hệ Thống CRM',
    category: 'Dịch vụ Đào tạo & Onboarding',
    product_type: 'one_off',
    description: 'Khóa huấn luyện thực chiến 1-1 cho đội ngũ quản trị viên và trưởng bộ phận bán hàng',
    cost_price: 2500000,
    selling_price: 5000000,
    floor_price: 4000000,
    currency: 'VND',
    unit: 'Buổi',
    quote_count: 0, // 0 báo giá => Được phép xóa trực tiếp
    is_active: true,
    created_at: '2026-02-10T14:20:00Z',
  },
  {
    id: 'prod-005',
    sku: 'PRD-SRV-DED',
    name: 'Máy Chủ Cloud Private Chuyên Biệt',
    category: 'Gói Hạ tầng',
    product_type: 'subscription',
    description: 'Hạ tầng điện toán đám mây riêng biệt, SLA 99.95%, bảo mật cấp ngân hàng',
    cost_price: 8500000,
    selling_price: 15000000,
    floor_price: 13000000,
    currency: 'VND',
    unit: 'Tháng',
    quote_count: 0, // 0 báo giá => Được phép xóa trực tiếp
    is_active: true,
    created_at: '2026-02-15T11:00:00Z',
  },
  {
    id: 'prod-006',
    sku: 'PRD-SMS-OLD',
    name: 'Gói Tích Hợp SMS Brandname Giao Thức Cũ (V1)',
    category: 'Dịch vụ Đào tạo & Onboarding',
    product_type: 'one_off',
    description: 'Cổng gửi tin nhắn thương hiệu giao thức cũ, ngừng cung ứng cho hợp đồng mới',
    cost_price: 1800000,
    selling_price: 3500000,
    floor_price: 3000000,
    currency: 'VND',
    unit: 'Gói',
    quote_count: 2, // Đã có 2 báo giá => Chuyển sang Ngừng kinh doanh
    is_active: false,
    created_at: '2025-11-20T16:00:00Z',
  },
];

export const DEFAULT_PRICE_LISTS: IPriceList[] = [
  {
    id: 'pl-001',
    code: 'PL-STANDARD',
    name: 'Bảng giá Niêm Yết Tiêu Chuẩn',
    multiplier: 1.0,
    description: 'Áp dụng cho mọi khách hàng thông thường theo giá niêm yết chuẩn của công ty',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pl-002',
    code: 'PL-PARTNER',
    name: 'Bảng giá Đối Tác Chiến Lược (Partner Tier 1)',
    multiplier: 0.85,
    description: 'Chiết khấu 15% cho mạng lưới đối tác công nghệ và đại lý ủy quyền chính thức',
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pl-003',
    code: 'PL-ENTERPRISE',
    name: 'Bảng giá Khách Hàng Doanh Nghiệp Lớn (Volume)',
    multiplier: 0.75,
    description: 'Chiết khấu 25% cho hợp đồng doanh nghiệp quy mô lớn từ 50 seats',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'pl-004',
    code: 'PL-PROMO-SPECIAL',
    name: 'Bảng giá Siêu Ưu Đãi Chiến Dịch Cuối Năm',
    multiplier: 0.6,
    description: 'Chiết khấu 40% (Thử nghiệm: Một số sản phẩm sẽ thấp hơn giá sàn và cần duyệt chiết khấu)',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
  },
];

export function getStoredProducts(): IProduct[] {
  const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEYS.PRODUCTS);
  if (!raw) {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return [...DEFAULT_PRODUCTS];
  }
  try {
    const parsed = JSON.parse(raw) as IProduct[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_PRODUCTS];
  } catch {
    return [...DEFAULT_PRODUCTS];
  }
}

export function saveStoredProducts(products: IProduct[]): void {
  window.localStorage.setItem(PRODUCTS_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getStoredPriceLists(): IPriceList[] {
  const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEYS.PRICE_LISTS);
  if (!raw) {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEYS.PRICE_LISTS, JSON.stringify(DEFAULT_PRICE_LISTS));
    return [...DEFAULT_PRICE_LISTS];
  }
  try {
    const parsed = JSON.parse(raw) as IPriceList[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_PRICE_LISTS];
  } catch {
    return [...DEFAULT_PRICE_LISTS];
  }
}

export function saveStoredPriceLists(priceLists: IPriceList[]): void {
  window.localStorage.setItem(PRODUCTS_STORAGE_KEYS.PRICE_LISTS, JSON.stringify(priceLists));
}

export function mockCreateProduct(data: IProductFormData): IProduct {
  const products = getStoredProducts();
  const newProduct: IProduct = {
    id: `prod-${Date.now()}`,
    sku: data.sku.trim().toUpperCase(),
    name: data.name.trim(),
    category: data.category || 'Phần mềm CRM',
    product_type: data.product_type || 'subscription',
    description: data.description?.trim() || '',
    cost_price: data.cost_price !== undefined ? Number(data.cost_price) : null,
    selling_price: Number(data.selling_price) || 0,
    floor_price: Number(data.floor_price) || 0,
    currency: data.currency || 'VND',
    unit: data.unit.trim() || 'Gói/Năm',
    quote_count: 0,
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: new Date().toISOString(),
  };

  const updated = [newProduct, ...products];
  saveStoredProducts(updated);
  return newProduct;
}

export function mockUpdateProduct(id: string, updates: Partial<IProduct>): IProduct {
  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy sản phẩm có id: ${id}`);
  }

  const current = products[index];
  const updatedItem: IProduct = {
    ...current,
    ...updates,
    sku: updates.sku ? updates.sku.trim().toUpperCase() : current.sku,
    name: updates.name ? updates.name.trim() : current.name,
    product_type: updates.product_type || current.product_type,
    selling_price: updates.selling_price !== undefined ? Number(updates.selling_price) : current.selling_price,
    floor_price: updates.floor_price !== undefined ? Number(updates.floor_price) : current.floor_price,
    cost_price: updates.cost_price !== undefined ? Number(updates.cost_price) : current.cost_price,
  };

  products[index] = updatedItem;
  saveStoredProducts(products);
  return updatedItem;
}

export function mockToggleProductActive(id: string): IProduct {
  const products = getStoredProducts();
  const item = products.find((p) => p.id === id);
  if (!item) {
    throw new Error(`Không tìm thấy sản phẩm có id: ${id}`);
  }
  return mockUpdateProduct(id, { is_active: !item.is_active });
}

export function mockDeleteProduct(id: string): { message: string } {
  const products = getStoredProducts();
  const item = products.find((p) => p.id === id);
  if (!item) {
    throw new Error(`Không tìm thấy sản phẩm có id: ${id}`);
  }

  // Ràng buộc SCRUM-84: Sản phẩm đã phát sinh báo giá không được xóa
  if (item.quote_count > 0) {
    throw new Error(
      `RÀNG BUỘC CHÍNH SÁCH: Sản phẩm "${item.name}" (${item.sku}) đã phát sinh ${item.quote_count} báo giá / hợp đồng liên kết. Theo quy định, không được phép xóa dữ liệu này mà chỉ được chuyển sang trạng thái "Ngừng kinh doanh".`
    );
  }

  const filtered = products.filter((p) => p.id !== id);
  saveStoredProducts(filtered);
  return { message: `Đã xóa thành công sản phẩm "${item.name}" (${item.sku}).` };
}

export function mockCreatePriceList(data: Partial<IPriceList>): IPriceList {
  const priceLists = getStoredPriceLists();
  const newPriceList: IPriceList = {
    id: `pl-${Date.now()}`,
    name: data.name?.trim() || 'Bảng giá mới',
    code: (data.code?.trim() || `PL-${Date.now()}`).toUpperCase(),
    multiplier: data.multiplier !== undefined ? Number(data.multiplier) : 1.0,
    description: data.description?.trim() || '',
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: new Date().toISOString(),
  };

  const updated = [newPriceList, ...priceLists];
  saveStoredPriceLists(updated);
  return newPriceList;
}

export function mockUpdatePriceList(id: string, updates: Partial<IPriceList>): IPriceList {
  const priceLists = getStoredPriceLists();
  const index = priceLists.findIndex((pl) => pl.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy bảng giá có id: ${id}`);
  }

  const current = priceLists[index];
  const updatedItem: IPriceList = {
    ...current,
    ...updates,
    name: updates.name ? updates.name.trim() : current.name,
    code: updates.code ? updates.code.trim().toUpperCase() : current.code,
    multiplier: updates.multiplier !== undefined ? Number(updates.multiplier) : current.multiplier,
    description: updates.description !== undefined ? updates.description.trim() : current.description,
    is_active: updates.is_active !== undefined ? updates.is_active : current.is_active,
  };

  priceLists[index] = updatedItem;
  saveStoredPriceLists(priceLists);
  return updatedItem;
}

export function mockDeletePriceList(id: string): { message: string } {
  const priceLists = getStoredPriceLists();
  const item = priceLists.find((pl) => pl.id === id);
  if (!item) {
    throw new Error(`Không tìm thấy bảng giá có id: ${id}`);
  }

  const filtered = priceLists.filter((pl) => pl.id !== id);
  saveStoredPriceLists(filtered);
  return { message: `Đã xóa thành công bảng giá "${item.name}" (${item.code}).` };
}

