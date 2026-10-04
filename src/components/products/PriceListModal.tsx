import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Check, AlertCircle, Tag, Calculator, ShieldCheck, Lock, AlertTriangle, Layers } from 'lucide-react';
import { IPriceList, IProduct } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

interface IPriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDirector: boolean;
  products: IProduct[];
}

export const PriceListModal: React.FC<IPriceListModalProps> = ({
  isOpen,
  onClose,
  isDirector,
  products,
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'matrix'>('lists');
  const [priceLists, setPriceLists] = useState<IPriceList[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [multiplier, setMultiplier] = useState<string>('0.85');
  const [description, setDescription] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPriceLists = async () => {
    setIsLoading(true);
    try {
      const data = await sprint2Service.getPriceLists();
      setPriceLists(data);
      if (data.length > 0 && !selectedPriceListId) {
        setSelectedPriceListId(data[0].id);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh sách bảng giá từ máy chủ.' });
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sprint2Service.createPriceList({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        multiplier: parseFloat(multiplier) || 1.0,
        description: description.trim(),
        is_active: true,
      });
      setStatusMsg({ type: 'success', text: `Tạo bảng giá "${name}" thành công!` });
      setName('');
      setCode('');
      setMultiplier('0.85');
      setDescription('');
      setShowCreateForm(false);
      fetchPriceLists();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tạo bảng giá.';
      setStatusMsg({ type: 'error', text: message });
    }
  };

  const selectedPriceList = useMemo(() => {
    return priceLists.find((pl) => pl.id === selectedPriceListId) || priceLists[0];
  }, [priceLists, selectedPriceListId]);

  const formatCurrency = (val?: number | null): string => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
          borderRadius: '10px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={20} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Quản lý Bảng giá Niêm Yết & Giá Sàn (Price Lists - S2-05)
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Hỗ trợ nhân viên kinh doanh tạo báo giá chuẩn xác theo chính sách giá và kiểm soát giá sàn công ty
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
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher & Director indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('lists')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                border: 'none',
                borderBottom: activeTab === 'lists' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'lists' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'lists' ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <Layers size={15} />
              Danh sách Bảng giá ({priceLists.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                border: 'none',
                borderBottom: activeTab === 'matrix' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'matrix' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'matrix' ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <Calculator size={15} />
              Ma trận Giá & Kiểm soát Giá sàn (Matrix Simulation)
            </button>
          </div>

          {/* Role badge indicator (Image 4) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: isDirector ? '#fef3c7' : '#f1f5f9',
              color: isDirector ? '#b45309' : '#475569',
              border: `1px solid ${isDirector ? '#fde68a' : '#e2e8f0'}`,
            }}
          >
            {isDirector ? <ShieldCheck size={13} /> : <Lock size={13} />}
            <span>{isDirector ? 'Quyền Giám đốc: Hiện Giá vốn' : 'Quyền Nhân viên: Ẩn cột Giá vốn'}</span>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {statusMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '0.82rem',
              }}
            >
              {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: Danh sách Bảng giá */}
          {activeTab === 'lists' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  Các bảng giá phân khúc đã ban hành
                </span>
                {!showCreateForm && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
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
                    <Plus size={14} /> Thêm bảng giá mới
                  </button>
                )}
              </div>

              {/* Form Thêm Bảng giá */}
              {showCreateForm && (
                <form
                  onSubmit={handleCreate}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Tên bảng giá *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Bảng giá Đối tác Chiến Lược..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
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
                        placeholder="PL-PARTNER"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Hệ số giá (Multiplier) *
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="3.0"
                        required
                        value={multiplier}
                        onChange={(e) => setMultiplier(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Mô tả áp dụng đối tượng
                    </label>
                    <input
                      type="text"
                      placeholder="Áp dụng chiết khấu cho khách hàng khối cơ quan nhà nước, đối tác vàng..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      style={{
                        padding: '6px 12px',
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
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Lưu Bảng Giá
                    </button>
                  </div>
                </form>
              )}

              {/* Bảng liệt kê Price Lists */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Mã bảng giá</th>
                      <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Tên bảng giá</th>
                      <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Hệ số giá</th>
                      <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Tỷ lệ chiết khấu</th>
                      <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Mô tả</th>
                      <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Trạng thái</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>
                        Ma trận giá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                          Đang nạp danh sách bảng giá...
                        </td>
                      </tr>
                    ) : priceLists.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                          Chưa có bảng giá nào. Hãy nhấn "Thêm bảng giá mới" để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      priceLists.map((pl) => {
                        const discountPercent = Math.round((1 - pl.multiplier) * 100);
                        return (
                          <tr key={pl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{pl.code}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>{pl.name}</td>
                            <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 700 }}>
                              {pl.multiplier}x
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: discountPercent > 0 ? '#eff6ff' : '#f1f5f9',
                                  color: discountPercent > 0 ? '#1d4ed8' : '#64748b',
                                }}
                              >
                                {discountPercent > 0
                                  ? `Giảm ${discountPercent}%`
                                  : discountPercent < 0
                                  ? `Tăng ${Math.abs(discountPercent)}%`
                                  : 'Giá gốc niêm yết'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>{pl.description || '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
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
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPriceListId(pl.id);
                                  setActiveTab('matrix');
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  color: '#2563eb',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Xem ma trận
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Ma trận giá sản phẩm theo bảng giá & Kiểm soát Giá sàn (SCRUM-84) */}
          {activeTab === 'matrix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Chọn Bảng giá mô phỏng */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    Chọn bảng giá áp dụng:
                  </label>
                  <select
                    value={selectedPriceList?.id || ''}
                    onChange={(e) => setSelectedPriceListId(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '5px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                    }}
                  >
                    {priceLists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} ({pl.code}) - Hệ số {pl.multiplier}x
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPriceList && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>
                      Hệ số nhân: <strong style={{ color: '#0f172a' }}>{selectedPriceList.multiplier}x</strong>
                    </span>
                    <span style={{ color: '#64748b' }}>
                      Chiết khấu tương ứng:{' '}
                      <strong style={{ color: '#2563eb' }}>
                        {Math.round((1 - selectedPriceList.multiplier) * 100)}%
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Giải thích quy tắc giá sàn SCRUM-84 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.75rem',
                  color: '#1e40af',
                }}
              >
                <AlertTriangle size={15} color="#2563eb" />
                <span>
                  <strong>Nguyên tắc Giá sàn (SCRUM-84):</strong> Nếu giá sau chiết khấu của bảng giá &lt; Giá sàn của
                  sản phẩm, hệ thống sẽ cảnh báo <em>"Cần duyệt chiết khấu do thấp hơn giá sàn"</em> để ngăn chặn việc
                  tự ý bán phá giá.
                </span>
              </div>

              {/* Bảng Ma trận Giá Sản Phẩm */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Mã SKU</th>
                      <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Tên sản phẩm</th>
                      <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Loại</th>
                      <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>ĐVT</th>
                      <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Giá niêm yết</th>
                      <th style={{ padding: '10px 12px', color: '#2563eb', fontWeight: 700 }}>
                        Giá áp dụng ({selectedPriceList?.multiplier || 1.0}x)
                      </th>
                      <th style={{ padding: '10px 12px', color: '#047857', fontWeight: 600 }}>Giá sàn</th>

                      {/* TASK S2-05 / IMAGE 4: Ẩn cột "Giá vốn" (Cost Price) qua điều kiện role Director */}
                      {isDirector && (
                        <th
                          style={{
                            padding: '10px 12px',
                            color: '#b45309',
                            backgroundColor: '#fefce8',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Lock size={12} /> Giá vốn
                          </span>
                        </th>
                      )}

                      <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>
                        Kiểm soát chính sách giá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isDirector ? 9 : 8}
                          style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}
                        >
                          Không có dữ liệu sản phẩm.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const multiplierVal = selectedPriceList ? selectedPriceList.multiplier : 1.0;
                        const appliedPrice = Math.round(p.selling_price * multiplierVal);
                        const isBelowFloor = appliedPrice < p.floor_price;

                        return (
                          <tr
                            key={p.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: isBelowFloor ? '#fffbeb' : '#ffffff',
                            }}
                          >
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2563eb' }}>{p.sku}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1e293b' }}>{p.name}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  backgroundColor: p.product_type === 'subscription' ? '#ecfeff' : '#eff6ff',
                                  color: p.product_type === 'subscription' ? '#0e7490' : '#1d4ed8',
                                }}
                              >
                                {p.product_type === 'subscription' ? 'Thuê bao' : 'Một lần'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.unit}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>
                              {formatCurrency(p.selling_price)}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1d4ed8' }}>
                              {formatCurrency(appliedPrice)}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#047857', fontWeight: 600 }}>
                              {formatCurrency(p.floor_price)}
                            </td>

                            {/* Cột Giá vốn: Ẩn nếu không phải Director (Image 4) */}
                            {isDirector && (
                              <td style={{ padding: '10px 12px', backgroundColor: '#fefce8' }}>
                                <span style={{ color: '#b45309', fontWeight: 600 }}>
                                  {formatCurrency(p.cost_price)}
                                </span>
                              </td>
                            )}

                            {/* Kiểm duyệt Giá sàn SCRUM-84 */}
                            <td style={{ padding: '10px 12px' }}>
                              {isBelowFloor ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fca5a5',
                                  }}
                                  title={`Giá áp dụng (${formatCurrency(appliedPrice)}) thấp hơn giá sàn (${formatCurrency(p.floor_price)}). Báo giá này bắt buộc cần Giám đốc phê duyệt chiết khấu.`}
                                >
                                  <AlertCircle size={12} /> Cần duyệt CK (&lt; Giá sàn)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #86efac',
                                  }}
                                >
                                  <Check size={12} /> Hợp lệ (≥ Giá sàn)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 500,
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
