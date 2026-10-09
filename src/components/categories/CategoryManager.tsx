import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { ICategory } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

export const CategoryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lead_source' | 'industry'>('lead_source');
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form add/edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICategory | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const data = await sprint2Service.getCategories(activeTab);
      setCategories(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh mục.' });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

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
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedCode = code.toUpperCase().trim();

    if (!trimmedName || !trimmedCode) {
      setStatusMsg({ type: 'error', text: 'Vui lòng điền đầy đủ Tên và Mã danh mục.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      if (editingItem) {
        await sprint2Service.updateCategory(editingItem.id, {
          name: trimmedName,
          code: trimmedCode,
        });
        setStatusMsg({ type: 'success', text: `Cập nhật danh mục "${trimmedName}" thành công!` });
      } else {
        await sprint2Service.createCategory({
          type: activeTab,
          name: trimmedName,
          code: trimmedCode,
          order_index: categories.length,
        });
        setStatusMsg({ type: 'success', text: `Thêm mới danh mục "${trimmedName}" thành công!` });
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi lưu danh mục.';
      setStatusMsg({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // S2-07: Prevent deletion if usage_count > 0
  const handleDelete = async (item: ICategory) => {
    if (isSubmitting) return;

    if (item.usage_count > 0) {
      setStatusMsg({
        type: 'error',
        text: `Không thể xóa "${item.name}" vì đang được sử dụng bởi ${item.usage_count} khách hàng / giao dịch.`,
      });
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa "${item.name}"?`)) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await sprint2Service.deleteCategory(item.id);
      setStatusMsg({ type: 'success', text: `Đã xóa danh mục "${item.name}" thành công!` });
      fetchCategories();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi xóa danh mục.';
      setStatusMsg({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reorder
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (isSubmitting) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    setCategories(newCategories);

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await sprint2Service.reorderCategories(newCategories.map((c) => c.id));
      setStatusMsg({ type: 'success', text: 'Cập nhật thứ tự sắp xếp danh mục thành công!' });
      fetchCategories();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi sắp xếp lại thứ tự danh mục.';
      setStatusMsg({ type: 'error', text: errorMsg });
      fetchCategories();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Danh mục dùng chung hệ thống
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
          Quản lý nguồn khách hàng (Lead Source) và Ngành nghề kinh doanh (Industry), hỗ trợ kéo thả/sắp xếp thứ tự và kiểm soát ràng buộc dữ liệu
        </p>
      </div>

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
          Nguồn khách hàng (Lead Sources)
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
          Lĩnh vực / Ngành nghề (Industries)
        </button>
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
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Mã định danh (Code)</th>
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
                        disabled={idx === 0 || isSubmitting}
                        onClick={() => handleMove(idx, 'up')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === 0 || isSubmitting ? '#cbd5e1' : '#64748b',
                          cursor: idx === 0 || isSubmitting ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                        title="Đẩy lên trên"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1 || isSubmitting}
                        onClick={() => handleMove(idx, 'down')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === categories.length - 1 || isSubmitting ? '#cbd5e1' : '#64748b',
                          cursor: idx === categories.length - 1 || isSubmitting ? 'default' : 'pointer',
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
                        disabled={isSubmitting}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete button (disabled if usage_count > 0) */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={item.usage_count > 0 || isSubmitting}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: item.usage_count > 0 || isSubmitting ? '#cbd5e1' : '#dc2626',
                          cursor: item.usage_count > 0 || isSubmitting ? 'not-allowed' : 'pointer',
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
              width: '100%',
              maxWidth: '440px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingItem ? 'Chỉnh sửa Mục danh mục' : 'Thêm mới Mục danh mục'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Tên hiển thị *
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'lead_source' ? 'Hội chợ Triển lãm' : 'Tài chính Công nghệ'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Mã danh mục (Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EXHIBITION"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
