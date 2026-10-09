import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { IProduct } from '../../interfaces';
import { useAuth } from '../../hooks/useAuth';
import { sprint2Service } from '../../services/sprint2Service';
import { PriceListModal } from './PriceListModal';

export const ProductList: React.FC = () => {
  const { user } = useAuth();
  const isDirector =
    user?.role?.toLowerCase() === 'director' ||
    user?.role?.toLowerCase() === 'admin' ||
    user?.role?.toLowerCase() === 'system_admin' ||
    user?.role?.toLowerCase() === 'giam_doc';

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);

  // Modal thêm/sửa sản phẩm
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Phần mềm CRM',
    description: '',
    selling_price: 1000000,
    cost_price: 500000,
    unit: 'Gói/Năm',
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const data = await sprint2Service.getProducts({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setProducts(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh sách sản phẩm.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sku: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Phần mềm CRM',
      description: '',
      selling_price: 10000000,
      cost_price: 6000000,
      unit: 'Gói/Năm',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: IProduct) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description || '',
      selling_price: p.selling_price,
      cost_price: p.cost_price || 0,
      unit: p.unit,
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await sprint2Service.updateProduct(editingProduct.id, {
          ...formData,
          code: formData.sku,
          selling_price: Number(formData.selling_price),
          cost_price: isDirector ? Number(formData.cost_price) : undefined,
        });
        setStatusMsg({ type: 'success', text: 'Cập nhật thông tin sản phẩm thành công!' });
      } else {
        await sprint2Service.createProduct({
          ...formData,
          code: formData.sku,
          selling_price: Number(formData.selling_price),
          cost_price: isDirector ? Number(formData.cost_price) : 0,
        });
        setStatusMsg({ type: 'success', text: 'Thêm mới sản phẩm thành công!' });
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi lưu sản phẩm.';
      setStatusMsg({ type: 'error', text: errorMsg });
    }
  };

  // S2-05: Prevent deletion if product has quotes
  const handleDelete = async (p: IProduct) => {
    if (p.quote_count > 0) {
      setStatusMsg({
        type: 'error',
        text: `Không thể xóa "${p.name}" vì đã có ${p.quote_count} báo giá / hợp đồng tham chiếu đến sản phẩm này.`,
      });
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.name}" (${p.sku})?`)) {
      return;
    }

    try {
      await sprint2Service.deleteProduct(p.id);
      setStatusMsg({ type: 'success', text: 'Đã xóa sản phẩm thành công.' });
      fetchProducts();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi xóa sản phẩm.';
      setStatusMsg({
        type: 'error',
        text: errorMsg,
      });
    }
  };

  const formatCurrency = (val?: number | null) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top action bar */}
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
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '8px' }} />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">Tất cả nhóm sản phẩm</option>
            <option value="Phần mềm CRM">Phần mềm CRM</option>
            <option value="Dịch vụ Đào tạo & Onboarding">Dịch vụ Onboarding</option>
            <option value="Gói Hạ tầng">Gói Hạ tầng</option>
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
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            <Tag size={13} />
            Bảng giá (Price Lists)
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '6px',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.82rem',
          }}
        >
          {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Product Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Mã SKU</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Tên sản phẩm & dịch vụ</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Nhóm</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>ĐVT</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Giá bán (Niêm yết)</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Giá vốn (Cost Price)
                  {!isDirector && (
                    <span title="Chỉ Giám Đốc mới được xem">
                      <Lock size={12} color="#94a3b8" />
                    </span>
                  )}
                </span>
              </th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Báo giá liên kết</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải danh mục sản phẩm...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Không tìm thấy sản phẩm nào.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{p.sku}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>
                    <div>{p.name}</div>
                    {p.description && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.description}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{p.category}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.unit}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                    {formatCurrency(p.selling_price)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {isDirector && p.cost_price !== undefined && p.cost_price !== null ? (
                      <span style={{ color: '#b45309', fontWeight: 600 }}>
                        {formatCurrency(p.cost_price)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Lock size={11} /> Ẩn (Quyền Giám Đốc)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: p.quote_count > 0 ? '#eff6ff' : '#f1f5f9',
                        color: p.quote_count > 0 ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {p.quote_count} báo giá
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        style={{
                          padding: '4px',
                          border: 'none',
                          background: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                        }}
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete button (disabled if quote_count > 0) */}
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        disabled={p.quote_count > 0}
                        style={{
                          padding: '4px',
                          border: 'none',
                          background: 'none',
                          color: p.quote_count > 0 ? '#cbd5e1' : '#dc2626',
                          cursor: p.quote_count > 0 ? 'not-allowed' : 'pointer',
                        }}
                        title={
                          p.quote_count > 0
                            ? 'Không thể xóa sản phẩm đã có báo giá liên kết'
                            : 'Xóa sản phẩm'
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Product */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
              maxWidth: '540px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm mới Sản phẩm'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mã SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Nhóm sản phẩm
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="Phần mềm CRM">Phần mềm CRM</option>
                    <option value="Dịch vụ Đào tạo & Onboarding">Dịch vụ Onboarding</option>
                    <option value="Gói Hạ tầng">Gói Hạ tầng</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Đơn vị tính (ĐVT)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Giá bán niêm yết (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Giá vốn (VNĐ) {isDirector ? '' : '(Chỉ Giám Đốc)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isDirector}
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      backgroundColor: !isDirector ? '#f1f5f9' : '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price list modal */}
      <PriceListModal isOpen={isPriceListOpen} onClose={() => setIsPriceListOpen(false)} />
    </div>
  );
};
