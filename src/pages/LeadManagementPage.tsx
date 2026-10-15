import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code,
  Copy,
  Edit2,
  Flame,
  GitMerge,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  ILead,
  ILeadListResponse,
  ILeadDuplicateMatch,
  ILeadRoutingRule,
  ICampaign,
} from '../interfaces';
import { leadService } from '../services/leadService';
import { campaignService } from '../services/campaignService';
import { showGlobalToast, ToastType } from '../context/ToastContext';
import { Badge, Button, Modal, SearchBar } from '../components/common';
import styles from './LeadManagementPage.module.css';

const notifyToast = (opts: { title?: string; description?: string; type?: ToastType }) => {
  showGlobalToast(`${opts.title ? opts.title + ': ' : ''}${opts.description || ''}`, opts.type || 'info');
};

const PRESET_FILTERS = [
  { id: 'all', label: 'Tất cả Lead' },
  { id: 'hot', label: '🔥 Hot Leads (Điểm cao)' },
  { id: 'sla_overdue', label: '⏰ Quá hạn SLA' },
  { id: 'unassigned', label: 'Chưa phân bổ' },
  { id: 'contacted', label: 'Đã liên hệ' },
];

export const LeadManagementPage: React.FC = () => {
  const navigate = useNavigate();
  // Main Data States
  const [leads, setLeads] = useState<ILead[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [scoreGradeFilter, setScoreGradeFilter] = useState<string>('');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<boolean>(false);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState<boolean>(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  // Selected Lead for Actions
  const [activeLead, setActiveLead] = useState<ILead | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<ILeadDuplicateMatch[]>([]);
  const [routingRules, setRoutingRules] = useState<ILeadRoutingRule[]>([]);
  const [embedCode, setEmbedCode] = useState<{ embed_html: string; form_action_url: string } | null>(null);

  // Form states
  const [convertForm, setConvertForm] = useState({
    create_customer: true,
    create_deal: true,
    deal_title: '',
    deal_value: 50000000,
    expected_close_date: '',
  });

  const [rejectReason, setRejectReason] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Load Campaigns
  useEffect(() => {
    campaignService.getCampaigns().then(setCampaigns).catch(() => {});
  }, []);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      let isSlaOverdue: boolean | undefined = undefined;
      let effectiveStatus = statusFilter || undefined;
      let effectiveScoreGrade = scoreGradeFilter || undefined;

      if (selectedPreset === 'hot') {
        effectiveScoreGrade = 'Hot';
      } else if (selectedPreset === 'sla_overdue') {
        isSlaOverdue = true;
      } else if (selectedPreset === 'unassigned') {
        effectiveStatus = 'UNASSIGNED';
      } else if (selectedPreset === 'contacted') {
        effectiveStatus = 'CONTACTED';
      }

      const res: ILeadListResponse = await leadService.getLeads({
        page,
        limit,
        search: searchQuery.trim() || undefined,
        status: effectiveStatus,
        score_grade: effectiveScoreGrade,
        campaign_id: campaignFilter || undefined,
        sla_overdue_only: isSlaOverdue,
      });

      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      setLeads(items);
      setTotal(typeof res?.total === 'number' ? res.total : items.length);
      setTotalPages(typeof res?.total_pages === 'number' ? res.total_pages : 1);
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi tải danh sách Lead',
        description: err.response?.data?.detail || 'Không thể kết nối đến máy chủ',
        type: 'error',
      });
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, selectedPreset, statusFilter, scoreGradeFilter, campaignFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Lead Stats
  const statCounts = useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const hotCount = safeLeads.filter((l) => l.score_grade === 'Hot' || (l as any).scoreGrade === 'Hot').length;
    const slaOverdueCount = safeLeads.filter((l) => Boolean(l.is_sla_overdue || (l as any).slaOverdue)).length;
    const convertedCount = safeLeads.filter((l) => l.status === 'CONVERTED').length;
    return { hotCount, slaOverdueCount, convertedCount };
  }, [leads]);

  // Actions
  const handleAcceptLead = async (lead: ILead) => {
    try {
      await leadService.acceptLead(lead.id);
      notifyToast({
        title: 'Tiếp nhận Lead thành công',
        description: `Lead ${lead.full_name} đã chuyển trạng thái sang tiếp nhận.`,
        type: 'success',
      });
      fetchLeads();
    } catch (err: any) {
      notifyToast({
        title: 'Thao tác thất bại',
        description: err.response?.data?.detail || 'Không thể tiếp nhận Lead',
        type: 'error',
      });
    }
  };

  const handleRejectLead = async () => {
    if (!activeLead) return;
    try {
      await leadService.rejectLead(activeLead.id, rejectReason);
      notifyToast({
        title: 'Đã từ chối Lead',
        description: `Lead ${activeLead.full_name} đã bị từ chối với lý do ghi nhận.`,
        type: 'warning',
      });
      setIsRejectModalOpen(false);
      setRejectReason('');
      fetchLeads();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi',
        description: err.response?.data?.detail || 'Không thể từ chối Lead',
        type: 'error',
      });
    }
  };

  const handleRecalculateScore = async (lead: ILead) => {
    try {
      const res = await leadService.recalculateScore(lead.id);
      notifyToast({
        title: 'Đã cập nhật điểm',
        description: `Lead ${lead.full_name}: Điểm mới là ${res.score} (${res.score_grade})`,
        type: 'success',
      });
      fetchLeads();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi tính điểm',
        description: err.response?.data?.detail || 'Không thể tính điểm Lead',
        type: 'error',
      });
    }
  };

  const handleCheckDuplicates = async (lead: ILead) => {
    setActiveLead(lead);
    try {
      const res = await leadService.checkDuplicates(lead.id);
      setDuplicateMatches(res.duplicates);
      setIsDuplicateModalOpen(true);
    } catch (err: any) {
      notifyToast({
        title: 'Kiểm tra trùng lặp thất bại',
        description: err.response?.data?.detail || 'Không thể kiểm tra trùng lặp',
        type: 'error',
      });
    }
  };

  const handleMergeLead = async () => {
    if (!activeLead || duplicateMatches.length === 0) return;
    try {
      const duplicateIds = duplicateMatches
        .filter((d) => d.match_type === 'LEAD')
        .map((d) => d.record_id);

      if (duplicateIds.length === 0) {
        notifyToast({
          title: 'Thông báo',
          description: 'Không có bản ghi Lead trùng lặp để gộp.',
          type: 'info',
        });
        return;
      }

      await leadService.mergeLeads({
        primary_lead_id: activeLead.id,
        duplicate_lead_ids: duplicateIds,
      });

      notifyToast({
        title: 'Gộp Lead thành công',
        description: `Đã hợp nhất an toàn ${duplicateIds.length} bản ghi vào Lead chính.`,
        type: 'success',
      });
      setIsDuplicateModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi gộp bản ghi',
        description: err.response?.data?.detail || 'Không thể gộp Lead',
        type: 'error',
      });
    }
  };

  const handleOpenConvert = (lead: ILead) => {
    setActiveLead(lead);
    setConvertForm({
      create_customer: true,
      create_deal: true,
      deal_title: `Cơ hội bán hàng - ${lead.company_name || lead.full_name}`,
      deal_value: 50000000,
      expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertLead = async () => {
    if (!activeLead) return;
    try {
      const res = await leadService.convertLead(activeLead.id, convertForm);
      notifyToast({
        title: 'Chuyển đổi thành công',
        description: `${res.message}. Khách hàng ID: ${res.customer_id}${res.deal_id ? `, Cơ hội ID: ${res.deal_id}` : ''}`,
        type: 'success',
      });
      setIsConvertModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi chuyển đổi',
        description: err.response?.data?.detail || 'Không thể chuyển đổi Lead',
        type: 'error',
      });
    }
  };

  const handleOpenEmbedSnippet = async () => {
    try {
      const res = await leadService.getEmbedSnippet();
      setEmbedCode(res);
      setIsEmbedModalOpen(true);
    } catch (err: any) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      setEmbedCode({
        embed_html: `<iframe src="${baseUrl}/embed/lead-form" width="100%" height="480" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" title="NexusCRM Lead Form"></iframe>`,
        form_action_url: '/api/v1/leads/public/submit',
      });
      setIsEmbedModalOpen(true);
    }
  };

  const handleCopySnippet = () => {
    if (embedCode?.embed_html) {
      const text = embedCode.embed_html;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      notifyToast({
        title: 'Đã sao chép vào bộ nhớ tạm',
        description: 'Mã nhúng Lead Form đã sẵn sàng dán vào website bất kỳ.',
        type: 'success',
      });
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      const res = await leadService.importExcel(importFile);
      setImportResult(res);
      const successCount = res.success_count ?? (res as any).successCount ?? 0;
      const totalRows = res.total_rows ?? (res as any).totalRows ?? 0;
      const errorCount = res.error_count ?? (res as any).errorCount ?? 0;
      notifyToast({
        title: 'Nhập file Excel hoàn tất',
        description: `Thành công ${successCount}/${totalRows} bản ghi.`,
        type: errorCount > 0 ? 'warning' : 'success',
      });
      fetchLeads();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi nhập dữ liệu',
        description: err.response?.data?.detail || 'File không hợp lệ hoặc lỗi xử lý máy chủ',
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.leadPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.header__left}>
          <div className={styles.header__badgeRow}>
            <Badge tone="primary" dot>
              QUẢN LÝ TIỀM NĂNG & ĐIỂM SỐ
            </Badge>
          </div>
          <h1 className={styles.header__title}>Quản lý Lead (Khách hàng tiềm năng)</h1>
          <p className={styles.header__subtitle}>
            Thu thập đa kênh, định tuyến tự động theo vùng miền, tính điểm Hot/Warm/Cold, và kiểm soát hạn SLA chuyển đổi.
          </p>
        </div>

        <div className={styles.header__actions}>
          <Button variant="secondary" onClick={handleOpenEmbedSnippet}>
            <Code size={16} /> Nhúng Form Web
          </Button>
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            <Upload size={16} /> Nhập Excel / CSV
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const rules = await leadService.getRoutingRules();
                setRoutingRules(rules);
              } catch (err) {
                console.warn('Could not refresh routing rules:', err);
              }
              setIsRoutingModalOpen(true);
            }}
          >
            <Layers size={16} /> Cấu hình Định tuyến
          </Button>
          <Button variant="primary" onClick={() => navigate('/leads/create')}>
            <Plus size={16} /> Tạo Lead mới
          </Button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCard__info}>
            <span className={styles.statCard__label}>Tổng số Lead</span>
            <span className={styles.statCard__value}>{total}</span>
          </div>
          <div className={styles.statCard__icon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
            <Users size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCard__info}>
            <span className={styles.statCard__label}>Lead Nóng (Hot Leads)</span>
            <span className={styles.statCard__value} style={{ color: '#dc2626' }}>
              {statCounts.hotCount}
            </span>
          </div>
          <div className={styles.statCard__icon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
            <Flame size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCard__info}>
            <span className={styles.statCard__label}>Quá hạn xử lý SLA</span>
            <span className={styles.statCard__value} style={{ color: '#d97706' }}>
              {statCounts.slaOverdueCount}
            </span>
          </div>
          <div className={styles.statCard__icon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCard__info}>
            <span className={styles.statCard__label}>Đã chuyển đổi Deal/KH</span>
            <span className={styles.statCard__value} style={{ color: '#16a34a' }}>
              {statCounts.convertedCount}
            </span>
          </div>
          <div className={styles.statCard__icon} style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbar__topRow}>
          <div className={styles.toolbar__searchWrap}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo họ tên, email, số điện thoại, công ty..."
            />
          </div>

          <div className={styles.toolbar__controls}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Trạng thái (Tất cả)</option>
              <option value="UNASSIGNED">Chưa phân bổ</option>
              <option value="ASSIGNED">Đã phân bổ</option>
              <option value="CONTACTED">Đã liên hệ</option>
              <option value="QUALIFIED">Đủ điều kiện</option>
              <option value="CONVERTED">Đã chuyển đổi</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>

            <select
              className={styles.filterSelect}
              value={scoreGradeFilter}
              onChange={(e) => setScoreGradeFilter(e.target.value)}
            >
              <option value="">Phân loại điểm (Tất cả)</option>
              <option value="Hot">🔥 Hot (≥ 70 điểm)</option>
              <option value="Warm">⚡ Warm (40 - 69 điểm)</option>
              <option value="Cold">❄️ Cold (&lt; 40 điểm)</option>
            </select>

            <select
              className={styles.filterSelect}
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="">Chiến dịch (Tất cả)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button variant="ghost" onClick={fetchLeads}>
              <RefreshCw size={15} /> Làm mới
            </Button>
          </div>
        </div>

        {/* Filter Presets */}
        <div className={styles.toolbar__presetChips}>
          {PRESET_FILTERS.map((preset) => (
            <button
              key={preset.id}
              className={`${styles.presetChip} ${selectedPreset === preset.id ? styles['presetChip--active'] : ''}`}
              onClick={() => {
                setSelectedPreset(preset.id);
                setPage(1);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Full-Width Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.leadTable}>
            <thead>
              <tr>
                <th>HỌ TÊN & CÔNG TY</th>
                <th>LIÊN HỆ</th>
                <th>NGUỒN & CHIẾN DỊCH</th>
                <th>ĐIỂM SỐ LEAD</th>
                <th>TRẠNG THÁI</th>
                <th>HẠN SLA XỬ LÝ</th>
                <th>PHỤ TRÁCH</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto', color: 'var(--color-primary)' }} />
                    <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>Đang tải danh sách Lead...</p>
                  </td>
                </tr>
              ) : (!leads || leads.length === 0) ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px' }}>
                    <Target size={36} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                    <p style={{ fontWeight: 600 }}>Không tìm thấy Lead nào phù hợp</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      Hãy thử đổi từ khóa tìm kiếm hoặc xóa các bộ lọc.
                    </p>
                  </td>
                </tr>
              ) : (
                (Array.isArray(leads) ? leads : []).map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className={styles.leadNameCell}>
                        <span className={styles.leadName}>{lead.full_name}</span>
                        <span className={styles.leadCompany}>
                          {lead.title ? `${lead.title} · ` : ''}
                          {lead.company_name || 'Khách cá nhân'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.contactInfo}>
                        <span>{lead.email || '—'}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{lead.phone || '—'}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>{lead.source}</span>
                        {lead.campaign_name && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                            📌 {lead.campaign_name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`${styles.scoreBadge} ${
                          lead.score_grade === 'Hot'
                            ? styles['scoreBadge--hot']
                            : lead.score_grade === 'Warm'
                            ? styles['scoreBadge--warm']
                            : styles['scoreBadge--cold']
                        }`}
                      >
                        {lead.score_grade === 'Hot' ? '🔥' : lead.score_grade === 'Warm' ? '⚡' : '❄️'} {lead.score} điểm ({lead.score_grade})
                      </span>
                    </td>

                    <td>
                      <Badge
                        tone={
                          lead.status === 'CONVERTED'
                            ? 'success'
                            : lead.status === 'CONTACTED'
                            ? 'primary'
                            : lead.status === 'REJECTED'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {lead.status}
                      </Badge>
                    </td>

                    <td>
                      {lead.is_sla_overdue ? (
                        <span className={`${styles.slaBadge} ${styles['slaBadge--overdue']}`}>
                          <AlertCircle size={14} /> QUÁ HẠN SLA
                        </span>
                      ) : lead.sla_deadline ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {new Date(lead.sla_deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {lead.owner_name || <span style={{ color: 'var(--color-text-muted)' }}>Chưa gán</span>}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                        {lead.status === 'UNASSIGNED' && (
                          <button
                            className={styles.iconBtn}
                            title="Tiếp nhận Lead"
                            onClick={() => handleAcceptLead(lead)}
                          >
                            <UserCheck size={15} color="#16a34a" />
                          </button>
                        )}

                        <button
                          className={styles.iconBtn}
                          title="Tính lại điểm số tự động"
                          onClick={() => handleRecalculateScore(lead)}
                        >
                          <Sparkles size={15} color="#8b5cf6" />
                        </button>

                        <button
                          className={styles.iconBtn}
                          title="Kiểm tra trùng lặp & Gộp"
                          onClick={() => handleCheckDuplicates(lead)}
                        >
                          <GitMerge size={15} color="#0284c7" />
                        </button>

                        {lead.status !== 'CONVERTED' && lead.status !== 'REJECTED' && (
                          <>
                            <button
                              className={styles.iconBtn}
                              title="Chuyển đổi thành Khách hàng & Deal"
                              onClick={() => handleOpenConvert(lead)}
                            >
                              <ArrowRight size={15} color="#2563eb" />
                            </button>

                            <button
                              className={styles.iconBtn}
                              title="Chỉnh sửa Lead"
                              onClick={() => navigate(`/leads/${lead.id}/edit`)}
                            >
                              <Edit2 size={15} color="#0284c7" />
                            </button>

                            <button
                              className={styles.iconBtn}
                              title="Từ chối Lead (Yêu cầu lý do)"
                              onClick={() => {
                                setActiveLead(lead);
                                setIsRejectModalOpen(true);
                              }}
                            >
                              <XCircle size={15} color="#ef4444" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <span>
            Hiển thị <strong>{leads.length}</strong> / <strong>{total}</strong> Lead (Trang {page} / {totalPages})
          </span>
          <div className={styles.pagination__buttons}>
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>



      {/* Embed Snippet Modal */}
      <Modal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        title="Mã nhúng Form thu thập Lead trên Website"
        maxWidth="md"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Nhúng đoạn mã HTML / Script dưới đây vào Landing Page hoặc Website của bạn. Dữ liệu gửi lên sẽ tự động
            xác thực, kiểm tra chống spam và ghi nhận nguồn <strong>Web Lead</strong>.
          </p>

          <label className={styles.formLabel}>Đoạn mã Iframe / Form HTML:</label>
          <div className={styles.codeBox}>{embedCode?.embed_html}</div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setIsEmbedModalOpen(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleCopySnippet}>
              <Copy size={16} /> Sao chép mã nhúng
            </Button>
          </div>
        </div>
      </Modal>

      {/* S4-02: Excel Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportResult(null);
          setImportFile(null);
        }}
        title="Nhập Lead từ file Excel / CSV"
        maxWidth="md"
      >
        <form onSubmit={handleImportExcel}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Hỗ trợ định dạng <code>.xlsx</code> hoặc <code>.csv</code>. Hệ thống sẽ tự động xác thực từng dòng, tính điểm, và tự động bỏ qua các lỗi định dạng hoặc trùng lặp.
          </p>

          <div
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 16,
            }}
            onClick={() => document.getElementById('leadExcelInput')?.click()}
          >
            <Upload size={36} style={{ color: 'var(--color-primary)', marginBottom: 8 }} />
            <p style={{ fontWeight: 600 }}>{importFile ? importFile.name : 'Chọn file Excel từ máy tính'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Dung lượng tối đa 10MB</p>
            <input
              id="leadExcelInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && setImportFile(e.target.files[0])}
            />
          </div>

          {importResult && (
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg-subtle)',
                marginBottom: 16,
                fontSize: '0.8125rem',
              }}
            >
              <p style={{ fontWeight: 600, color: '#16a34a' }}>
                ✓ Nhập thành công: {importResult.success_count} / {importResult.total_rows}
              </p>
              {importResult.error_count > 0 && (
                <p style={{ color: '#dc2626', marginTop: 4 }}>
                  ⚠️ Dòng lỗi ({importResult.error_count}): {JSON.stringify(importResult.errors)}
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" type="button" onClick={() => setIsImportModalOpen(false)}>
              Đóng
            </Button>
            <Button variant="primary" type="submit" disabled={!importFile || importing}>
              {importing ? <Loader2 className="animate-spin" size={16} /> : 'Tiến hành Nhập dữ liệu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* S4-04: Duplicate Detection & Merge Modal */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title={`Kiểm tra Trùng lặp & Gộp Lead: ${activeLead?.full_name}`}
        maxWidth="lg"
      >
        <div>
          {duplicateMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontWeight: 600 }}>Không phát hiện bản ghi trùng lặp nào!</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Email và Số điện thoại của Lead này là duy nhất trong hệ thống.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                Phát hiện <strong>{duplicateMatches.length}</strong> bản ghi có cùng Email hoặc Số điện thoại.
                Hệ thống sẽ giữ lại bản ghi chính và gộp lịch sử an toàn.
              </p>

              <table className={styles.leadTable} style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>LOẠI BẢN GHI</th>
                    <th>TÊN / ĐƠN VỊ</th>
                    <th>TRÙNG THEO TRƯỜNG</th>
                    <th>NGÀY TẠO</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateMatches.map((match, idx) => (
                    <tr key={idx}>
                      <td>
                        <Badge tone={match.match_type === 'LEAD' ? 'primary' : 'warning'}>
                          {match.match_type}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 600 }}>{match.record_name}</td>
                      <td>
                        <code style={{ fontSize: '0.75rem' }}>{match.matched_field}</code>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {new Date(match.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button variant="secondary" onClick={() => setIsDuplicateModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button variant="primary" onClick={handleMergeLead}>
                  <GitMerge size={16} /> Tiến hành Hợp nhất an toàn (Merge)
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Lead Conversion Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title={`Chuyển đổi Lead thành Khách hàng & Cơ hội`}
        maxWidth="md"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Chuyển đổi Lead <strong>{activeLead?.full_name}</strong> thành Khách hàng Doanh nghiệp, Người liên hệ và Cơ hội bán hàng trong một giao dịch an toàn (Transaction safe).
          </p>

          <div className={styles.formGrid}>
            <div className={styles['formGroup--full']}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={convertForm.create_customer}
                  onChange={(e) => setConvertForm({ ...convertForm, create_customer: e.target.checked })}
                />
                Tạo mới Khách hàng Doanh nghiệp (Customer) từ thông tin Lead
              </label>
            </div>

            <div className={styles['formGroup--full']}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={convertForm.create_deal}
                  onChange={(e) => setConvertForm({ ...convertForm, create_deal: e.target.checked })}
                />
                Tạo mới Cơ hội bán hàng (Deal) trong Phễu bán hàng (EP-05)
              </label>
            </div>

            {convertForm.create_deal && (
              <>
                <div className={styles['formGroup--full']}>
                  <label className={styles.formLabel}>Tên cơ hội bán hàng</label>
                  <input
                    className={styles.formInput}
                    value={convertForm.deal_title}
                    onChange={(e) => setConvertForm({ ...convertForm, deal_title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Giá trị dự kiến (VNĐ)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={convertForm.deal_value}
                    onChange={(e) => setConvertForm({ ...convertForm, deal_value: Number(e.target.value) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hạn chốt dự kiến</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={convertForm.expected_close_date}
                    onChange={(e) => setConvertForm({ ...convertForm, expected_close_date: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button variant="secondary" onClick={() => setIsConvertModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConvertLead}>
              Xác nhận Chuyển đổi (CONVERT)
            </Button>
          </div>
        </div>
      </Modal>

      {/* S4-07: Reject Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ chối Lead (Yêu cầu lý do)"
        maxWidth="sm"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Theo quy định SLA, việc từ chối Lead bắt buộc phải ghi rõ lý do để phục vụ kiểm toán và nâng cao chất lượng nguồn khách.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Lý do từ chối *</label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              required
              placeholder="VD: Không đúng số điện thoại, không có nhu cầu, ngoài phạm vi phục vụ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" disabled={!rejectReason.trim()} onClick={handleRejectLead}>
              Xác nhận Từ chối
            </Button>
          </div>
        </div>
      </Modal>

      {/* Routing Rules Config Modal */}
      <Modal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        title="Quy tắc Phân bổ Lead tự động"
        maxWidth="lg"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Thứ tự ưu tiên phân bổ: <strong>1. Vùng miền (Region)</strong> → <strong>2. Ngành nghề (Industry)</strong> → <strong>3. Phân bổ xoay vòng (Round-Robin)</strong>.
          </p>

          <table className={styles.leadTable} style={{ marginBottom: 16 }}>
            <thead>
              <tr>
                <th>TÊN QUY TẮC</th>
                <th>LOẠI QUY TẮC</th>
                <th>ĐIỀU KIỆN</th>
                <th>ƯU TIÊN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {routingRules.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    Chưa có quy tắc nào
                  </td>
                </tr>
              ) : (
                routingRules.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      <Badge tone="primary">{r.rule_type}</Badge>
                    </td>
                    <td>{r.criteria_value || 'Tất cả'}</td>
                    <td>Mức {r.priority}</td>
                    <td>
                      <Badge tone={r.is_active ? 'success' : 'neutral'}>
                        {r.is_active ? 'Kích hoạt' : 'Tạm tắt'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsRoutingModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
