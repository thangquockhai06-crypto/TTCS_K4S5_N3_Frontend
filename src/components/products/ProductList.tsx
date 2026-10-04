import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  Lock,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
  UserCheck,
  PowerOff,
  Power,
  Info,
} from 'lucide-react';
import { IProduct, IProductFormData, ProductType } from '../../interfaces';
import { useAuthorization } from '../../hooks/useAuthorization';
import { sprint2Service } from '../../services/sprint2Service';
import { PriceListModal } from './PriceListModal';

export const ProductList: React.FC = () => {
  const { isDirector: authIsDirector } = useAuthorization();

  // Cho phép kiểm thử linh hoạt vai trò: mặc định theo quyền auth, có nút switch để tester kiểm thử nhanh
  const [overrideDirector, setOverrideDirector] = useState<boolean | null>(null);
  const isDirector = overrideDirector !== null ? overrideDirector : authIsDirector;

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPriceListOpen, setIsPriceListOpen] = useState<boolean>(false);

  // Modal thêm/sửa sản phẩm
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState<IProductFormData>({
    sku: '',
    name: '',
    category: 'Phần mềm CRM',
    product_type: 'subscription',
    description: '',
    selling_price: 10000000,
    floor_price: 8000000,
    cost_price: 5000000,
    unit: 'Gói/Năm',
    is_active: true,
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sprint2Service.getProducts({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        product_type: typeFilter !== 'all' ? typeFilter : undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });
      setProducts(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh sách sản phẩm từ hệ thống.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, typeFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sku: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Phần mềm CRM',
      product_type: 'subscription',
      description: '',
      selling_price: 10000000,
      floor_price: 8000000,
      cost_price: 5000000,
      unit: 'Gói/Năm',
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
      cost_price: p.cost_price ?? 0,
      unit: p.unit,
      is_active: p.is_active,
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ràng buộc kiểm tra tính hợp lệ cơ bản
    if (formData.floor_price > formData.selling_price) {
      const confirmSave = window.confirm(
        'CẢNH BÁO: Giá sàn đang cao hơn Giá bán niêm yết. Báo giá tiêu chuẩn sẽ luôn bị cảnh báo cần duyệt chiết khấu. Bạn có chắc muốn lưu?'
      );
      if (!confirmSave) return;
    }

    try {
      if (editingProduct) {
        await sprint2Service.updateProduct(editingProduct.id, {
          ...formData,
          selling_price: Number(formData.selling_price),
          floor_price: Number(formData.floor_price),
          cost_price: isDirector ? Number(formData.cost_price) : editingProduct.cost_price,
        });
        setStatusMsg({ type: 'success', text: `Cập nhật sản phẩm "${formData.name}" thành công!` });
      } else {
        await sprint2Service.createProduct({
          ...formData,
          selling_price: Number(formData.selling_price),
          floor_price: Number(formData.floor_price),
          cost_price: isDirector ? Number(formData.cost_price) : 0,
        });
        setStatusMsg({ type: 'success', text: `Thêm mới sản phẩm "${formData.name}" thành công!` });
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu sản phẩm.';
      setStatusMsg({ type: 'error', text: message });
    }
  };

  // S2-05 / SCRUM-84: Ràng buộc xóa sản phẩm
  // Sản phẩm đã phát sinh báo giá (quote_count > 0) KHÔNG ĐƯỢC XÓA, chỉ chuyển trạng thái Ngừng kinh doanh
  const handleDelete = async (p: IProduct) => {
    if (p.quote_count > 0) {
      setStatusMsg({
        type: 'warning',
        text: `RÀNG BUỘC CHÍNH SÁCH (SCRUM-84): Không thể xóa sản phẩm "${p.name}" (${p.sku}) vì đã phát sinh ${p.quote_count} báo giá / hợp đồng. Bạn chỉ có thể chuyển sang trạng thái "Ngừng kinh doanh".`,
      });
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận xóa: Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${p.name}" (${p.sku})? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      const res = await sprint2Service.deleteProduct(p.id);
      setStatusMsg({ type: 'success', text: res.message || `Đã xóa sản phẩm "${p.name}" thành công.` });
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa sản phẩm.';
      setStatusMsg({ type: 'error', text: message });
    }
  };

  // Chuyển đổi trạng thái Ngừng kinh doanh / Kích hoạt lại
  const handleToggleStatus = async (p: IProduct) => {
    try {
      const updated = await sprint2Service.toggleProductActive(p.id);
      const actionText = updated.is_active ? 'Kích hoạt kinh doanh lại' : 'Chuyển sang Ngừng kinh doanh';
      setStatusMsg({
        type: 'success',
        text: `Đã ${actionText.toLowerCase()} cho sản phẩm "${p.name}" (${p.sku}).`,
      });
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái.';
      setStatusMsg({ type: 'error', text: message });
    }
  };

  const formatCurrency = (val?: number | null): string => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Thống kê nhanh danh mục
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const discontinued = total - active;
    const withQuotes = products.filter((p) => p.quote_count > 0).length;
    return { total, active, discontinued, withQuotes };
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Thanh chuyển đổi vai trò kiểm thử nhanh (Image 4 Role Director Condition) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: isDirector ? '#f0fdf4' : '#f8fafc',
          borderRadius: '8px',
          border: `1px solid ${isDirector ? '#bbf7d0' : '#e2e8f0'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDirector ? (
            <ShieldCheck size={18} color="#15803d" />
          ) : (
            <UserCheck size={18} color="#475569" />
          )}
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isDirector ? '#166534' : '#334155' }}>
              Chế độ phân quyền: {isDirector ? 'Giám đốc kinh doanh (Director)' : 'Nhân viên kinh doanh (Sales Rep)'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
              {isDirector
                ? '• Hiển thị cột Giá vốn (Cost Price) & cho phép quản lý toàn quyền'
                : '• Đã ẨN hoàn toàn cột Giá vốn (Cost Price) theo quy định bảo mật SCRUM-84'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Chuyển vai trò test:</span>
          <button
            type="button"
            onClick={() => setOverrideDirector(true)}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: isDirector ? '1px solid #16a34a' : '1px solid #cbd5e1',
              backgroundColor: isDirector ? '#16a34a' : '#ffffff',
              color: isDirector ? '#ffffff' : '#334155',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👑 Giám đốc (Director)
          </button>
          <button
            type="button"
            onClick={() => setOverrideDirector(false)}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: !isDirector ? '1px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: !isDirector ? '#2563eb' : '#ffffff',
              color: !isDirector ? '#ffffff' : '#334155',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👤 Nhân viên (Sales Rep)
          </button>
          {overrideDirector !== null && (
            <button
              type="button"
              onClick={() => setOverrideDirector(null)}
              style={{
                padding: '4px 8px',
                borderRadius: '5px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
              title="Đặt lại theo quyền đăng nhập thực tế"
            >
              Mặc định
            </button>
          )}
        </div>
      </div>

      {/* Top action & Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
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
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '9px' }} />
          </div>

          {/* Lọc loại sản phẩm (SCRUM-84: one_off vs subscription) */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">Tất cả loại sản phẩm</option>
            <option value="subscription">Dịch vụ thuê bao</option>
            <option value="one_off">Sản phẩm một lần</option>
          </select>

          {/* Lọc nhóm */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">Tất cả nhóm</option>
            <option value="Phần mềm CRM">Phần mềm CRM</option>
            <option value="Dịch vụ Đào tạo & Onboarding">Dịch vụ Onboarding</option>
            <option value="Gói Hạ tầng">Gói Hạ tầng</option>
          </select>

          {/* Lọc trạng thái kinh doanh */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">Tất cả trạng thái ({stats.total})</option>
            <option value="active">Đang kinh doanh ({stats.active})</option>
            <option value="discontinued">Ngừng kinh doanh ({stats.discontinued})</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsPriceListOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Tag size={14} color="#2563eb" />
            Bảng giá (Price Lists)
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Plus size={15} />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {statusMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor:
              statusMsg.type === 'success'
                ? '#f0fdf4'
                : statusMsg.type === 'warning'
                ? '#fffbeb'
                : '#fef2f2',
            border: `1px solid ${
              statusMsg.type === 'success'
                ? '#bbf7d0'
                : statusMsg.type === 'warning'
                ? '#fde68a'
                : '#fecaca'
            }`,
            borderRadius: '6px',
            color:
              statusMsg.type === 'success'
                ? '#166534'
                : statusMsg.type === 'warning'
                ? '#92400e'
                : '#991b1b',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusMsg.type === 'success' ? (
              <Check size={16} />
            ) : statusMsg.type === 'warning' ? (
              <Info size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Bảng Danh mục Sản phẩm & Dịch vụ */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Mã SKU</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Tên sản phẩm & dịch vụ</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Loại</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Nhóm</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>ĐVT</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Giá niêm yết</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Giá sàn
                  <span
                    title="Ngưỡng giá xác định báo giá có cần duyệt chiết khấu hay không (nếu giá bán < giá sàn)"
                    style={{ cursor: 'help', color: '#94a3b8' }}
                  >
                    ⓘ
                  </span>
                </span>
              </th>

              {/* TASK S2-05 / IMAGE 4: Ẩn cột "Giá vốn" (Cost Price) qua điều kiện role Director */}
              {isDirector && (
                <th
                  style={{
                    padding: '11px 14px',
                    color: '#b45309',
                    backgroundColor: '#fefce8',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} />
                    Giá vốn (Director)
                  </span>
                </th>
              )}

              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Báo giá liên kết</th>
              <th style={{ padding: '11px 14px', color: '#64748b', fontWeight: 600 }}>Trạng thái</th>
              <th style={{ padding: '11px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={isDirector ? 11 : 10}
                  style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}
                >
                  Đang tải danh mục sản phẩm & dịch vụ...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={isDirector ? 11 : 10}
                  style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}
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
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: p.is_active ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {/* SKU */}
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#2563eb' }}>{p.sku}</td>

                    {/* Name & Description */}
                    <td style={{ padding: '11px 14px', fontWeight: 500, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{p.name}</span>
                        {!p.is_active && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              fontWeight: 600,
                            }}
                          >
                            Đã ngừng KD
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {p.description}
                        </div>
                      )}
                    </td>

                    {/* Product Type (SCRUM-84: one_off vs subscription) */}
                    <td style={{ padding: '11px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: isSubscription ? '#ecfeff' : '#eff6ff',
                          color: isSubscription ? '#0e7490' : '#1d4ed8',
                          border: `1px solid ${isSubscription ? '#a5f3fc' : '#bfdbfe'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSubscription ? 'Dịch vụ thuê bao' : 'Sản phẩm một lần'}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '11px 14px', color: '#475569' }}>{p.category}</td>

                    {/* Unit */}
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{p.unit}</td>

                    {/* Selling Price */}
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(p.selling_price)}
                    </td>

                    {/* Floor Price (Giá sàn duyệt chiết khấu) */}
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ color: '#047857', fontWeight: 600 }}>{formatCurrency(p.floor_price)}</span>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Ngưỡng duyệt CK</div>
                    </td>

                    {/* Cost Price: Chỉ hiển thị khi isDirector (Image 4) */}
                    {isDirector && (
                      <td style={{ padding: '11px 14px', backgroundColor: '#fefce8' }}>
                        <span style={{ color: '#b45309', fontWeight: 600 }}>
                          {formatCurrency(p.cost_price)}
                        </span>
                      </td>
                    )}

                    {/* Linked Quotes Count */}
                    <td style={{ padding: '11px 14px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: hasQuotes ? '#eff6ff' : '#f1f5f9',
                          color: hasQuotes ? '#1d4ed8' : '#64748b',
                        }}
                      >
                        {p.quote_count} báo giá
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '11px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: p.is_active ? '#dcfce7' : '#fef3c7',
                          color: p.is_active ? '#15803d' : '#b45309',
                          border: `1px solid ${p.is_active ? '#86efac' : '#fde68a'}`,
                        }}
                      >
                        {p.is_active ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Nút sửa */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          style={{
                            padding: '4px 6px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            color: '#2563eb',
                            cursor: 'pointer',
                          }}
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Nút chuyển đổi trạng thái Ngừng kinh doanh / Kích hoạt lại */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          style={{
                            padding: '4px 6px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            backgroundColor: p.is_active ? '#fffbeb' : '#f0fdf4',
                            color: p.is_active ? '#d97706' : '#16a34a',
                            cursor: 'pointer',
                          }}
                          title={
                            p.is_active
                              ? 'Chuyển sang trạng thái Ngừng kinh doanh'
                              : 'Kích hoạt kinh doanh trở lại'
                          }
                        >
                          {p.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>

                        {/* Nút xóa: Ràng buộc SCRUM-84 nếu quote_count > 0 thì KHÔNG ĐƯỢC XÓA */}
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          disabled={hasQuotes}
                          style={{
                            padding: '4px 6px',
                            border: '1px solid',
                            borderColor: hasQuotes ? '#e2e8f0' : '#fecaca',
                            borderRadius: '4px',
                            backgroundColor: hasQuotes ? '#f8fafc' : '#ffffff',
                            color: hasQuotes ? '#94a3b8' : '#dc2626',
                            cursor: hasQuotes ? 'not-allowed' : 'pointer',
                            opacity: hasQuotes ? 0.6 : 1,
                          }}
                          title={
                            hasQuotes
                              ? `Không được xóa: Đã có ${p.quote_count} báo giá liên kết (SCRUM-84). Chỉ được chuyển sang "Ngừng kinh doanh".`
                              : 'Xóa sản phẩm'
                          }
                        >
                          <Trash2 size={13} />
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

      {/* Modal Thêm / Chỉnh sửa Sản phẩm */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {editingProduct ? 'Chỉnh sửa Sản phẩm / Dịch vụ' : 'Khai báo Sản phẩm / Dịch vụ Mới (S2-05)'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Tuân thủ các trường thông tin và ràng buộc nghiệp vụ SCRUM-84
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Hàng 1: Mã SKU & Tên sản phẩm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mã sản phẩm (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PRD-101"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tên sản phẩm & dịch vụ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="NexusCRM Enterprise..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Hàng 2: Loại sản phẩm (SCRUM-84) & Nhóm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Loại sản phẩm (SCRUM-84) *
                  </label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value as ProductType })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="subscription">Dịch vụ thuê bao (Subscription)</option>
                    <option value="one_off">Sản phẩm một lần (One-off)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Nhóm danh mục *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Phần mềm CRM">Phần mềm CRM</option>
                    <option value="Dịch vụ Đào tạo & Onboarding">Dịch vụ Đào tạo & Onboarding</option>
                    <option value="Gói Hạ tầng">Gói Hạ tầng</option>
                  </select>
                </div>
              </div>

              {/* Hàng 3: Đơn vị tính (ĐVT) & Trạng thái kinh doanh */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Đơn vị tính (ĐVT) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Gói/Năm, Buổi, License..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Trạng thái kinh doanh
                  </label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="active">Đang kinh doanh</option>
                    <option value="inactive">Ngừng kinh doanh</option>
                  </select>
                </div>
              </div>

              {/* Hàng 4: Giá bán niêm yết & Giá sàn (Floor price) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Giá bán niêm yết (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {formatCurrency(formData.selling_price)}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Giá sàn (VNĐ - Ngưỡng duyệt CK) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={formData.floor_price}
                    onChange={(e) => setFormData({ ...formData, floor_price: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border:
                        formData.floor_price > formData.selling_price
                          ? '1px solid #f59e0b'
                          : '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.7rem', color: '#047857' }}>
                    {formatCurrency(formData.floor_price)}
                  </div>
                  {formData.floor_price > formData.selling_price && (
                    <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '2px' }}>
                      ⚠️ Giá sàn đang cao hơn giá niêm yết
                    </div>
                  )}
                </div>
              </div>

              {/* Hàng 5: Giá vốn (Cost Price) - Chỉ Giám Đốc Kinh Doanh (SCRUM-84 Image 2 & 4) */}
              {isDirector ? (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fef08a',
                    borderRadius: '6px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#b45309',
                      marginBottom: '4px',
                    }}
                  >
                    <Lock size={12} />
                    Giá vốn (VNĐ) - Quyền Giám đốc kinh doanh
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.cost_price ?? ''}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    placeholder="Chỉ Director được xem và cấu hình..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: '1px solid #fde047',
                      fontSize: '0.82rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '3px' }}>
                    {formatCurrency(formData.cost_price)} (Nhân viên kinh doanh sẽ không nhìn thấy trường này)
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={13} color="#94a3b8" />
                  <span>Trường Giá vốn (Cost Price) được bảo mật, chỉ Giám đốc kinh doanh có quyền xem và sửa.</span>
                </div>
              )}

              {/* Mô tả chi tiết */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Mô tả sản phẩm / dịch vụ
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập thông tin chi tiết giải pháp, tính năng nổi bật..."
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.8rem',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 16px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.8rem',
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
      />
    </div>
  );
};
