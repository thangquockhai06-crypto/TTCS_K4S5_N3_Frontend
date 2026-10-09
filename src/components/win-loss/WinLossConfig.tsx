import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Swords,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  X,
  TrendingDown,
} from 'lucide-react';
import { IWinLossReason, ICompetitor } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { showGlobalToast } from '../../context/ToastContext';

export const WinLossConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WON' | 'LOST' | 'competitors'>('WON');

  // Reasons state
  const [reasons, setReasons] = useState<IWinLossReason[]>([]);
  const [competitors, setCompetitors] = useState<ICompetitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal reason
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<IWinLossReason | null>(null);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [reasonDesc, setReasonDesc] = useState('');

  // Modal competitor
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<ICompetitor | null>(null);
  const [compName, setCompName] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compStrengths, setCompStrengths] = useState('');
  const [compWeaknesses, setCompWeaknesses] = useState('');
  const [compWinRate, setCompWinRate] = useState(50);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'WON' || activeTab === 'LOST') {
        const data = await sprint2Service.getWinLossReasons(activeTab);
        setReasons(data);
      } else {
        const data = await sprint2Service.getCompetitors();
        setCompetitors(data);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải dữ liệu cấu hình.' });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reason handlers
  const handleOpenCreateReason = () => {
    setEditingReason(null);
    const prefix = activeTab === 'WON' ? 'WIN_' : 'LOSS_';
    setReasonCode(`${prefix}${Math.floor(100 + Math.random() * 900)}`);
    setReasonText('');
    setReasonDesc('');
    setIsReasonModalOpen(true);
  };

  const handleOpenEditReason = (r: IWinLossReason) => {
    setEditingReason(r);
    setReasonCode(r.code);
    setReasonText(r.reason);
    setReasonDesc(r.description || '');
    setIsReasonModalOpen(true);
  };

  const handleSubmitReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedText = reasonText.trim();
    const trimmedCode = reasonCode.trim().toUpperCase();

    if (!trimmedText) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập nội dung lý do.' });
      return;
    }

    if (!editingReason && !trimmedCode) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập mã định danh lý do.' });
      return;
    }

    // Check duplicate on frontend
    if (!editingReason) {
      const isDuplicateCode = reasons.some((r) => r.code.toUpperCase() === trimmedCode);
      if (isDuplicateCode) {
        setStatusMsg({ type: 'error', text: `Mã lý do "${trimmedCode}" đã tồn tại trong danh sách.` });
        return;
      }
      const isDuplicateText = reasons.some((r) => r.reason.trim().toLowerCase() === trimmedText.toLowerCase());
      if (isDuplicateText) {
        setStatusMsg({ type: 'error', text: `Lý do "${trimmedText}" đã tồn tại trong danh sách.` });
        return;
      }
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      if (editingReason) {
        await sprint2Service.updateWinLossReason(editingReason.id, {
          reason: trimmedText,
          description: reasonDesc.trim() || undefined,
        });
        const msg = `Cập nhật lý do "${trimmedText}" thành công!`;
        setStatusMsg({ type: 'success', text: msg });
        showGlobalToast(msg, 'success');
      } else {
        await sprint2Service.createWinLossReason({
          result_type: activeTab === 'WON' ? 'WON' : 'LOST',
          code: trimmedCode,
          reason: trimmedText,
          description: reasonDesc.trim() || undefined,
        });
        const typeName = activeTab === 'WON' ? 'Thành công (Win)' : 'Thất bại (Loss)';
        const msg = `Thêm mới lý do ${typeName} "${trimmedText}" thành công!`;
        setStatusMsg({ type: 'success', text: msg });
        showGlobalToast(msg, 'success');
      }
      setIsReasonModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi lưu lý do.';
      setStatusMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReason = async (r: IWinLossReason) => {
    if (isSubmitting) return;
    if (!window.confirm(`Bạn có chắc muốn xóa lý do "${r.reason}"?`)) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await sprint2Service.deleteWinLossReason(r.id);
      const msg = `Đã xóa lý do "${r.reason}" thành công.`;
      setStatusMsg({ type: 'success', text: msg });
      showGlobalToast(msg, 'success');
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi xóa lý do.';
      setStatusMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Competitor handlers
  const handleOpenCreateCompetitor = () => {
    setEditingCompetitor(null);
    setCompName('');
    setCompWebsite('');
    setCompStrengths('');
    setCompWeaknesses('');
    setCompWinRate(50);
    setIsCompetitorModalOpen(true);
  };

  const handleOpenEditCompetitor = (c: ICompetitor) => {
    setEditingCompetitor(c);
    setCompName(c.name);
    setCompWebsite(c.website || '');
    setCompStrengths(c.strengths || '');
    setCompWeaknesses(c.weaknesses || '');
    setCompWinRate(c.win_rate || 50);
    setIsCompetitorModalOpen(true);
  };

  const handleSubmitCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = compName.trim();
    if (!trimmedName) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập tên đối thủ cạnh tranh.' });
      showGlobalToast('Vui lòng nhập tên đối thủ cạnh tranh.', 'warning');
      return;
    }

    if (!editingCompetitor && competitors.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      const err = `Đối thủ "${trimmedName}" đã tồn tại trong danh sách.`;
      setStatusMsg({ type: 'error', text: err });
      showGlobalToast(err, 'error');
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      if (editingCompetitor) {
        await sprint2Service.updateCompetitor(editingCompetitor.id, {
          name: trimmedName,
          website: compWebsite.trim() || undefined,
          strengths: compStrengths.trim() || undefined,
          weaknesses: compWeaknesses.trim() || undefined,
          win_rate: Number(compWinRate),
        });
        const msg = `Cập nhật đối thủ "${trimmedName}" thành công!`;
        setStatusMsg({ type: 'success', text: msg });
        showGlobalToast(msg, 'success');
      } else {
        await sprint2Service.createCompetitor({
          name: trimmedName,
          website: compWebsite.trim() || undefined,
          strengths: compStrengths.trim() || undefined,
          weaknesses: compWeaknesses.trim() || undefined,
          win_rate: Number(compWinRate),
        });
        const msg = `Thêm mới đối thủ "${trimmedName}" thành công!`;
        setStatusMsg({ type: 'success', text: msg });
        showGlobalToast(msg, 'success');
      }
      setIsCompetitorModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi lưu đối thủ cạnh tranh.';
      setStatusMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompetitor = async (c: ICompetitor) => {
    if (isSubmitting) return;
    if (!window.confirm(`Xóa đối thủ cạnh tranh "${c.name}"?`)) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await sprint2Service.deleteCompetitor(c.id);
      const msg = `Đã xóa đối thủ "${c.name}" thành công.`;
      setStatusMsg({ type: 'success', text: msg });
      showGlobalToast(msg, 'success');
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi xóa đối thủ.';
      setStatusMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Lý do Thắng/Thua & Đối thủ cạnh tranh
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
          Chuẩn hóa các nguyên nhân Thắng (WON) hoặc Thất bại (LOST) và theo dõi điểm mạnh yếu của đối thủ cạnh tranh trực tiếp trên thị trường
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('WON')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'WON' ? '#16a34a' : '#f1f5f9',
            color: activeTab === 'WON' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Trophy size={14} /> Lý do Thành công (Win Reasons)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LOST')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'LOST' ? '#dc2626' : '#f1f5f9',
            color: activeTab === 'LOST' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <TrendingDown size={14} /> Lý do Thất bại (Loss Reasons)
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

      {/* Tab 1 & Tab 2: Win Reasons / Loss Reasons */}
      {(activeTab === 'WON' || activeTab === 'LOST') && (
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
              Danh sách {activeTab === 'WON' ? 'Lý do Thành công (Win Reasons)' : 'Lý do Thất bại (Loss Reasons)'} ({reasons.length})
            </span>

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
                backgroundColor: activeTab === 'WON' ? '#16a34a' : '#dc2626',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Thêm lý do {activeTab === 'WON' ? 'Thắng' : 'Thua'}
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 14px', width: '90px', color: '#64748b' }}>Phân loại</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Mã lý do (Code)</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Nội dung lý do</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Mô tả giải thích</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Đang nạp dữ liệu lý do...
                  </td>
                </tr>
              ) : reasons.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có lý do nào trong danh mục này. Hãy bấm Thêm lý do mới!
                  </td>
                </tr>
              ) : (
                reasons.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: r.result_type === 'WON' ? '#dcfce7' : '#fee2e2',
                          color: r.result_type === 'WON' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {r.result_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#334155' }}>
                      <code>{r.code}</code>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>{r.reason}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.description || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReason(r)}
                          disabled={isSubmitting}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                          title="Chỉnh sửa lý do"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReason(r)}
                          disabled={isSubmitting}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                          title="Xóa lý do"
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

      {/* Tab 3: Competitors */}
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
              Danh sách Đối thủ cạnh tranh trực tiếp ({competitors.length})
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
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Website</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Điểm mạnh</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Điểm yếu</th>
                <th style={{ padding: '10px 14px', color: '#64748b' }}>Tỷ lệ thắng ước tính</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Đang nạp danh sách đối thủ...
                  </td>
                </tr>
              ) : competitors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có đối thủ nào trong danh mục.
                  </td>
                </tr>
              ) : (
                competitors.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '10px 14px', color: '#2563eb' }}>
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#2563eb' }}>
                          {c.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#166534' }}>{c.strengths || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#991b1b' }}>{c.weaknesses || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#334155' }}>{c.win_rate}%</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCompetitor(c)}
                          disabled={isSubmitting}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCompetitor(c)}
                          disabled={isSubmitting}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '4px' }}
                          title="Xóa"
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

      {/* Modal Add / Edit Reason */}
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
                {editingReason
                  ? `Chỉnh sửa Lý do (${editingReason.result_type})`
                  : `Thêm mới Lý do ${activeTab === 'WON' ? 'Thành công (Win)' : 'Thất bại (Loss)'}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsReasonModalOpen(false)}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReason} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Tiêu đề lý do *
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'WON' ? 'Giá cả cạnh tranh và dịch vụ tốt' : 'Ngân sách của khách hàng bị cắt giảm'}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              {!editingReason && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mã định danh lý do (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={activeTab === 'WON' ? 'WIN_PRICE' : 'LOSS_BUDGET'}
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Mô tả giải thích chi tiết
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết cho Sales khi phân loại cơ hội..."
                  value={reasonDesc}
                  onChange={(e) => setReasonDesc(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsReasonModalOpen(false)}
                  disabled={isSubmitting}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: activeTab === 'WON' ? '#16a34a' : '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lý do'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Competitor */}
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
                disabled={isSubmitting}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Website
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
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
                  {isSubmitting ? 'Đang lưu...' : 'Lưu đối thủ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
