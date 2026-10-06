import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Swords,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { IWinLossReason, ICompetitor } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

export const WinLossConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reasons' | 'competitors'>('reasons');
  const [resultTypeFilter, setResultTypeFilter] = useState<'all' | 'WON' | 'LOST'>('all');

  // Reasons state
  const [reasons, setReasons] = useState<IWinLossReason[]>([]);
  const [competitors, setCompetitors] = useState<ICompetitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal reason
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<IWinLossReason | null>(null);
  const [reasonResultType, setReasonResultType] = useState<'WON' | 'LOST'>('WON');
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [reasonDesc, setReasonDesc] = useState('');

  // Modal competitor
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<ICompetitor | null>(null);
  const [compName, setCompName] = useState('');
  const [compStrengths, setCompStrengths] = useState('');
  const [compWeaknesses, setCompWeaknesses] = useState('');
  const [compPricingTier, setCompPricingTier] = useState('Trung cấp');
  const [compWinRate, setCompWinRate] = useState(50);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'reasons') {
        const data = await sprint2Service.getWinLossReasons(
          resultTypeFilter !== 'all' ? resultTypeFilter : undefined
        );
        setReasons(data);
      } else {
        const data = await sprint2Service.getCompetitors();
        setCompetitors(data);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Không thể tải dữ liệu cấu hình.' });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, resultTypeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reason handlers
  const handleOpenCreateReason = () => {
    setEditingReason(null);
    setReasonResultType('WON');
    setReasonCode('');
    setReasonText('');
    setReasonDesc('');
    setIsReasonModalOpen(true);
  };

  const handleOpenEditReason = (r: IWinLossReason) => {
    setEditingReason(r);
    setReasonResultType(r.result_type);
    setReasonCode(r.code);
    setReasonText(r.reason);
    setReasonDesc(r.description || '');
    setIsReasonModalOpen(true);
  };

  const handleSubmitReason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReason) {
        await sprint2Service.updateWinLossReason(editingReason.id, {
          reason: reasonText,
          description: reasonDesc,
        });
        setStatusMsg({ type: 'success', text: 'Cập nhật lý do thành công!' });
      } else {
        await sprint2Service.createWinLossReason({
          result_type: reasonResultType,
          code: reasonCode.toUpperCase().trim(),
          reason: reasonText,
          description: reasonDesc,
        });
        setStatusMsg({ type: 'success', text: 'Thêm mới lý do thành công!' });
      }
      setIsReasonModalOpen(false);
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi lưu lý do.' });
    }
  };

  const handleDeleteReason = async (r: IWinLossReason) => {
    if (!window.confirm(`Xóa lý do "${r.reason}"?`)) return;
    try {
      await sprint2Service.deleteWinLossReason(r.id);
      setStatusMsg({ type: 'success', text: 'Đã xóa lý do thành công.' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi khi xóa lý do.' });
    }
  };

  // Competitor handlers
  const handleOpenCreateCompetitor = () => {
    setEditingCompetitor(null);
    setCompName('');
    setCompStrengths('');
    setCompWeaknesses('');
    setCompPricingTier('Trung cấp');
    setCompWinRate(50);
    setIsCompetitorModalOpen(true);
  };

  const handleOpenEditCompetitor = (c: ICompetitor) => {
    setEditingCompetitor(c);
    setCompName(c.name);
    setCompStrengths(c.strengths || '');
    setCompWeaknesses(c.weaknesses || '');
    setCompPricingTier(c.pricing_tier || 'Trung cấp');
    setCompWinRate(c.win_rate || 50);
    setIsCompetitorModalOpen(true);
  };

  const handleSubmitCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompetitor) {
        await sprint2Service.updateCompetitor(editingCompetitor.id, {
          name: compName,
          strengths: compStrengths,
          weaknesses: compWeaknesses,
          pricing_tier: compPricingTier,
          win_rate: Number(compWinRate),
        });
        setStatusMsg({ type: 'success', text: 'Cập nhật đối thủ cạnh tranh thành công!' });
      } else {
        await sprint2Service.createCompetitor({
          name: compName,
          strengths: compStrengths,
          weaknesses: compWeaknesses,
          pricing_tier: compPricingTier,
          win_rate: Number(compWinRate),
        });
        setStatusMsg({ type: 'success', text: 'Thêm mới đối thủ cạnh tranh thành công!' });
      }
      setIsCompetitorModalOpen(false);
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi lưu đối thủ.' });
    }
  };

  const handleDeleteCompetitor = async (c: ICompetitor) => {
    if (!window.confirm(`Xóa đối thủ cạnh tranh "${c.name}"?`)) return;
    try {
      await sprint2Service.deleteCompetitor(c.id);
      setStatusMsg({ type: 'success', text: 'Đã xóa đối thủ thành công.' });
      fetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi khi xóa đối thủ.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Lý do Thắng/Thua & Đối thủ cạnh tranh (Win/Loss Config - S2-10)
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
          Chuẩn hóa các nguyên nhân Thắng (WON) hoặc Thất bại (LOST) và theo dõi điểm mạnh yếu của đối thủ cạnh tranh trực tiếp trên thị trường
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('reasons')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'reasons' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'reasons' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Trophy size={14} /> Lý do Thắng / Thua (Win/Loss Reasons)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('competitors')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'competitors' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'competitors' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Swords size={14} /> Đối thủ Cạnh tranh (Competitors)
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

      {/* Tab 1: Win/Loss Reasons */}
      {activeTab === 'reasons' && (
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
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setResultTypeFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: resultTypeFilter === 'all' ? '#2563eb' : '#ffffff',
                  color: resultTypeFilter === 'all' ? '#ffffff' : '#334155',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Tất cả ({reasons.length})
              </button>
              <button
                type="button"
                onClick={() => setResultTypeFilter('WON')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: resultTypeFilter === 'WON' ? '#16a34a' : '#ffffff',
                  color: resultTypeFilter === 'WON' ? '#ffffff' : '#334155',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Thành công (WON)
              </button>
              <button
                type="button"
                onClick={() => setResultTypeFilter('LOST')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: resultTypeFilter === 'LOST' ? '#dc2626' : '#ffffff',
                  color: resultTypeFilter === 'LOST' ? '#ffffff' : '#334155',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Thất bại (LOST)
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateReason}
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
              <Plus size={14} /> Thêm lý do
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 14px', width: '100px', color: '#64748b' }}>Phân loại</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Mã định danh (Code)</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Nguyên nhân chi tiết</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Ghi chú giải thích</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : reasons.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có lý do nào.
                  </td>
                </tr>
              ) : (
                reasons.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: r.result_type === 'WON' ? '#dcfce7' : '#fee2e2',
                          color: r.result_type === 'WON' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {r.result_type === 'WON' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {r.result_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#334155' }}>{r.code}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>{r.reason}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.description || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReason(r)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReason(r)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
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
      )}

      {/* Tab 2: Competitors */}
      {activeTab === 'competitors' && (
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
              Danh sách đối thủ cạnh tranh thị trường ({competitors.length})
            </span>
            <button
              type="button"
              onClick={handleOpenCreateCompetitor}
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
              <Plus size={14} /> Thêm đối thủ
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Tên đối thủ</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Phân khúc giá</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Điểm mạnh (Strengths)</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Điểm yếu (Weaknesses)</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Tỷ lệ thắng khi đối đầu</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Đang nạp đối thủ...
                  </td>
                </tr>
              ) : competitors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có đối thủ cạnh tranh nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                competitors.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{c.pricing_tier || 'Trung cấp'}</td>
                    <td style={{ padding: '10px 14px', color: '#166534', fontSize: '0.78rem' }}>{c.strengths || '-'}</td>
                    <td style={{ padding: '10px 14px', color: '#991b1b', fontSize: '0.78rem' }}>{c.weaknesses || '-'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{c.win_rate}%</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCompetitor(c)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCompetitor(c)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
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
      )}

      {/* Modal Reason */}
      {isReasonModalOpen && (
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
              maxWidth: '460px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingReason ? 'Chỉnh sửa Lý do Thắng/Thua' : 'Thêm mới Lý do Thắng/Thua (S2-10)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsReasonModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReason} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!editingReason && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Loại kết quả (Result Type) *
                  </label>
                  <select
                    value={reasonResultType}
                    onChange={(e) => setReasonResultType(e.target.value as any)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="WON">Thành công (WON)</option>
                    <option value="LOST">Thất bại (LOST)</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Lý do chi tiết *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Khách hàng chọn vì chính sách bảo hành 24/7"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              {!editingReason && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mã lý do (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="W_WARRANTY"
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Mô tả / Hướng dẫn phân loại
                </label>
                <textarea
                  rows={2}
                  value={reasonDesc}
                  onChange={(e) => setReasonDesc(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsReasonModalOpen(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu lý do
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Competitor */}
      {isCompetitorModalOpen && (
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
              maxWidth: '460px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingCompetitor ? 'Chỉnh sửa Đối thủ' : 'Thêm mới Đối thủ Cạnh tranh'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCompetitorModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCompetitor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Tên đối thủ cạnh tranh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Salesforce CRM / HubSpot"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Phân khúc giá
                  </label>
                  <select
                    value={compPricingTier}
                    onChange={(e) => setCompPricingTier(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="Cao cấp">Cao cấp (Premium)</option>
                    <option value="Trung cấp">Trung cấp (Mid-tier)</option>
                    <option value="Giá rẻ">Giá rẻ (Low-cost)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tỷ lệ thắng ước tính (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={compWinRate}
                    onChange={(e) => setCompWinRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Điểm mạnh cạnh tranh của họ
                </label>
                <textarea
                  rows={2}
                  placeholder="Hệ sinh thái rộng lớn, thương hiệu toàn cầu"
                  value={compStrengths}
                  onChange={(e) => setCompStrengths(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Điểm yếu / Nhược điểm của họ
                </label>
                <textarea
                  rows={2}
                  placeholder="Chi phí triển khai rất cao, hỗ trợ địa phương hạn chế"
                  value={compWeaknesses}
                  onChange={(e) => setCompWeaknesses(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCompetitorModalOpen(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu đối thủ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
