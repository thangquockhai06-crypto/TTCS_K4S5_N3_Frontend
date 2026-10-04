import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Check,
  Tag,
  Calculator,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { IPriceList, IProduct } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';

interface IPriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDirector: boolean;
  products: IProduct[];
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const PriceListModal: React.FC<IPriceListModalProps> = ({
  isOpen,
  onClose,
  isDirector,
  products,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'matrix'>('lists');
  const [priceLists, setPriceLists] = useState<IPriceList[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Chỉnh sửa bảng giá
  const [editingPriceList, setEditingPriceList] = useState<IPriceList | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [multiplier, setMultiplier] = useState<string>('0.85');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchPriceLists = async () => {
    setIsLoading(true);
    try {
      const data = await sprint2Service.getPriceLists();
      setPriceLists(data);
      if (data.length > 0 && !selectedPriceListId) {
        setSelectedPriceListId(data[0].id);
      }
    } catch {
      onToast?.('Không thể tải danh sách bảng giá từ máy chủ.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPriceLists();
      setShowCreateForm(false);
      setEditingPriceList(null);
    }
  }, [isOpen]);

  const handleOpenCreate = () => {
    setEditingPriceList(null);
    setName('');
    setCode('');
    setMultiplier('0.85');
    setDescription('');
    setIsActive(true);
    setShowCreateForm(true);
  };

  const handleOpenEdit = (pl: IPriceList) => {
    setEditingPriceList(pl);
    setName(pl.name);
    setCode(pl.code);
    setMultiplier(pl.multiplier.toString());
    setDescription(pl.description || '');
    setIsActive(pl.is_active);
    setShowCreateForm(true);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingPriceList(null);
    setName('');
    setCode('');
    setMultiplier('0.85');
    setDescription('');
    setIsActive(true);
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingPriceList) {
        await sprint2Service.updatePriceList(editingPriceList.id, {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          multiplier: parseFloat(multiplier) || 1.0,
          description: description.trim(),
          is_active: isActive,
        });
        onToast?.(`Đã cập nhật bảng giá "${name}" thành công!`, 'success');
      } else {
        await sprint2Service.createPriceList({
          name: name.trim(),
          code: code.toUpperCase().trim(),
          multiplier: parseFloat(multiplier) || 1.0,
          description: description.trim(),
          is_active: isActive,
        });
        onToast?.(`Đã thêm mới bảng giá "${name}" thành công!`, 'success');
      }
      handleCancelForm();
      fetchPriceLists();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu bảng giá.';
      onToast?.(message, 'error');
    }
  };

  const handleDeletePriceList = async (pl: IPriceList) => {
    const confirmed = window.confirm(
      `Xác nhận xóa: Bạn có chắc chắn muốn xóa bảng giá "${pl.name}" (${pl.code})? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      const res = await sprint2Service.deletePriceList(pl.id);
      onToast?.(res.message || `Đã xóa bảng giá "${pl.name}" thành công!`, 'success');
      fetchPriceLists();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa bảng giá.';
      onToast?.(message, 'error');
    }
  };

  const selectedPriceList = useMemo(() => {
    return priceLists.find((pl) => pl.id === selectedPriceListId) || priceLists[0];
  }, [priceLists, selectedPriceListId]);

  const priceListSelectOptions: ICustomSelectOption[] = useMemo(() => {
    return priceLists.map((pl) => ({
      value: pl.id,
      label: `${pl.name} (${pl.code}) - Hệ số ${pl.multiplier}x`,
    }));
  }, [priceLists]);

  const formStatusOptions: ICustomSelectOption<'active' | 'inactive'>[] = [
    { value: 'active', label: 'Đang áp dụng' },
    { value: 'inactive', label: 'Tạm dừng áp dụng' },
  ];

  const formatCurrency = (val?: number | null): string => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Đồng bộ style input 100% với ảnh giá sàn
  const standardInputStyle: React.CSSProperties = {
    width: '100%',
    height: '38px',
    padding: '0 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
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
          maxWidth: '960px',
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
                Quản lý Bảng giá Niêm Yết & Giá Sàn (Price Lists)
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

        {/* Tab Switcher & Indicator */}
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
                padding: '11px 16px',
                border: 'none',
                borderBottom: activeTab === 'lists' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'lists' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'lists' ? 600 : 500,
                fontSize: '0.84rem',
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
                padding: '11px 16px',
                border: 'none',
                borderBottom: activeTab === 'matrix' ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'matrix' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'matrix' ? 600 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <Calculator size={15} />
              Ma trận Giá & Kiểm soát Giá sàn (Matrix Simulation)
            </button>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 600,
              backgroundColor: isDirector ? '#fef3c7' : '#f1f5f9',
              color: isDirector ? '#b45309' : '#475569',
              border: `1px solid ${isDirector ? '#fde68a' : '#e2e8f0'}`,
            }}
          >
            {isDirector ? <ShieldCheck size={14} /> : <Lock size={14} />}
            <span>{isDirector ? 'Quyền Giám đốc: Hiện Giá vốn' : 'Quyền Nhân viên: Ẩn Giá vốn'}</span>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* TAB 1: Danh sách Bảng giá (Hỗ trợ Thêm, Sửa, Xóa đầy đủ) */}
          {activeTab === 'lists' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  Các bảng giá phân khúc đã ban hành
                </span>
                {!showCreateForm && (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '36px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} /> Thêm bảng giá mới
                  </button>
                )}
              </div>

              {/* Form Thêm / Chỉnh sửa Bảng giá */}
              {showCreateForm && (
                <form
                  onSubmit={handleSubmitForm}
                  style={{
                    padding: '18px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {editingPriceList ? `Chỉnh sửa Bảng giá: ${editingPriceList.name}` : 'Thêm Bảng giá Mới'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Tên bảng giá *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Bảng giá Đối tác Chiến Lược..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={standardInputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Mã bảng giá *</label>
                      <input
                        type="text"
                        required
                        placeholder="PL-PARTNER"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={standardInputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Hệ số giá (Multiplier) *</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="3.0"
                        required
                        value={multiplier}
                        onChange={(e) => setMultiplier(e.target.value)}
                        style={standardInputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Mô tả áp dụng đối tượng</label>
                      <input
                        type="text"
                        placeholder="Áp dụng chiết khấu cho khách hàng khối doanh nghiệp, đối tác vàng..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={standardInputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Trạng thái áp dụng</label>
                      <CustomSelect
                        value={isActive ? 'active' : 'inactive'}
                        onChange={(val) => setIsActive(val === 'active')}
                        options={formStatusOptions}
                        height="38px"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.8rem',
                        color: '#334155',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      style={{
                        height: '36px',
                        padding: '0 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {editingPriceList ? 'Lưu thay đổi' : 'Tạo bảng giá'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bảng Danh sách Bảng giá: Thêm nút Sửa, Xóa */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Mã bảng giá
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>
                        Tên bảng giá
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Hệ số giá
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Tỷ lệ chiết khấu
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>
                        Mô tả
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Trạng thái
                      </th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                          Đang nạp danh sách bảng giá...
                        </td>
                      </tr>
                    ) : priceLists.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                          Chưa có bảng giá nào. Hãy nhấn "Thêm bảng giá mới" để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      priceLists.map((pl) => {
                        const discountPercent = Math.round((1 - pl.multiplier) * 100);
                        return (
                          <tr key={pl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                              {pl.code}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 500, color: '#1e293b' }}>
                              {pl.name}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {pl.multiplier}x
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: discountPercent > 0 ? '#eff6ff' : '#f1f5f9',
                                  color: discountPercent > 0 ? '#1d4ed8' : '#64748b',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {discountPercent > 0
                                  ? `Giảm ${discountPercent}%`
                                  : discountPercent < 0
                                  ? `Tăng ${Math.abs(discountPercent)}%`
                                  : 'Giá gốc niêm yết'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748b' }}>{pl.description || '—'}</td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: pl.is_active ? '#dcfce7' : '#f1f5f9',
                                  color: pl.is_active ? '#15803d' : '#64748b',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {pl.is_active ? 'Đang áp dụng' : 'Tạm dừng'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {/* Nút xem ma trận */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPriceListId(pl.id);
                                    setActiveTab('matrix');
                                  }}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '5px',
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

                                {/* Nút sửa bảng giá */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(pl)}
                                  style={{
                                    padding: '5px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '5px',
                                    backgroundColor: '#ffffff',
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                  }}
                                  title="Chỉnh sửa bảng giá"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {/* Nút xóa bảng giá */}
                                <button
                                  type="button"
                                  onClick={() => handleDeletePriceList(pl)}
                                  style={{
                                    padding: '5px',
                                    border: '1px solid #fecaca',
                                    borderRadius: '5px',
                                    backgroundColor: '#ffffff',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                  }}
                                  title="Xóa bảng giá"
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
            </div>
          )}

          {/* TAB 2: Ma trận giá sản phẩm theo bảng giá & Kiểm soát Giá sàn */}
          {activeTab === 'matrix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Chọn Bảng giá mô phỏng (CustomSelect) */}
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
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                    Chọn bảng giá áp dụng:
                  </label>
                  <div style={{ width: '320px', maxWidth: '100%' }}>
                    <CustomSelect
                      value={selectedPriceList?.id || ''}
                      onChange={(val) => setSelectedPriceListId(val)}
                      options={priceListSelectOptions}
                      height="38px"
                    />
                  </div>
                </div>

                {selectedPriceList && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
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

              {/* Giải thích quy tắc giá sàn */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.78rem',
                  color: '#1e40af',
                }}
              >
                <AlertTriangle size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Nguyên tắc Giá sàn:</strong> Nếu giá sau chiết khấu của bảng giá &lt; Giá sàn của
                  sản phẩm, hệ thống sẽ cảnh báo <em>"Cần duyệt chiết khấu do thấp hơn giá sàn"</em> để ngăn chặn việc
                  tự ý bán phá giá.
                </span>
              </div>

              {/* Bảng Ma trận Giá Sản Phẩm: Rõ ràng, không ngắt quãng chữ */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Mã SKU
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, minWidth: '200px' }}>
                        Tên sản phẩm
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Loại sản phẩm
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Đơn vị tính
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Giá niêm yết
                      </th>
                      <th style={{ padding: '12px 14px', color: '#2563eb', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        Giá áp dụng ({selectedPriceList?.multiplier || 1.0}x)
                      </th>
                      <th style={{ padding: '12px 14px', color: '#047857', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Giá sàn
                      </th>

                      {/* Ẩn cột "Giá vốn" (Cost Price) qua điều kiện role Director */}
                      {isDirector && (
                        <th
                          style={{
                            padding: '12px 14px',
                            color: '#b45309',
                            backgroundColor: '#fefce8',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={13} /> Giá vốn
                          </span>
                        </th>
                      )}

                      <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Kiểm soát chính sách giá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isDirector ? 9 : 8}
                          style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}
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
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                              {p.sku}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 500, color: '#1e293b' }}>
                              {p.name}
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: p.product_type === 'subscription' ? '#ecfeff' : '#eff6ff',
                                  color: p.product_type === 'subscription' ? '#0e7490' : '#1d4ed8',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.product_type === 'subscription' ? 'Dịch vụ thuê bao' : 'Sản phẩm một lần'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {p.unit}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {formatCurrency(p.selling_price)}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                              {formatCurrency(appliedPrice)}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#047857', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {formatCurrency(p.floor_price)}
                            </td>

                            {/* Cột Giá vốn: Ẩn nếu không phải Director */}
                            {isDirector && (
                              <td style={{ padding: '12px 14px', backgroundColor: '#fefce8', whiteSpace: 'nowrap' }}>
                                <span style={{ color: '#b45309', fontWeight: 600 }}>
                                  {formatCurrency(p.cost_price)}
                                </span>
                              </td>
                            )}

                            {/* Kiểm duyệt Giá sàn */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              {isBelowFloor ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 9px',
                                    borderRadius: '4px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fca5a5',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`Giá áp dụng (${formatCurrency(appliedPrice)}) thấp hơn giá sàn (${formatCurrency(p.floor_price)}). Báo giá này bắt buộc cần Giám đốc phê duyệt chiết khấu.`}
                                >
                                  <AlertCircle size={13} /> Cần duyệt chiết khấu (&lt; Giá sàn)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 9px',
                                    borderRadius: '4px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #86efac',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Check size={13} /> Hợp lệ (≥ Giá sàn)
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
              height: '36px',
              padding: '0 18px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.84rem',
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
