import React, { useState, useEffect } from 'react';
import { X, Plus, Check, AlertCircle, Tag } from 'lucide-react';
import { IPriceList } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

interface IPriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceListModal: React.FC<IPriceListModalProps> = ({ isOpen, onClose }) => {
  const [priceLists, setPriceLists] = useState<IPriceList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [multiplier, setMultiplier] = useState('1.0');
  const [description, setDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPriceLists = async () => {
    setIsLoading(true);
    try {
      const data = await sprint2Service.getPriceLists();
      setPriceLists(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh sách bảng giá.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPriceLists();
      setShowCreateForm(false);
      setStatusMsg(null);
    }
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sprint2Service.createPriceList({
        name,
        code: code.toUpperCase().trim(),
        multiplier: parseFloat(multiplier) || 1.0,
        description,
        is_active: true,
      });
      setStatusMsg({ type: 'success', text: 'Tạo bảng giá mới thành công!' });
      setName('');
      setCode('');
      setMultiplier('1.0');
      setDescription('');
      setShowCreateForm(false);
      fetchPriceLists();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi tạo bảng giá.';
      setStatusMsg({ type: 'error', text: errorMsg });
    }
  };

  if (!isOpen) return null;

  return (
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
          maxWidth: '650px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={20} color="#2563eb" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Quản lý Bảng giá Sản phẩm
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Cấu hình hệ số nhân chiết khấu và bảng giá phân khúc
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {statusMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '0.8rem',
              }}
            >
              {statusMsg.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              Danh sách Bảng giá hiện hành ({priceLists.length})
            </span>
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Thêm bảng giá
              </button>
            )}
          </div>

          {/* Form thêm bảng giá */}
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              style={{
                padding: '14px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tên bảng giá *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bảng giá Doanh nghiệp Lớn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mã bảng giá *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PL-ENTERPRISE"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Hệ số giá (Multiplier) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    required
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mô tả phân khúc
                  </label>
                  <input
                    type="text"
                    placeholder="Áp dụng cho KH mua số lượng lớn hoặc đối tác vàng"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Lưu bảng giá
                </button>
              </div>
            </form>
          )}

          {/* Table Price Lists */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '8px 12px', color: '#64748b' }}>Mã bảng giá</th>
                  <th style={{ padding: '8px 12px', color: '#64748b' }}>Tên bảng giá</th>
                  <th style={{ padding: '8px 12px', color: '#64748b' }}>Hệ số</th>
                  <th style={{ padding: '8px 12px', color: '#64748b' }}>Mô tả</th>
                  <th style={{ padding: '8px 12px', color: '#64748b' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      Đang nạp dữ liệu...
                    </td>
                  </tr>
                ) : priceLists.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có bảng giá nào.
                    </td>
                  </tr>
                ) : (
                  priceLists.map((pl) => (
                    <tr key={pl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#2563eb' }}>{pl.code}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 500, color: '#1e293b' }}>{pl.name}</td>
                      <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 600 }}>{pl.multiplier}x</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{pl.description || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: pl.is_active ? '#dcfce7' : '#f1f5f9',
                            color: pl.is_active ? '#15803d' : '#64748b',
                          }}
                        >
                          {pl.is_active ? 'Đang áp dụng' : 'Tạm dừng'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
