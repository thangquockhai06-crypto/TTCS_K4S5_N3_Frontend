import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  Lock,
  ShieldCheck,
  UserCheck,
  PowerOff,
  Power,
  X,
} from 'lucide-react';
import { IProduct, IProductFormData, ProductType } from '../../interfaces';
import { useAuthorization } from '../../hooks/useAuthorization';
import { useCRMData } from '../../context/CRMDataContext';
import { sprint2Service } from '../../services/sprint2Service';
import { PriceListModal } from './PriceListModal';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';
import { ToastNotification, IToastItem } from '../common/ToastNotification';
import { ConfirmModal } from '../common/ConfirmModal';

interface IFormDataState {
  sku: string;
  name: string;
  category: string;
  product_type: ProductType;
  description: string;
  selling_price: number | '';
  floor_price: number | '';
  cost_price: number | '';
  unit: string;
  is_active: boolean;
}

export const ProductList: React.FC = () => {
  const { isDirector: authIsDirector } = useAuthorization();
  const { appearance } = useCRMData();
  const isDark = appearance.theme === 'dark';

  // Chỉ 2 lựa chọn kiểm thử vai trò: Giám đốc và Nhân viên
  const [isDirector, setIsDirector] = useState<boolean>(() => authIsDirector);

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPriceListOpen, setIsPriceListOpen] = useState<boolean>(false);

  // Danh sách Toasts thông báo ở góc dưới bên phải màn hình (hiệu ứng mờ dần khi hiện và biến mất)
  const [toasts, setToasts] = useState<IToastItem[]>([]);

  // State xác nhận xóa sản phẩm bằng ConfirmModal (thay thế window.confirm)
  const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);

  // State cảnh báo giá sàn cao hơn giá niêm yết bằng ConfirmModal (thay thế window.confirm)
  const [isFloorWarningOpen, setIsFloorWarningOpen] = useState<boolean>(false);

  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modal thêm/sửa sản phẩm
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState<IFormDataState>({
    sku: '',
    name: '',
    category: 'Phần mềm CRM',
    product_type: 'subscription',
    description: '',
    selling_price: '',
    floor_price: '',
    cost_price: '',
    unit: '',
    is_active: true,
  });

  const fetchProducts = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }
    try {
      const data = await sprint2Service.getProducts({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        product_type: typeFilter !== 'all' ? typeFilter : undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });
      setProducts(data);
    } catch {
      addToast('Không thể tải danh sách sản phẩm từ hệ thống.', 'error');
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, [search, categoryFilter, typeFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  const handleRoleChange = (roleDirector: boolean) => {
    setIsDirector(roleDirector);
    if (roleDirector) {
      addToast('Đã chuyển sang vai trò: Giám đốc kinh doanh (Director) - Hiển thị Giá vốn', 'info');
    } else {
      addToast('Đã chuyển sang vai trò: Nhân viên kinh doanh (Sales Rep) - Đã ẩn Giá vốn', 'info');
    }
  };

  // Khi bấm "Thêm sản phẩm mới" -> Cho nhập từ đầu, không hiển thị sẵn dữ liệu mẫu
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: 'Phần mềm CRM',
      product_type: 'subscription',
      description: '',
      selling_price: '',
      floor_price: '',
      cost_price: '',
      unit: '',
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: IProduct) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      product_type: p.product_type || 'subscription',
      description: p.description || '',
      selling_price: p.selling_price,
      floor_price: p.floor_price,
      cost_price: p.cost_price ?? '',
      unit: p.unit,
      is_active: p.is_active,
    });
    setIsFormOpen(true);
  };

  const executeSaveProduct = async () => {
    try {
      const payload: IProductFormData = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category,
        product_type: formData.product_type,
        description: formData.description.trim(),
        selling_price: Number(formData.selling_price) || 0,
        floor_price: Number(formData.floor_price) || 0,
        cost_price: isDirector ? (formData.cost_price !== '' ? Number(formData.cost_price) : undefined) : editingProduct?.cost_price ?? undefined,
        unit: formData.unit.trim(),
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const updated = await sprint2Service.updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((item) => (item.id === editingProduct.id ? updated : item)));
        addToast(`Đã cập nhật thông tin sản phẩm "${formData.name}" thành công!`, 'success');
      } else {
        const created = await sprint2Service.createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        addToast(`Đã thêm mới sản phẩm "${formData.name}" thành công!`, 'success');
      }
      setIsFormOpen(false);
      setIsFloorWarningOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu thông tin sản phẩm.';
      addToast(message, 'error');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const sellPrice = Number(formData.selling_price) || 0;
    const flPrice = Number(formData.floor_price) || 0;

    // Thay thế window.confirm bằng ConfirmModal
    if (flPrice > sellPrice) {
      setIsFloorWarningOpen(true);
      return;
    }

    await executeSaveProduct();
  };

  // Xác nhận xóa sản phẩm bằng ConfirmModal
  const handleClickDelete = (e: React.MouseEvent, p: IProduct) => {
    e.preventDefault();
    e.stopPropagation();

    if (p.quote_count > 0) {
      addToast(
        `Không thể xóa: Sản phẩm "${p.name}" (${p.sku}) đã phát sinh ${p.quote_count} báo giá liên kết. Vui lòng chuyển sang trạng thái "Ngừng kinh doanh".`,
        'warning'
      );
      return;
    }

    setProductToDelete(p);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const p = productToDelete;
    setProductToDelete(null);

    try {
      const res = await sprint2Service.deleteProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      addToast(res.message || `Đã xóa vĩnh viễn sản phẩm "${p.name}" thành công.`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa sản phẩm.';
      addToast(message, 'error');
    }
  };

  // Chuyển đổi trạng thái Ngừng kinh doanh / Kích hoạt lại (Cập nhật tại chỗ, giữ nguyên vị trí cuộn trang)
  const handleToggleStatus = async (e: React.MouseEvent, p: IProduct) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const updated = await sprint2Service.toggleProductActive(p.id);
      // Cập nhật state tại chỗ, KHÔNG reload toàn bộ bảng gây nhảy về đầu trang
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));

      if (updated.is_active) {
        addToast(`Đã kích hoạt kinh doanh cho sản phẩm "${p.name}" (${p.sku}).`, 'success');
      } else {
        addToast(`Đã chuyển sản phẩm "${p.name}" (${p.sku}) sang trạng thái Ngừng kinh doanh.`, 'warning');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái.';
      addToast(message, 'error');
    }
  };

  const formatCurrency = (val?: number | null): string => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const discontinued = total - active;
    return { total, active, discontinued };
  }, [products]);

  // Options cho bộ lọc
  const typeFilterOptions: ICustomSelectOption[] = [
    { value: 'all', label: 'Tất cả loại sản phẩm' },
    { value: 'subscription', label: 'Dịch vụ thuê bao' },
    { value: 'one_off', label: 'Sản phẩm một lần' },
  ];

  const categoryFilterOptions: ICustomSelectOption[] = [
    { value: 'all', label: 'Tất cả nhóm danh mục' },
    { value: 'Phần mềm CRM', label: 'Phần mềm CRM' },
    { value: 'Dịch vụ Đào tạo & Onboarding', label: 'Dịch vụ Onboarding' },
    { value: 'Gói Hạ tầng', label: 'Gói Hạ tầng' },
  ];

  const statusFilterOptions: ICustomSelectOption[] = [
    { value: 'all', label: `Tất cả trạng thái (${stats.total})` },
    { value: 'active', label: `Đang kinh doanh (${stats.active})` },
    { value: 'discontinued', label: `Ngừng kinh doanh (${stats.discontinued})` },
  ];

  // Options cho Form
  const formTypeOptions: ICustomSelectOption<ProductType>[] = [
    { value: 'subscription', label: 'Dịch vụ thuê bao (Subscription)' },
    { value: 'one_off', label: 'Sản phẩm một lần (One-off)' },
  ];

  const formCategoryOptions: ICustomSelectOption[] = [
    { value: 'Phần mềm CRM', label: 'Phần mềm CRM' },
    { value: 'Dịch vụ Đào tạo & Onboarding', label: 'Dịch vụ Đào tạo & Onboarding' },
    { value: 'Gói Hạ tầng', label: 'Gói Hạ tầng' },
  ];

  const formStatusOptions: ICustomSelectOption<'active' | 'inactive'>[] = [
    { value: 'active', label: 'Đang kinh doanh' },
    { value: 'inactive', label: 'Ngừng kinh doanh' },
  ];

  // Kiểu input chuẩn đồng bộ 100% theo ảnh giá sàn
  const standardInputStyle: React.CSSProperties = {
    width: '100%',
    height: '38px',
    padding: '0 12px',
    borderRadius: '6px',
    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: isDark ? '#f8fafc' : '#0f172a',
    backgroundColor: isDark ? '#111827' : '#ffffff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  // Label căn chỉnh chuẩn: giữ trên 1 dòng, chiều cao đồng đều 22px để không bị xô lệch hàng ngang
  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    minHeight: '22px',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: isDark ? '#cbd5e1' : '#334155',
    marginBottom: '6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Thanh chuyển vai trò: Chỉ 2 nút Giám đốc và Nhân viên */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: isDark
            ? isDirector
              ? 'rgba(16, 185, 129, 0.12)'
              : '#161f30'
            : isDirector
            ? '#f0fdf4'
            : '#f8fafc',
          borderRadius: '8px',
          border: `1px solid ${
            isDark
              ? isDirector
                ? 'rgba(16, 185, 129, 0.28)'
                : '#1e293b'
              : isDirector
              ? '#bbf7d0'
              : '#e2e8f0'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDirector ? (
            <ShieldCheck size={18} color={isDark ? '#4ade80' : '#15803d'} />
          ) : (
            <UserCheck size={18} color={isDark ? '#94a3b8' : '#475569'} />
          )}
          <div>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isDirector
                  ? isDark
                    ? '#86efac'
                    : '#166534'
                  : isDark
                  ? '#f8fafc'
                  : '#334155',
              }}
            >
              Chế độ phân quyền: {isDirector ? 'Giám đốc kinh doanh (Director)' : 'Nhân viên kinh doanh (Sales Rep)'}
            </span>
            <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '8px' }}>
              {isDirector
                ? '• Hiển thị cột Giá vốn (Cost Price) & cho phép quản lý toàn quyền'
                : '• Đã ẨN hoàn toàn cột Giá vốn (Cost Price) theo quy định bảo mật'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Chuyển vai trò test:</span>
          <button
            type="button"
            onClick={() => handleRoleChange(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: isDirector ? '1px solid #16a34a' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              backgroundColor: isDirector ? '#16a34a' : isDark ? '#1e293b' : '#ffffff',
              color: isDirector ? '#ffffff' : isDark ? '#cbd5e1' : '#334155',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👑 Giám đốc (Director)
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange(false)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: !isDirector ? '1px solid #2563eb' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              backgroundColor: !isDirector ? '#2563eb' : isDark ? '#1e293b' : '#ffffff',
              color: !isDirector ? '#ffffff' : isDark ? '#cbd5e1' : '#334155',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👤 Nhân viên (Sales Rep)
          </button>
        </div>
      </div>

      {/* Top Action & Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm */}
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...standardInputStyle,
                height: '38px',
                paddingLeft: '32px',
                fontSize: '0.82rem',
              }}
            />
            <Search size={15} color={isDark ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '10px', top: '11px' }} />
          </div>

          {/* Lọc loại sản phẩm (CustomSelect) */}
          <div style={{ width: '180px' }}>
            <CustomSelect
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={typeFilterOptions}
              height="38px"
            />
          </div>

          {/* Lọc nhóm danh mục (CustomSelect) */}
          <div style={{ width: '190px' }}>
            <CustomSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={categoryFilterOptions}
              height="38px"
            />
          </div>

          {/* Lọc trạng thái kinh doanh (CustomSelect) */}
          <div style={{ width: '190px' }}>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusFilterOptions}
              height="38px"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsPriceListOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 14px',
              borderRadius: '6px',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#60a5fa' : '#334155',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Tag size={15} color={isDark ? '#60a5fa' : '#2563eb'} />
            Bảng giá (Price Lists)
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Plus size={16} />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Bảng Danh mục Sản phẩm & Dịch vụ: Khoảng trống rộng rãi, các hàng rộng hơn, không che khuất */}
      <div
        style={{
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          overflowX: 'auto',
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
          width: '100%',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '1300px',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
            textAlign: 'left',
          }}
        >
          <thead style={{ backgroundColor: isDark ? '#161f30' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
            <tr>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '130px' }}>
                Mã SKU
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, minWidth: '240px' }}>
                Tên sản phẩm & dịch vụ
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '140px' }}>
                Loại sản phẩm
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '150px' }}>
                Nhóm danh mục
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '110px' }}>
                Đơn vị tính
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '130px' }}>
                Giá niêm yết
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '140px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Giá sàn
                  <span
                    title="Ngưỡng giá xác định báo giá có cần duyệt chiết khấu hay không (nếu giá bán < giá sàn)"
                    style={{ cursor: 'help', color: isDark ? '#64748b' : '#94a3b8' }}
                  >
                    ⓘ
                  </span>
                </span>
              </th>

              {/* Ẩn cột "Giá vốn" qua điều kiện role Director */}
              {isDirector && (
                <th
                  style={{
                    padding: '14px 16px',
                    color: isDark ? '#fbbf24' : '#b45309',
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fefce8',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    width: '140px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={13} />
                    Giá vốn (Director)
                  </span>
                </th>
              )}

              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '130px' }}>
                Báo giá liên kết
              </th>
              <th style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '130px' }}>
                Trạng thái
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'right', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '120px' }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={isDirector ? 11 : 10}
                  style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}
                >
                  Đang tải danh mục sản phẩm & dịch vụ...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={isDirector ? 11 : 10}
                  style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}
                >
                  Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isSubscription = p.product_type === 'subscription';
                const hasQuotes = p.quote_count > 0;

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                      backgroundColor: isDark
                        ? p.is_active
                          ? '#111827'
                          : '#0d131f'
                        : p.is_active
                        ? '#ffffff'
                        : '#fafafa',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {/* SKU: Trên 1 dòng */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: isDark ? '#60a5fa' : '#2563eb', whiteSpace: 'nowrap' }}>
                      {p.sku}
                    </td>

                    {/* Tên sản phẩm & dịch vụ */}
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: isDark ? '#f8fafc' : '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        {!p.is_active && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                              color: isDark ? '#fca5a5' : '#b91c1c',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Đã ngừng kinh doanh
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                          {p.description}
                        </div>
                      )}
                    </td>

                    {/* Loại sản phẩm */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: isDark
                            ? isSubscription
                              ? 'rgba(14, 165, 233, 0.18)'
                              : 'rgba(99, 102, 241, 0.18)'
                            : isSubscription
                            ? '#ecfeff'
                            : '#eff6ff',
                          color: isDark
                            ? isSubscription
                              ? '#7dd3fc'
                              : '#a5b4fc'
                            : isSubscription
                            ? '#0e7490'
                            : '#1d4ed8',
                          border: `1px solid ${
                            isDark
                              ? isSubscription
                                ? 'rgba(14, 165, 233, 0.3)'
                                : 'rgba(99, 102, 241, 0.3)'
                              : isSubscription
                              ? '#a5f3fc'
                              : '#bfdbfe'
                          }`,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSubscription ? 'Dịch vụ thuê bao' : 'Sản phẩm một lần'}
                      </span>
                    </td>

                    {/* Nhóm danh mục */}
                    <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#475569', whiteSpace: 'nowrap' }}>
                      {p.category}
                    </td>

                    {/* Đơn vị tính */}
                    <td style={{ padding: '14px 16px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                      {p.unit}
                    </td>

                    {/* Giá niêm yết */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap' }}>
                      {formatCurrency(p.selling_price)}
                    </td>

                    {/* Giá sàn */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ color: isDark ? '#34d399' : '#047857', fontWeight: 600 }}>{formatCurrency(p.floor_price)}</div>
                      <div style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '1px' }}>Ngưỡng duyệt chiết khấu</div>
                    </td>

                    {/* Giá vốn: Chỉ hiển thị khi isDirector */}
                    {isDirector && (
                      <td
                        style={{
                          padding: '14px 16px',
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fefce8',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ color: isDark ? '#fbbf24' : '#b45309', fontWeight: 600 }}>
                          {formatCurrency(p.cost_price)}
                        </span>
                      </td>
                    )}

                    {/* Báo giá liên kết */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          backgroundColor: isDark
                            ? hasQuotes
                              ? 'rgba(37, 99, 235, 0.2)'
                              : '#1e293b'
                            : hasQuotes
                            ? '#eff6ff'
                            : '#f1f5f9',
                          color: isDark
                            ? hasQuotes
                              ? '#93c5fd'
                              : '#94a3b8'
                            : hasQuotes
                            ? '#1d4ed8'
                            : '#64748b',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.quote_count} báo giá
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: isDark
                            ? p.is_active
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(245, 158, 11, 0.18)'
                            : p.is_active
                            ? '#dcfce7'
                            : '#fef3c7',
                          color: isDark
                            ? p.is_active
                              ? '#86efac'
                              : '#fde68a'
                            : p.is_active
                            ? '#15803d'
                            : '#b45309',
                          border: `1px solid ${
                            isDark
                              ? p.is_active
                                ? 'rgba(16, 185, 129, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)'
                              : p.is_active
                              ? '#86efac'
                              : '#fde68a'
                          }`,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.is_active ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Nút sửa */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          style={{
                            padding: '5px 7px',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                            borderRadius: '5px',
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            color: isDark ? '#60a5fa' : '#2563eb',
                            cursor: 'pointer',
                          }}
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Nút chuyển đổi trạng thái kinh doanh: đứng im, không bật lên đầu trang */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(e, p)}
                          style={{
                            padding: '5px 7px',
                            border: `1px solid ${
                              isDark
                                ? p.is_active
                                  ? 'rgba(245, 158, 11, 0.3)'
                                  : 'rgba(16, 185, 129, 0.3)'
                                : '#e2e8f0'
                            }`,
                            borderRadius: '5px',
                            backgroundColor: isDark
                              ? p.is_active
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)'
                              : p.is_active
                              ? '#fffbeb'
                              : '#f0fdf4',
                            color: isDark
                              ? p.is_active
                                ? '#fbbf24'
                                : '#4ade80'
                              : p.is_active
                              ? '#d97706'
                              : '#16a34a',
                            cursor: 'pointer',
                          }}
                          title={
                            p.is_active
                              ? 'Chuyển sang trạng thái Ngừng kinh doanh'
                              : 'Kích hoạt kinh doanh trở lại'
                          }
                        >
                          {p.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>

                        {/* Nút xóa: Dùng ConfirmModal */}
                        <button
                          type="button"
                          onClick={(e) => handleClickDelete(e, p)}
                          disabled={hasQuotes}
                          style={{
                            padding: '5px 7px',
                            border: '1px solid',
                            borderColor: hasQuotes
                              ? isDark
                                ? '#334155'
                                : '#e2e8f0'
                              : isDark
                              ? '#7f1d1d'
                              : '#fecaca',
                            borderRadius: '5px',
                            backgroundColor: hasQuotes
                              ? isDark
                                ? '#1e293b'
                                : '#f8fafc'
                              : isDark
                              ? '#1e293b'
                              : '#ffffff',
                            color: hasQuotes
                              ? isDark
                                ? '#64748b'
                                : '#94a3b8'
                              : isDark
                              ? '#f87171'
                              : '#dc2626',
                            cursor: hasQuotes ? 'not-allowed' : 'pointer',
                            opacity: hasQuotes ? 0.6 : 1,
                          }}
                          title={
                            hasQuotes
                              ? `Không được xóa: Đã có ${p.quote_count} báo giá liên kết. Chỉ được chuyển sang "Ngừng kinh doanh".`
                              : 'Xóa sản phẩm'
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Chỉnh sửa Sản phẩm: Form rộng rãi 680px, căn thẳng hàng ngang và dọc tuyệt đối */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? '#111827' : '#ffffff',
              borderRadius: '10px',
              border: isDark ? '1px solid #1e293b' : 'none',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: isDark
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {editingProduct ? 'Chỉnh sửa Sản phẩm / Dịch vụ' : 'Khai báo Sản phẩm / Dịch vụ Mới'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  Quản lý thông tin và chính sách giá theo quy định công ty
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Hàng 1: Mã SKU & Tên sản phẩm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label style={labelStyle}>Mã sản phẩm (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ví dụ: PRD-101"
                    style={standardInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tên sản phẩm & dịch vụ *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: NexusCRM Enterprise..."
                    style={standardInputStyle}
                  />
                </div>
              </div>

              {/* Hàng 2: Loại sản phẩm & Nhóm danh mục (Căn thẳng hàng ngang) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label style={labelStyle}>Loại sản phẩm *</label>
                  <CustomSelect
                    value={formData.product_type}
                    onChange={(val) => setFormData({ ...formData, product_type: val })}
                    options={formTypeOptions}
                    height="38px"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Nhóm danh mục *</label>
                  <CustomSelect
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={formCategoryOptions}
                    height="38px"
                  />
                </div>
              </div>

              {/* Hàng 3: Đơn vị tính & Trạng thái kinh doanh (Căn thẳng hàng ngang) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label style={labelStyle}>Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Ví dụ: Gói/Năm, Buổi, License..."
                    style={standardInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Trạng thái kinh doanh</label>
                  <CustomSelect
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(val) => setFormData({ ...formData, is_active: val === 'active' })}
                    options={formStatusOptions}
                    height="38px"
                  />
                </div>
              </div>

              {/* Hàng 4: Giá bán niêm yết & Giá sàn (Căn thẳng hàng ngang 100%, không bị xô lệch) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label style={labelStyle}>Giá bán niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Nhập giá bán niêm yết..."
                    style={standardInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Giá sàn (VNĐ - Ngưỡng duyệt chiết khấu) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={formData.floor_price}
                    onChange={(e) => setFormData({ ...formData, floor_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Nhập giá sàn..."
                    style={{
                      ...standardInputStyle,
                      border:
                        formData.floor_price !== '' && formData.selling_price !== '' && formData.floor_price > formData.selling_price
                          ? '1px solid #f59e0b'
                          : standardInputStyle.border,
                    }}
                  />
                  {formData.floor_price !== '' && formData.selling_price !== '' && formData.floor_price > formData.selling_price && (
                    <div style={{ fontSize: '0.72rem', color: isDark ? '#fde68a' : '#b45309', marginTop: '3px' }}>
                      ⚠️ Giá sàn đang cao hơn giá niêm yết
                    </div>
                  )}
                </div>
              </div>

              {/* Hàng 5: Giá vốn (Chỉ Giám Đốc Kinh Doanh) */}
              {isDirector ? (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fefce8',
                    border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#fef08a'}`,
                    borderRadius: '6px',
                  }}
                >
                  <label
                    style={{
                      ...labelStyle,
                      color: isDark ? '#fbbf24' : '#b45309',
                      gap: '4px',
                    }}
                  >
                    <Lock size={13} />
                    Giá vốn (VNĐ) - Quyền Giám đốc kinh doanh
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Nhập giá vốn (chỉ Giám đốc được xem & sửa)..."
                    style={{
                      ...standardInputStyle,
                      border: isDark ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #fde047',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: isDark ? '#161f30' : '#f8fafc',
                    border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    color: isDark ? '#94a3b8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={14} color={isDark ? '#64748b' : '#94a3b8'} />
                  <span>Trường Giá vốn (Cost Price) được bảo mật, chỉ Giám đốc kinh doanh có quyền xem và sửa.</span>
                </div>
              )}

              {/* Mô tả chi tiết: Kéo dãn theo chiều dọc với minHeight và maxHeight */}
              <div>
                <label style={labelStyle}>Mô tả sản phẩm / dịch vụ</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập thông tin chi tiết giải pháp, tính năng nổi bật..."
                  style={{
                    width: '100%',
                    minHeight: '65px',
                    maxHeight: '160px',
                    resize: 'vertical',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                    lineHeight: '1.45',
                  }}
                />
              </div>

              {/* Nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    fontSize: '0.82rem',
                    color: isDark ? '#cbd5e1' : '#334155',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    height: '38px',
                    padding: '0 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bảng giá (Price Lists) */}
      <PriceListModal
        isOpen={isPriceListOpen}
        onClose={() => setIsPriceListOpen(false)}
        isDirector={isDirector}
        products={products}
        onToast={addToast}
      />

      {/* In-app Confirm Modal xóa sản phẩm (thay thế hoàn toàn window.confirm) */}
      <ConfirmModal
        isOpen={productToDelete !== null}
        title="Xác nhận xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${productToDelete?.name}" (${productToDelete?.sku})? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy bỏ"
        isDanger={true}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />

      {/* In-app Confirm Modal cảnh báo giá sàn (thay thế window.confirm) */}
      <ConfirmModal
        isOpen={isFloorWarningOpen}
        title="Cảnh báo kiểm duyệt giá sàn"
        message="Giá sàn bạn nhập đang cao hơn Giá bán niêm yết. Mọi báo giá áp dụng giá chuẩn sẽ luôn bị cảnh báo cần duyệt chiết khấu. Bạn có chắc chắn muốn tiếp tục lưu sản phẩm này?"
        confirmLabel="Vẫn lưu"
        cancelLabel="Kiểm tra lại"
        isDanger={false}
        onConfirm={executeSaveProduct}
        onCancel={() => setIsFloorWarningOpen(false)}
      />

      {/* Thông báo Toast ở góc dưới bên phải màn hình (hiệu ứng mờ dần khi hiện và biến mất) */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};
