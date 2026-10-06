import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy,
  Swords,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  X,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { IWinLossReason, ICompetitor } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { useToast } from '../../context/ToastContext';
import styles from './WinLossConfig.module.css';

type MainTabType = 'reasons' | 'competitors';
type ReasonSubTabType = 'WON' | 'LOST' | 'ALL';

interface IReasonFormData {
  resultType: 'WON' | 'LOST';
  code: string;
  reason: string;
  description: string;
}

interface ICompetitorFormData {
  name: string;
  pricingTier: string;
  strengths: string;
  weaknesses: string;
  winRate: number;
}

export const WinLossConfig: React.FC = () => {
  const { showToast } = useToast();

  // Navigation tabs
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('reasons');
  const [reasonSubTab, setReasonSubTab] = useState<ReasonSubTabType>('WON');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data states
  const [reasons, setReasons] = useState<IWinLossReason[]>([]);
  const [competitors, setCompetitors] = useState<ICompetitor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modal Reason
  const [isReasonModalOpen, setIsReasonModalOpen] = useState<boolean>(false);
  const [editingReason, setEditingReason] = useState<IWinLossReason | null>(null);
  const [reasonForm, setReasonForm] = useState<IReasonFormData>({
    resultType: 'WON',
    code: '',
    reason: '',
    description: '',
  });

  // Modal Competitor
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState<boolean>(false);
  const [editingCompetitor, setEditingCompetitor] = useState<ICompetitor | null>(null);
  const [competitorForm, setCompetitorForm] = useState<ICompetitorFormData>({
    name: '',
    pricingTier: 'Trung cấp (Mid-market)',
    strengths: '',
    weaknesses: '',
    winRate: 50,
  });

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'reason' | 'competitor';
    id: string;
    name: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeMainTab === 'reasons') {
        const data = await sprint2Service.getWinLossReasons();
        setReasons(data);
      } else {
        const data = await sprint2Service.getCompetitors();
        setCompetitors(data);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu cấu hình lý do thắng/thua & đối thủ.';
      showToast('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [activeMainTab, showToast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filtering reasons
  const wonReasons = useMemo(() => reasons.filter((r) => r.result_type === 'WON'), [reasons]);
  const lostReasons = useMemo(() => reasons.filter((r) => r.result_type === 'LOST'), [reasons]);

  const displayedReasons = useMemo(() => {
    let list: IWinLossReason[] = [];
    if (reasonSubTab === 'WON') {
      list = wonReasons;
    } else if (reasonSubTab === 'LOST') {
      list = lostReasons;
    } else {
      list = reasons;
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.reason.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [reasonSubTab, wonReasons, lostReasons, reasons, searchTerm]);

  // Filtering competitors
  const displayedCompetitors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return competitors;
    return competitors.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.strengths && c.strengths.toLowerCase().includes(term)) ||
        (c.weaknesses && c.weaknesses.toLowerCase().includes(term))
    );
  }, [competitors, searchTerm]);

  // Handlers for Reasons
  const handleOpenCreateReason = (type: 'WON' | 'LOST') => {
    setEditingReason(null);
    setReasonForm({
      resultType: type,
      code: type === 'WON' ? 'W_' : 'L_',
      reason: '',
      description: '',
    });
    setIsReasonModalOpen(true);
  };

  const handleOpenEditReason = (r: IWinLossReason) => {
    setEditingReason(r);
    setReasonForm({
      resultType: r.result_type,
      code: r.code,
      reason: r.reason,
      description: r.description || '',
    });
    setIsReasonModalOpen(true);
  };

  const handleSubmitReason = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reasonForm.reason.trim()) {
      showToast('warning', 'Vui lòng nhập nguyên nhân chi tiết.');
      return;
    }
    if (!editingReason && !reasonForm.code.trim()) {
      showToast('warning', 'Vui lòng nhập mã định danh cho lý do.');
      return;
    }

    try {
      if (editingReason) {
        await sprint2Service.updateWinLossReason(editingReason.id, {
          reason: reasonForm.reason.trim(),
          description: reasonForm.description.trim(),
        });
        showToast('success', `Cập nhật lý do "${reasonForm.reason.trim()}" thành công!`);
      } else {
        await sprint2Service.createWinLossReason({
          result_type: reasonForm.resultType,
          code: reasonForm.code.toUpperCase().trim(),
          reason: reasonForm.reason.trim(),
          description: reasonForm.description.trim(),
        });
        showToast(
          'success',
          `Thêm mới lý do ${reasonForm.resultType === 'WON' ? 'thắng' : 'thua'} "${reasonForm.reason.trim()}" thành công!`
        );
      }
      setIsReasonModalOpen(false);
      void fetchData();
    } catch (err: unknown) {
      let msg = 'Lỗi khi lưu lý do kết thúc deal.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
        msg = axErr.response?.data?.detail || axErr.response?.data?.message || msg;
      }
      showToast('error', msg);
    }
  };

  // Handlers for Competitors
  const handleOpenCreateCompetitor = () => {
    setEditingCompetitor(null);
    setCompetitorForm({
      name: '',
      pricingTier: 'Trung cấp (Mid-market)',
      strengths: '',
      weaknesses: '',
      winRate: 50,
    });
    setIsCompetitorModalOpen(true);
  };

  const handleOpenEditCompetitor = (c: ICompetitor) => {
    setEditingCompetitor(c);
    setCompetitorForm({
      name: c.name,
      pricingTier: c.pricing_tier || 'Trung cấp (Mid-market)',
      strengths: c.strengths || '',
      weaknesses: c.weaknesses || '',
      winRate: c.win_rate ?? 50,
    });
    setIsCompetitorModalOpen(true);
  };

  const handleSubmitCompetitor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!competitorForm.name.trim()) {
      showToast('warning', 'Vui lòng nhập tên đối thủ cạnh tranh.');
      return;
    }

    try {
      if (editingCompetitor) {
        await sprint2Service.updateCompetitor(editingCompetitor.id, {
          name: competitorForm.name.trim(),
          strengths: competitorForm.strengths.trim(),
          weaknesses: competitorForm.weaknesses.trim(),
          pricing_tier: competitorForm.pricingTier,
          win_rate: Number(competitorForm.winRate),
        });
        showToast('success', `Cập nhật đối thủ cạnh tranh "${competitorForm.name.trim()}" thành công!`);
      } else {
        await sprint2Service.createCompetitor({
          name: competitorForm.name.trim(),
          strengths: competitorForm.strengths.trim(),
          weaknesses: competitorForm.weaknesses.trim(),
          pricing_tier: competitorForm.pricingTier,
          win_rate: Number(competitorForm.winRate),
        });
        showToast('success', `Thêm mới đối thủ cạnh tranh "${competitorForm.name.trim()}" thành công!`);
      }
      setIsCompetitorModalOpen(false);
      void fetchData();
    } catch (err: unknown) {
      let msg = 'Lỗi khi lưu đối thủ cạnh tranh.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
        msg = axErr.response?.data?.detail || axErr.response?.data?.message || msg;
      }
      showToast('error', msg);
    }
  };

  // Delete Confirm Execution
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'reason') {
        await sprint2Service.deleteWinLossReason(deleteTarget.id);
        showToast('success', `Đã xóa lý do "${deleteTarget.name}" thành công.`);
      } else {
        await sprint2Service.deleteCompetitor(deleteTarget.id);
        showToast('success', `Đã xóa đối thủ cạnh tranh "${deleteTarget.name}" thành công.`);
      }
      setDeleteTarget(null);
      void fetchData();
    } catch (err: unknown) {
      let msg = 'Lỗi khi thực hiện xóa mục dữ liệu.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
        msg = axErr.response?.data?.detail || axErr.response?.data?.message || msg;
      }
      showToast('error', msg);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Lý do Thắng/Thua & Đối thủ cạnh tranh</h1>
        <p className={styles.subtitle}>
          Khai báo danh mục lý do thành công (WON), thất bại (LOST) và đối thủ cạnh tranh thị trường để chuẩn hóa dữ liệu khi đóng thương vụ bán hàng
        </p>
      </header>

      {/* 2 Main Tabs Navigation */}
      <div className={styles.tabsContainer} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeMainTab === 'reasons'}
          className={`${styles.tabBtn} ${activeMainTab === 'reasons' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveMainTab('reasons');
            setSearchTerm('');
          }}
        >
          <Trophy size={16} />
          <span>Lý do kết thúc deal</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMainTab === 'competitors'}
          className={`${styles.tabBtn} ${activeMainTab === 'competitors' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveMainTab('competitors');
            setSearchTerm('');
          }}
        >
          <Swords size={16} />
          <span>Danh sách đối thủ cạnh tranh</span>
        </button>
      </div>

      {/* Main Tab 1: Win / Loss Reasons */}
      {activeMainTab === 'reasons' && (
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
          aria-label="Bảng quản lý lý do thắng thua"
        >
          {/* Header Card y hệt kiểu bảng danh mục dùng chung hệ thống */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                {reasonSubTab === 'WON'
                  ? 'Danh mục lý do Thắng'
                  : reasonSubTab === 'LOST'
                  ? 'Danh mục lý do Thua'
                  : 'Tất cả lý do kết thúc deal'}{' '}
                ({displayedReasons.length})
              </span>

              {/* Sub-tabs: Won Reasons, Lost Reasons, All */}
              <div className={styles.subTabGroup}>
                <button
                  type="button"
                  className={`${styles.subTabBtn} ${reasonSubTab === 'WON' ? styles.subTabBtnActiveWon : ''}`}
                  onClick={() => setReasonSubTab('WON')}
                >
                  <TrendingUp size={13} color="#15803d" />
                  <span>Lý do Thắng</span>
                  <span className={styles.countBadge}>{wonReasons.length}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.subTabBtn} ${reasonSubTab === 'LOST' ? styles.subTabBtnActiveLost : ''}`}
                  onClick={() => setReasonSubTab('LOST')}
                >
                  <TrendingDown size={13} color="#b91c1c" />
                  <span>Lý do Thua</span>
                  <span className={styles.countBadge}>{lostReasons.length}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.subTabBtn} ${reasonSubTab === 'ALL' ? styles.subTabBtnActiveAll : ''}`}
                  onClick={() => setReasonSubTab('ALL')}
                >
                  <span>Tất cả</span>
                  <span className={styles.countBadge}>{reasons.length}</span>
                </button>
              </div>
            </div>

            {/* Actions: Search & Thêm lý do riêng biệt */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Tìm lý do..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    height: '32px',
                    padding: '0 10px 0 30px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    width: '140px',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateReason('WON')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Khai báo lý do khách hàng đồng ý ký hợp đồng"
              >
                <Plus size={14} /> Thêm lý do thắng
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateReason('LOST')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Khai báo lý do cơ hội bán hàng bị hủy hoặc thua đối thủ"
              >
                <Plus size={14} /> Thêm lý do thua
              </button>
            </div>
          </div>

          {/* Table: Đồng bộ phông chữ, cỡ chữ, cột mã xanh dương y hệt Ảnh 5 */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '10px 14px', width: '60px', color: '#64748b', fontWeight: 600 }}>Thứ tự</th>
                  <th style={{ padding: '10px 14px', width: '130px', color: '#64748b', fontWeight: 600 }}>Phân loại</th>
                  <th style={{ padding: '10px 14px', width: '150px', color: '#64748b', fontWeight: 600 }}>Mã định danh</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Nguyên nhân chi tiết</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Mô tả / Hướng dẫn ghi nhận</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: '90px', color: '#64748b', fontWeight: 600 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Đang nạp danh mục lý do...
                    </td>
                  </tr>
                ) : displayedReasons.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có lý do nào được khai báo trong phân loại này.
                    </td>
                  </tr>
                ) : (
                  displayedReasons.map((r, idx) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: r.result_type === 'WON' ? '#eff6ff' : '#fee2e2',
                            color: r.result_type === 'WON' ? '#1d4ed8' : '#b91c1c',
                          }}
                        >
                          {r.result_type === 'WON' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {r.result_type === 'WON' ? 'Thành công (WON)' : 'Thất bại (LOST)'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>
                        {r.code}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>
                        {r.reason}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.8125rem' }}>
                        {r.description || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditReason(r)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                            title="Chỉnh sửa lý do"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'reason',
                                id: r.id,
                                name: r.reason,
                              })
                            }
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
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
        </section>
      )}

      {/* Main Tab 2: Competitors */}
      {activeMainTab === 'competitors' && (
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
          aria-label="Bảng quản lý đối thủ cạnh tranh"
        >
          {/* Header Card y hệt kiểu bảng danh mục dùng chung hệ thống */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Danh sách đối thủ cạnh tranh thị trường ({competitors.length})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Tìm đối thủ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    height: '32px',
                    padding: '0 10px 0 30px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    width: '150px',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleOpenCreateCompetitor}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Thêm đối thủ cạnh tranh
              </button>
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '10px 14px', width: '60px', color: '#64748b', fontWeight: 600 }}>Thứ tự</th>
                  <th style={{ padding: '10px 14px', width: '180px', color: '#64748b', fontWeight: 600 }}>Tên đối thủ</th>
                  <th style={{ padding: '10px 14px', width: '150px', color: '#64748b', fontWeight: 600 }}>Phân khúc giá</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Điểm mạnh cạnh tranh</th>
                  <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Điểm yếu / Hạn chế</th>
                  <th style={{ padding: '10px 14px', width: '140px', color: '#64748b', fontWeight: 600 }}>Tỷ lệ thắng đối đầu</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: '90px', color: '#64748b', fontWeight: 600 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Đang nạp danh sách đối thủ...
                    </td>
                  </tr>
                ) : displayedCompetitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có đối thủ cạnh tranh nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  displayedCompetitors.map((c, idx) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                          }}
                        >
                          {c.pricing_tier || 'Trung cấp'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#166534', fontSize: '0.8125rem' }}>
                        {c.strengths || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#991b1b', fontSize: '0.8125rem' }}>
                        {c.weaknesses || '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {c.win_rate}%
                          </span>
                          <div style={{ width: '100px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '3px' }}>
                            <div style={{ width: `${Math.min(Math.max(c.win_rate, 0), 100)}%`, height: '100%', backgroundColor: '#2563eb' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCompetitor(c)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                            title="Chỉnh sửa đối thủ"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'competitor',
                                id: c.id,
                                name: c.name,
                              })
                            }
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                            title="Xóa đối thủ"
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
        </section>
      )}

      {/* Modal Add / Edit Reason (Đồng bộ chuẩn 100% với bảng thêm mới trường tùy biến - CustomFieldBuilder) */}
      {isReasonModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editingReason
                  ? `Chỉnh sửa lý do ${reasonForm.resultType === 'WON' ? 'Thắng (WON)' : 'Thua (LOST)'}`
                  : `Thêm mới lý do ${reasonForm.resultType === 'WON' ? 'Thắng (WON)' : 'Thua (LOST)'}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsReasonModalOpen(false)}
                aria-label="Đóng cửa sổ"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'inline-flex', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body: Đồng bộ tất cả ô input, label, font chữ chuẩn */}
            <form onSubmit={handleSubmitReason}>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Result Type Badge / Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Phân loại kết quả thương vụ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  {!editingReason ? (
                    <select
                      value={reasonForm.resultType}
                      onChange={(e) => {
                        const val = e.target.value as 'WON' | 'LOST';
                        setReasonForm((prev) => ({
                          ...prev,
                          resultType: val,
                          code: val === 'WON' ? 'W_' : 'L_',
                        }));
                      }}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    >
                      <option value="WON">Thành công — Khách hàng đồng ý ký hợp đồng</option>
                      <option value="LOST">Thất bại — Cơ hội bán hàng bị hủy hoặc thua đối thủ</option>
                    </select>
                  ) : (
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: reasonForm.resultType === 'WON' ? '#dcfce7' : '#fee2e2',
                          color: reasonForm.resultType === 'WON' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {reasonForm.resultType === 'WON' ? 'Thành công (WON)' : 'Thất bại (LOST)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reason Text */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Nguyên nhân chi tiết <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      reasonForm.resultType === 'WON'
                        ? 'VD: Giá thành cạnh tranh & dịch vụ hỗ trợ 24/7'
                        : 'VD: Ngân sách khách hàng cắt giảm đột xuất'
                    }
                    value={reasonForm.reason}
                    onChange={(e) =>
                      setReasonForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Reason Code */}
                {!editingReason && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                      Mã định danh kỹ thuật <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={reasonForm.resultType === 'WON' ? 'W_PRICING' : 'L_BUDGET'}
                      value={reasonForm.code}
                      onChange={(e) =>
                        setReasonForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Mô tả / Hướng dẫn ghi nhận
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Gợi ý ngữ cảnh khi nào nhân viên kinh doanh nên chọn lý do này..."
                    value={reasonForm.description}
                    onChange={(e) =>
                      setReasonForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Footer Modal: Đồng bộ nút Hủy bỏ và Lưu thay đổi / Tạo mới */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '14px 20px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#ffffff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsReasonModalOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingReason ? 'Lưu thay đổi' : 'Tạo mới lý do'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Competitor (Đồng bộ chuẩn 100% với bảng thêm mới trường tùy biến - CustomFieldBuilder) */}
      {isCompetitorModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editingCompetitor ? 'Chỉnh sửa đối thủ cạnh tranh' : 'Thêm mới đối thủ cạnh tranh'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCompetitorModalOpen(false)}
                aria-label="Đóng cửa sổ"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'inline-flex', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCompetitor}>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Tên thương hiệu đối thủ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Salesforce, HubSpot, Misa CRM..."
                    value={competitorForm.name}
                    onChange={(e) =>
                      setCompetitorForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                      Phân khúc định giá
                    </label>
                    <select
                      value={competitorForm.pricingTier}
                      onChange={(e) =>
                        setCompetitorForm((prev) => ({ ...prev, pricingTier: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    >
                      <option value="Cao cấp">Cao cấp</option>
                      <option value="Trung cấp">Trung cấp</option>
                      <option value="Giá rẻ">Giá rẻ</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                      Tỷ lệ thắng ước tính (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={competitorForm.winRate}
                      onChange={(e) =>
                        setCompetitorForm((prev) => ({
                          ...prev,
                          winRate: Number(e.target.value) || 0,
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Điểm mạnh của đối thủ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Hệ sinh thái rộng lớn, thương hiệu uy tín toàn cầu..."
                    value={competitorForm.strengths}
                    onChange={(e) =>
                      setCompetitorForm((prev) => ({ ...prev, strengths: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Điểm yếu / Nhược điểm của đối thủ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Chi phí bản quyền đắt đỏ, giao diện tiếng Anh khó sử dụng..."
                    value={competitorForm.weaknesses}
                    onChange={(e) =>
                      setCompetitorForm((prev) => ({ ...prev, weaknesses: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Footer Modal: Đồng bộ nút Hủy bỏ và Lưu thay đổi / Tạo mới */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '14px 20px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#ffffff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCompetitorModalOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingCompetitor ? 'Lưu thay đổi' : 'Thêm đối thủ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
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
                <ShieldAlert size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Xác nhận xóa dữ liệu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa{' '}
                {deleteTarget.type === 'reason' ? 'lý do' : 'đối thủ cạnh tranh'}{' '}
                <strong style={{ color: '#0f172a' }}>"{deleteTarget.name}"</strong>? Thao tác này sẽ cập nhật cấu hình hệ thống ngay lập tức.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '14px 20px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
              }}
            >
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
