import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { ICategory } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { useToast } from '../../context/ToastContext';

export const CategoryManager: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'lead_source' | 'industry'>('lead_source');
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form add/edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICategory | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sprint2Service.getCategories(activeTab);
      setCategories(data);
    } catch {
      showToast('error', 'Không thể tải danh mục.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ICategory) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await sprint2Service.updateCategory(editingItem.id, {
          name,
          code: code.toUpperCase().trim(),
        });
        showToast('success', `Cập nhật danh mục "${name.trim()}" thành công!`);
      } else {
        await sprint2Service.createCategory({
          type: activeTab,
          name,
          code: code.toUpperCase().trim(),
          order_index: categories.length,
        });
        showToast('success', `Thêm mới danh mục "${name.trim()}" thành công!`);
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Lỗi lưu danh mục.')
          : 'Lỗi lưu danh mục.';
      showToast('error', errorMsg);
    }
  };

  const handleDelete = async (item: ICategory) => {
    if (item.usage_count > 0) {
      showToast('error', `Không thể xóa "${item.name}" vì đang được sử dụng bởi ${item.usage_count} khách hàng.`);
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa "${item.name}"?`)) return;

    try {
      await sprint2Service.deleteCategory(item.id);
      showToast('success', `Đã xóa danh mục "${item.name}" thành công.`);
      fetchCategories();
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Lỗi khi xóa danh mục.')
          : 'Lỗi khi xóa danh mục.';
      showToast('error', errorMsg);
    }
  };

  // Reorder
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    setCategories(newCategories);

    try {
      await sprint2Service.reorderCategories(newCategories.map((c) => c.id));
      showToast('success', 'Đã cập nhật thứ tự hiển thị danh mục.');
    } catch {
      showToast('error', 'Lỗi sắp xếp lại thứ tự.');
      fetchCategories();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', margin: 0, lineHeight: 1.3 }}>
          Danh mục dùng chung hệ thống
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #64748b)', marginTop: '4px', lineHeight: 1.5 }}>
          Quản lý nguồn khách hàng và ngành nghề kinh doanh, hỗ trợ sắp xếp thứ tự và kiểm soát ràng buộc dữ liệu
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('lead_source')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'lead_source' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'lead_source' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Nguồn khách hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('industry')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'industry' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'industry' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Lĩnh vực / Ngành nghề
        </button>
      </div>

      {/* Table & actions */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            {activeTab === 'lead_source' ? 'Các kênh nguồn khách hàng' : 'Các ngành nghề doanh nghiệp'} ({categories.length})
          </span>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Thêm danh mục
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '10px 14px', width: '70px', color: '#64748b' }}>Thứ tự</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Mã định danh</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Tên danh mục hiển thị</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Lượng tham chiếu sử dụng</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Đang nạp danh mục...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Chưa có mục nào trong danh mục này.
                </td>
              </tr>
            ) : (
              categories.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === 0 ? '#cbd5e1' : '#64748b',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                        title="Đẩy lên trên"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === categories.length - 1 ? '#cbd5e1' : '#64748b',
                          cursor: idx === categories.length - 1 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                        title="Đẩy xuống dưới"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>{idx + 1}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{item.code}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: item.usage_count > 0 ? '#eff6ff' : '#f1f5f9',
                        color: item.usage_count > 0 ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {item.usage_count} khách hàng
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete button (disabled if usage_count > 0) */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={item.usage_count > 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: item.usage_count > 0 ? '#cbd5e1' : '#dc2626',
                          cursor: item.usage_count > 0 ? 'not-allowed' : 'pointer',
                          padding: '4px',
                        }}
                        title={
                          item.usage_count > 0
                            ? 'Không thể xóa mục đang được sử dụng'
                            : 'Xóa mục này'
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
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
              border: '1px solid #e2e8f0',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {editingItem ? 'Chỉnh sửa Danh mục' : 'Thêm mới Danh mục'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'inline-flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                  Tên hiển thị <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'lead_source' ? 'Hội chợ Triển lãm' : 'Tài chính Công nghệ'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                  Mã định danh <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EXHIBITION"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
