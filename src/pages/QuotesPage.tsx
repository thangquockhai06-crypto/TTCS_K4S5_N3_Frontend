import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeftRight,
  FileCheck2,
  Printer,
  ExternalLink,
  RotateCw,
  Search,
  Copy,
  X,
  FileText,
  DollarSign,
  Users,
  Eye,
  Trash2,
  CopyPlus,
  Sparkles,
} from 'lucide-react';
import { IQuote, QuoteStatusType, QuoteApprovalLevelType } from '../interfaces/quote.interface';
import { IContract } from '../interfaces/contract.interface';
import { quoteService } from '../services/quoteService';
import { formatVndCurrency } from '../utils/formatters';
import { Button, Badge, LoadingSkeleton } from '../components/common';
import { QuoteDiffViewer } from '../components/quote/QuoteDiffViewer';
import { ConvertToContractModal } from '../components/contract/ConvertToContractModal';
import { showGlobalToast } from '../context/ToastContext';
import { useAuthorization } from '../hooks/useAuthorization';
import styles from './QuotesPage.module.css';

type FilterTab = 'all' | 'draft' | 'pending' | 'approved' | 'accepted' | 'contracted' | 'rejected';

export const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthorization();

  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [diffModalQuote, setDiffModalQuote] = useState<IQuote | null>(null);
  const [convertModalQuote, setConvertModalQuote] = useState<IQuote | null>(null);
  const [portalModalQuote, setPortalModalQuote] = useState<IQuote | null>(null);
  const [printModalQuote, setPrintModalQuote] = useState<IQuote | null>(null);

  const loadQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await quoteService.getQuotesAsync();
      setQuotes(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách báo giá:', err);
      showGlobalToast('Không thể tải danh sách báo giá.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter((q) => q.status === 'pending_approval').length;
    const approved = quotes.filter((q) => q.status === 'approved' || q.status === 'sent').length;
    const accepted = quotes.filter((q) => q.status === 'accepted').length;
    const contracted = quotes.filter((q) => Boolean(q.contractId) || Boolean(q.contractNumber)).length;
    const totalRevenue = quotes
      .filter((q) => q.status === 'approved' || q.status === 'sent' || q.status === 'accepted' || Boolean(q.contractId))
      .reduce((sum, q) => sum + (q.grandTotal || 0), 0);

    return { total, pending, approved, accepted, contracted, totalRevenue };
  }, [quotes]);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      // Tab filter
      if (activeTab === 'draft' && q.status !== 'draft') return false;
      if (activeTab === 'pending' && q.status !== 'pending_approval') return false;
      if (activeTab === 'approved' && q.status !== 'approved' && q.status !== 'sent') return false;
      if (activeTab === 'accepted' && q.status !== 'accepted') return false;
      if (activeTab === 'contracted' && !q.contractId && !q.contractNumber) return false;
      if (activeTab === 'rejected' && q.status !== 'rejected') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const numMatch = q.quoteNumber.toLowerCase().includes(query);
        const nameMatch = (q.customerName || '').toLowerCase().includes(query);
        const compMatch = (q.customerCompany || '').toLowerCase().includes(query);
        const dealMatch = (q.dealTitle || '').toLowerCase().includes(query);
        if (!numMatch && !nameMatch && !compMatch && !dealMatch) return false;
      }

      return true;
    });
  }, [quotes, activeTab, searchQuery]);

  // Action handlers
  const handleCopyPortalLink = (accessToken: string) => {
    const origin = window.location.origin;
    const portalUrl = `${origin}/portal/quotes/${accessToken}`;
    navigator.clipboard.writeText(portalUrl).then(
      () => {
        showGlobalToast('Đã sao chép liên kết Cổng khách hàng vào bộ nhớ tạm!', 'success');
      },
      () => {
        showGlobalToast('Không thể tự động sao chép. Vui lòng chọn và copy thủ công.', 'warning');
      }
    );
  };

  const handleOpenPortal = (accessToken: string) => {
    const origin = window.location.origin;
    const portalUrl = `${origin}/portal/quotes/${accessToken}`;
    window.open(portalUrl, '_blank');
  };

  const handleDuplicate = async (quote: IQuote) => {
    try {
      const duplicated = quoteService.duplicateQuote(quote.id);
      showGlobalToast(`Đã nhân bản báo giá "${quote.quoteNumber}" thành bản mới "${duplicated.quoteNumber}"!`, 'success');
      void loadQuotes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi nhân bản báo giá.';
      showGlobalToast(msg, 'error');
    }
  };

  const handleDelete = async (quote: IQuote) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa báo giá "${quote.quoteNumber}" không?`)) {
      return;
    }
    try {
      await quoteService.deleteQuote(quote.id);
      showGlobalToast(`Đã xóa báo giá "${quote.quoteNumber}" thành công.`, 'info');
      void loadQuotes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa báo giá.';
      showGlobalToast(msg, 'error');
    }
  };

  const handleContractCreated = (contract: IContract) => {
    setConvertModalQuote(null);
    showGlobalToast(`Hợp đồng ${contract.contractNumber} đã được lập. Đang tải lại danh sách...`, 'success');
    void loadQuotes();
  };

  const renderStatusBadge = (status: QuoteStatusType, approvalLevel?: QuoteApprovalLevelType) => {
    switch (status) {
      case 'draft':
        return <Badge tone="neutral">Bản nháp</Badge>;
      case 'pending_approval':
        return approvalLevel === 'director' ? (
          <Badge tone="warning">Chờ Giám đốc duyệt</Badge>
        ) : (
          <Badge tone="warning">Chờ Trưởng nhóm duyệt</Badge>
        );
      case 'approved':
        return <Badge tone="success">Đã phê duyệt</Badge>;
      case 'sent':
        return <Badge tone="info">Đã gửi khách</Badge>;
      case 'accepted':
        return <Badge tone="success">Khách chấp thuận</Badge>;
      case 'rejected':
        return <Badge tone="danger">Từ chối</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  return (
    <div className={styles.page}>
      {/* ====================================================================
          1. Header Section
          ==================================================================== */}
      <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FileSpreadsheet size={28} />
          </div>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>
              <Sparkles size={13} /> PHÂN HỆ KINH DOANH &amp; BÁO GIÁ (S7-01 &rarr; S7-07)
            </span>
            <h1 className={styles.title}>Quản Lý Báo Giá &amp; Dự Toán</h1>
            <p className={styles.subtitle}>
              Soạn thảo đa sản phẩm, đa chiết khấu, duyệt phân cấp, so sánh phiên bản trực quan &amp; chuyển đổi hợp đồng.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<RotateCw size={15} />}
            onClick={() => void loadQuotes()}
            title="Làm mới danh sách báo giá"
          >
            Làm mới
          </Button>

          {hasPermission('approve_quotes') && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<Clock size={16} />}
              onClick={() => navigate('/quotes/approvals')}
              title="Đi tới Hàng đợi Phê duyệt Báo giá phân cấp (S7-02)"
            >
              Hàng đợi Duyệt {stats.pending > 0 && `(${stats.pending})`}
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<FileCheck2 size={16} />}
            onClick={() => navigate('/contracts')}
            title="Đi tới Quản lý Hợp đồng & Cảnh báo tái ký (S7-07)"
          >
            Hợp đồng &amp; Tái ký
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/quotes/builder')}
            title="Tạo mới báo giá đa sản phẩm (S7-01)"
          >
            + Soạn Báo Giá Mới
          </Button>
        </div>
      </div>

      {/* ====================================================================
          2. KPI Metrics Grid
          ==================================================================== */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Tổng Báo Giá */}
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconWrap} ${styles.metricIconTotal}`}>
            <FileSpreadsheet size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{stats.total}</span>
            <span className={styles.metricLabel}>Tổng số Báo giá</span>
          </div>
        </div>

        {/* Card 2: Chờ Phê Duyệt */}
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPending}`}>
            <Clock size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue} style={{ color: stats.pending > 0 ? '#d97706' : undefined }}>
              {stats.pending}
            </span>
            <span className={styles.metricLabel}>Chờ Phê duyệt (S7-02)</span>
          </div>
        </div>

        {/* Card 3: Đã Phê Duyệt */}
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconWrap} ${styles.metricIconApproved}`}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue} style={{ color: '#059669' }}>
              {stats.approved}
            </span>
            <span className={styles.metricLabel}>Đã Phê duyệt &amp; Gửi</span>
          </div>
        </div>

        {/* Card 4: Khách Chấp Thuận */}
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAccepted}`}>
            <Users size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue} style={{ color: '#7c3aed' }}>
              {stats.accepted}
            </span>
            <span className={styles.metricLabel}>Khách chấp thuận (S7-06)</span>
          </div>
        </div>

        {/* Card 5: Doanh thu Báo giá */}
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconWrap} ${styles.metricIconRevenue}`}>
            <DollarSign size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue} style={{ color: '#0d9488', fontSize: '1.2rem' }}>
              {formatVndCurrency(stats.totalRevenue)}
            </span>
            <span className={styles.metricLabel}>Giá trị Báo giá hiệu lực</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. Filter & Search Bar
          ==================================================================== */}
      <div className={styles.filterBar}>
        <div className={styles.tabsGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả <span className={styles.tabBadge}>{stats.total}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'draft' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            Bản nháp
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Chờ duyệt <span className={styles.tabBadge}>{stats.pending}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'approved' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Đã duyệt <span className={styles.tabBadge}>{stats.approved}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'accepted' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            Khách chấp thuận <span className={styles.tabBadge}>{stats.accepted}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'contracted' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('contracted')}
          >
            Đã lập Hợp đồng <span className={styles.tabBadge}>{stats.contracted}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'rejected' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Từ chối / Hết hạn
          </button>
        </div>

        <div className={styles.searchWrap}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Tìm theo mã báo giá, khách hàng, cơ hội..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <Search
              size={17}
              style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }}
            />
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. Quotations Data Table
          ==================================================================== */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          {isLoading ? (
            <div style={{ padding: 32 }}>
              <LoadingSkeleton height={50} />
              <div style={{ marginTop: 12 }}>
                <LoadingSkeleton height={200} />
              </div>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FileSpreadsheet size={32} />
              </div>
              <h3 className={styles.emptyTitle}>Không tìm thấy bản báo giá nào</h3>
              <p className={styles.emptyDesc}>
                {searchQuery
                  ? 'Không có kết quả phù hợp với từ khóa tìm kiếm. Thử tìm với điều kiện khác.'
                  : 'Chưa có báo giá nào trong mục này. Bấm nút "+ Soạn Báo Giá Mới" để bắt đầu xây dựng dự toán.'}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={() => navigate('/quotes/builder')}
              >
                + Soạn Báo Giá Đầu Tiên
              </Button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>MÃ BÁO GIÁ &amp; PHIÊN BẢN</th>
                  <th style={{ width: '22%' }}>KHÁCH HÀNG &amp; DOANH NGHIỆP</th>
                  <th style={{ width: '18%' }}>CƠ HỘI / DEAL</th>
                  <th style={{ width: '16%' }}>TỔNG GIÁ TRỊ &amp; CHIẾT KHẤU</th>
                  <th style={{ width: '14%' }}>TRẠNG THÁI</th>
                  <th style={{ width: '16%', textAlign: 'center' }}>THAO TÁC NGHIỆP VỤ</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => {
                  const hasHighDiscount = q.totalDiscountPercent > 20;
                  const hasMediumDiscount = q.totalDiscountPercent > 10 && q.totalDiscountPercent <= 20;

                  return (
                    <tr key={q.id}>
                      {/* Cột 1: Mã Báo giá & Phiên bản */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Link
                            to={`/quotes/builder?quoteId=${q.id}`}
                            className={styles.quoteNumberLink}
                            title="Mở trình soạn thảo báo giá (S7-01)"
                          >
                            <FileText size={15} />
                            {q.quoteNumber}
                          </Link>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className={styles.versionPill}>v{q.version}</span>
                            {q.isEffective && (
                              <span className={styles.effectiveBadge} title="Phiên bản hiệu lực duy nhất của cơ hội này">
                                <CheckCircle2 size={11} /> Hiệu lực
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Khách hàng */}
                      <td>
                        <div className={styles.customerCell}>
                          <div className={styles.customerAvatar}>
                            {(q.customerCompany || q.customerName || 'KH').slice(0, 2).toUpperCase()}
                          </div>
                          <div className={styles.customerInfo}>
                            <span className={styles.customerName}>
                              {q.customerCompany || q.customerName}
                            </span>
                            {q.customerCompany && (
                              <span className={styles.customerCompany}>
                                Người liên hệ: {q.customerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Cơ hội */}
                      <td>
                        <div className={styles.dealTitle} title={q.dealTitle}>
                          {q.dealTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                          Người lập: {q.createdBy || '—'}
                        </div>
                      </td>

                      {/* Cột 4: Giá trị & Chiết khấu */}
                      <td>
                        <div className={styles.priceCol}>
                          <span className={styles.priceGrandTotal}>
                            {formatVndCurrency(q.grandTotal)}
                          </span>
                          {q.totalDiscountPercent > 0 && (
                            <div>
                              {hasHighDiscount ? (
                                <span className={styles.discountAlertTag} title="Chiết khấu vượt 20% - Cần Giám đốc phê duyệt (S7-02)">
                                  <AlertTriangle size={12} /> CK {q.totalDiscountPercent}% (&gt;20%)
                                </span>
                              ) : hasMediumDiscount ? (
                                <span className={styles.discountTag} title="Chiết khấu từ 10.1% - 20% - Cần Trưởng nhóm duyệt (S7-02)">
                                  CK {q.totalDiscountPercent}% (TL duyệt)
                                </span>
                              ) : (
                                <span className={styles.discountTag}>
                                  CK {q.totalDiscountPercent}% (Tự động)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {renderStatusBadge(q.status, q.approvalLevel)}
                          {q.contractNumber && (
                            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                              HĐ: {q.contractNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 6: Thao tác (S7-01 -> S7-07) */}
                      <td>
                        <div className={styles.actionsCell} style={{ justifyContent: 'center' }}>
                          {/* S7-01: Chỉnh sửa / Soạn */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                            onClick={() => navigate(`/quotes/builder?quoteId=${q.id}`)}
                            title="S7-01: Chỉnh sửa / Xem chi tiết trong Quote Builder"
                          >
                            <Eye size={15} />
                          </button>

                          {/* S7-03: So sánh phiên bản (Diff) */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setDiffModalQuote(q)}
                            title="S7-03: So sánh trực quan giữa các phiên bản (Visual Diff)"
                          >
                            <ArrowLeftRight size={15} />
                          </button>

                          {/* S7-05: Mẫu in & PDF Doanh nghiệp */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setPrintModalQuote(q)}
                            title="S7-05: Mẫu in Doanh nghiệp & Xuất file PDF chuẩn"
                          >
                            <Printer size={15} />
                          </button>

                          {/* S7-06: Cổng Khách hàng Trực tuyến */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnPurple}`}
                            onClick={() => setPortalModalQuote(q)}
                            title="S7-06: Cổng thông tin Khách hàng trực tuyến xem & ký duyệt"
                          >
                            <ExternalLink size={15} />
                          </button>

                          {/* S7-04: Chuyển đổi thành Hợp đồng & Đóng thắng Deal */}
                          {(q.status === 'approved' || q.status === 'sent' || q.status === 'accepted') && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                              onClick={() => setConvertModalQuote(q)}
                              title="S7-04: Chuyển đổi Báo giá sang Hợp đồng kinh tế & Đóng thắng Deal"
                            >
                              <FileCheck2 size={15} />
                            </button>
                          )}

                          {/* Duplicate */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => void handleDuplicate(q)}
                            title="Nhân bản thành báo giá mới"
                          >
                            <CopyPlus size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => void handleDelete(q)}
                            title="Xóa báo giá này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ====================================================================
          5. MODAL 1: S7-03 So sánh Phiên bản (QuoteDiffViewer Modal)
          ==================================================================== */}
      {diffModalQuote && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: 1100 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <ArrowLeftRight size={20} color="#2563eb" />
                <h3 className={styles.modalTitle}>
                  Đối Chiếu Phiên Bản Báo Giá — {diffModalQuote.quoteNumber}
                </h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDiffModalQuote(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ padding: 0 }}>
              <QuoteDiffViewer
                dealId={diffModalQuote.dealId}
                initialBaseVersionId={diffModalQuote.id}
                onClose={() => setDiffModalQuote(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          6. MODAL 2: S7-04 Chuyển Đổi Hợp Đồng (ConvertToContractModal)
          ==================================================================== */}
      {convertModalQuote && (
        <ConvertToContractModal
          isOpen={Boolean(convertModalQuote)}
          onClose={() => setConvertModalQuote(null)}
          quote={convertModalQuote}
          onSuccess={handleContractCreated}
        />
      )}

      {/* ====================================================================
          7. MODAL 3: S7-06 Cổng Khách Hàng Trực Tuyến (Public Portal Share)
          ==================================================================== */}
      {portalModalQuote && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: 640 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <ExternalLink size={20} color="#7c3aed" />
                <h3 className={styles.modalTitle}>
                  Cổng Thông Tin Khách Hàng Trực Tuyến (S7-06)
                </h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPortalModalQuote(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                Mỗi báo giá được cấp một mã truy cập bảo mật (Token) duy nhất. Khách hàng nhận được liên kết này có thể trực tiếp mở trình xem báo giá tương tác trên thiết bị di động/máy tính và thực hiện <strong>Chấp thuận</strong> hoặc <strong>Từ chối</strong> báo giá có chữ ký đại diện.
              </p>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: 6 }}>
                  LIÊN KẾT TRUY CẬP DÀNH RIÊNG CHO KHÁCH HÀNG:
                </label>
                <div className={styles.portalLinkBox}>
                  <span style={{ flex: 1, fontFamily: 'monospace' }}>
                    {`${window.location.origin}/portal/quotes/${portalModalQuote.accessToken || portalModalQuote.id}`}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Copy size={14} />}
                    onClick={() => handleCopyPortalLink(portalModalQuote.accessToken || portalModalQuote.id)}
                  >
                    Sao chép Link
                  </Button>
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Khách hàng mục tiêu:</span>
                  <strong>{portalModalQuote.customerCompany || portalModalQuote.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Trạng thái phản hồi hiện tại:</span>
                  <span>{renderStatusBadge(portalModalQuote.status, portalModalQuote.approvalLevel)}</span>
                </div>
                {portalModalQuote.rejectionReason && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Lý do khách từ chối:</span>
                    <strong>{portalModalQuote.rejectionReason}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPortalModalQuote(null)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<ExternalLink size={15} />}
                onClick={() => handleOpenPortal(portalModalQuote.accessToken || portalModalQuote.id)}
              >
                Mở Cổng Trực Tuyến &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          8. MODAL 4: S7-05 Mẫu In Báo Giá & Xuất PDF Chuẩn Doanh Nghiệp
          ==================================================================== */}
      {printModalQuote && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: 840 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <Printer size={20} color="#2563eb" />
                <h3 className={styles.modalTitle}>
                  Mẫu In Chuẩn Doanh Nghiệp — {printModalQuote.quoteNumber} (v{printModalQuote.version})
                </h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPrintModalQuote(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.printPreviewPaper} id="printable-quote-area">
                {/* Header Tiêu đề Doanh nghiệp */}
                <div className={styles.corporateHeader}>
                  <div>
                    <div className={styles.corporateBrand}>CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS CRM</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                      Địa chỉ: Tòa nhà Nexus Tower, Đường Duy Tân, Quận Cầu Giấy, Hà Nội
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Hotline: (024) 8888 9999 · Email: contact@nexuscrm.vn · Website: https://nexuscrm.vn
                    </div>
                  </div>
                  <div className={styles.corporateMeta}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>BÁO GIÁ DỰ TOÁN</div>
                    <div style={{ fontWeight: 700, color: '#2563eb', marginTop: 2 }}>
                      Số: {printModalQuote.quoteNumber}
                    </div>
                    <div style={{ color: '#64748b', marginTop: 2 }}>
                      Ngày lập: {printModalQuote.createdAt?.slice(0, 10)}
                    </div>
                    <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
                      Hiệu lực đến: {printModalQuote.validUntil || 'Theo quy định'}
                    </div>
                  </div>
                </div>

                {/* Khách hàng & Cơ hội */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      ĐƠN VỊ NHẬN BÁO GIÁ:
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                      {printModalQuote.customerCompany || printModalQuote.customerName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 2 }}>
                      Người liên hệ: <strong>{printModalQuote.customerName}</strong>
                    </div>
                    {printModalQuote.customerTaxCode && (
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        Mã số thuế: {printModalQuote.customerTaxCode}
                      </div>
                    )}
                    {printModalQuote.customerAddress && (
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        Địa chỉ: {printModalQuote.customerAddress}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      THÔNG TIN DỰ ÁN &amp; PHỤ TRÁCH:
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                      Dự án: {printModalQuote.dealTitle}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 2 }}>
                      Chuyên viên tư vấn: <strong>{printModalQuote.createdBy || 'Nexus Account Executive'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Phiên bản báo giá: <strong>v{printModalQuote.version}</strong>
                    </div>
                  </div>
                </div>

                {/* Bảng Dòng Sản Phẩm */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 36 }}>STT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Sản phẩm / Dịch vụ</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 55 }}>ĐVT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 50 }}>SL</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Đơn giá (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 100 }}>Chiết khấu</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 120 }}>Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printModalQuote.items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.productName}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.description}</div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVndCurrency(item.unitPrice)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: item.discountAmount > 0 ? '#d97706' : '#64748b' }}>
                          {item.discountAmount > 0 ? `- ${formatVndCurrency(item.discountAmount)}` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                          {formatVndCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tổng cộng & Bằng chữ */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Cộng tiền hàng:</span>
                      <strong>{formatVndCurrency(printModalQuote.subtotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                      <span>Tổng chiết khấu ({printModalQuote.totalDiscountPercent}%):</span>
                      <strong>- {formatVndCurrency(printModalQuote.totalDiscountAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Thuế GTGT (VAT):</span>
                      <strong>{formatVndCurrency(printModalQuote.totalVatAmount)}</strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTop: '2px solid #0f172a',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#0f172a',
                      }}
                    >
                      <span>TỔNG CỘNG:</span>
                      <span style={{ color: '#2563eb' }}>{formatVndCurrency(printModalQuote.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {printModalQuote.totalInWords && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 6,
                      fontSize: '0.84rem',
                      fontStyle: 'italic',
                      marginBottom: 20,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <strong>Số tiền viết bằng chữ:</strong> {printModalQuote.totalInWords}
                  </div>
                )}

                {/* Điều khoản thương mại */}
                <div style={{ fontSize: '0.8rem', color: '#334155', borderTop: '1px dashed #cbd5e1', paddingTop: 12, marginBottom: 28 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>ĐIỀU KHOẢN THƯƠNG MẠI:</div>
                  <div>- Thanh toán: {printModalQuote.paymentTerms || 'Thanh toán 100% trong 15 ngày kể từ ngày nghiệm thu.'}</div>
                  <div>- Bàn giao &amp; Triển khai: {printModalQuote.deliveryTerms || 'Kích hoạt hệ thống trong vòng 24h sau khi ký hợp đồng.'}</div>
                  {printModalQuote.notes && <div>- Ghi chú: {printModalQuote.notes}</div>}
                </div>

                {/* Chữ ký 2 bên */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: 20 }}>
                  <div>
                    <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.84rem' }}>
                      ĐẠI DIỆN KHÁCH HÀNG
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                    <div style={{ height: 70 }} />
                    <div style={{ fontWeight: 600 }}>{printModalQuote.customerName}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.84rem' }}>
                      ĐẠI DIỆN CÔNG TY NEXUS CRM
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                    <div style={{ height: 70 }} />
                    <div style={{ fontWeight: 600 }}>{printModalQuote.createdBy || 'Giám Đốc Bán Hàng'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPrintModalQuote(null)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<Printer size={16} />}
                onClick={() => window.print()}
              >
                In Báo Giá / Xuất PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
