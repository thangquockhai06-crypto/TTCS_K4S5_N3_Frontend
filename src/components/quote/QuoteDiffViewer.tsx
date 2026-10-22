import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileText,
  DollarSign,
  Calendar,
  CreditCard,
  Truck,
  MessageSquare,
  Search,
  Filter,
  Sparkles,
  Check,
  History,
} from 'lucide-react';
import {
  IQuote,
  IQuoteComparison,
  IQuoteLineItemDiff,
} from '../../interfaces/quote.interface';
import { useQuoteVersions } from '../../hooks/useQuoteVersions';
import { formatVndCurrency } from '../../utils/formatters';
import { Button, Badge, LoadingSkeleton } from '../common';
import styles from './QuoteDiffViewer.module.css';

export interface IQuoteDiffViewerProps {
  dealId: string;
  initialBaseVersionId?: string;
  initialTargetVersionId?: string;
  onClose?: () => void;
  onSelectVersion?: (version: IQuote) => void;
  className?: string;
}

export const QuoteDiffViewer: React.FC<IQuoteDiffViewerProps> = ({
  dealId,
  initialBaseVersionId,
  initialTargetVersionId,
  onClose,
  onSelectVersion,
  className = '',
}) => {
  const {
    versions,
    isLoading,
    setEffective,
    compareVersions,
  } = useQuoteVersions({ dealId });

  // State chọn version A (cơ sở) và version B (đích)
  const [baseVersionId, setBaseVersionId] = useState<string>('');
  const [targetVersionId, setTargetVersionId] = useState<string>('');

  // Lọc hiển thị
  const [filterChangedOnly, setFilterChangedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);

  // Khởi tạo versionId khi versions được tải về
  React.useEffect(() => {
    if (versions.length > 0) {
      if (!baseVersionId) {
        if (initialBaseVersionId && versions.some((v) => v.id === initialBaseVersionId)) {
          setBaseVersionId(initialBaseVersionId);
        } else {
          // Mặc định chọn phiên bản đầu tiên hoặc phiên bản trước phiên bản mới nhất
          setBaseVersionId(versions.length > 1 ? versions[versions.length - 2].id : versions[0].id);
        }
      }

      if (!targetVersionId) {
        if (initialTargetVersionId && versions.some((v) => v.id === initialTargetVersionId)) {
          setTargetVersionId(initialTargetVersionId);
        } else {
          // Mặc định chọn phiên bản mới nhất
          setTargetVersionId(versions[versions.length - 1].id);
        }
      }
    }
  }, [versions, initialBaseVersionId, initialTargetVersionId, baseVersionId, targetVersionId]);

  // Lấy 2 object báo giá theo ID
  const baseQuote = useMemo(() => {
    return versions.find((v) => v.id === baseVersionId) || null;
  }, [versions, baseVersionId]);

  const targetQuote = useMemo(() => {
    return versions.find((v) => v.id === targetVersionId) || null;
  }, [versions, targetVersionId]);

  // Hoán đổi vị trí so sánh (A ⇄ B)
  const handleSwapVersions = () => {
    setBaseVersionId(targetVersionId);
    setTargetVersionId(baseVersionId);
  };

  // Tính toán đối soát khác biệt chi tiết (Diff Calculation)
  const comparison: IQuoteComparison | null = useMemo(() => {
    if (!baseQuote || !targetQuote) return null;
    return compareVersions(baseQuote.id, targetQuote.id);
  }, [baseQuote, targetQuote, compareVersions]);

  // Lọc các dòng sản phẩm theo từ khóa tìm kiếm & chế độ chỉ hiển thị thay đổi
  const filteredLineItemDiffs: IQuoteLineItemDiff[] = useMemo(() => {
    if (!comparison) return [];
    let items = comparison.lineItemDiffs;

    if (filterChangedOnly) {
      items = items.filter((item) => item.changeType !== 'unchanged');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.productName.toLowerCase().includes(q) ||
          (item.productId && item.productId.toLowerCase().includes(q))
      );
    }

    return items;
  }, [comparison, filterChangedOnly, searchQuery]);

  // Xử lý kích hoạt phiên bản đang chọn làm phiên bản hiệu lực duy nhất
  const handleSetEffectiveTarget = async () => {
    if (!targetQuote) return;
    setIsActivating(true);
    try {
      await setEffective(targetQuote.id);
    } finally {
      setIsActivating(false);
    }
  };

  // In / Xuất báo cáo so sánh
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <LoadingSkeleton height={70} />
        <LoadingSkeleton height={140} />
        <LoadingSkeleton height={400} />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={36} color="#DC2626" />
        <h3 className={styles.emptyStateTitle}>Không tìm thấy dữ liệu phiên bản báo giá</h3>
        <p>Báo giá này chưa được tạo hoặc chưa có phiên bản nào trong hệ thống.</p>
        {onClose && (
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            title="Quay lại màn hình trước"
          >
            Quay lại
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.diffContainer} ${className}`}>
      {/* ====================================================================
          1. Header & Breadcrumbs
          ==================================================================== */}
      <div className={styles.topNavRow}>
        <div className={styles.breadcrumbs}>
          <span
            className={styles.breadcrumbLink}
            onClick={onClose}
            title="Quay lại cơ hội hoặc trình soạn báo giá"
          >
            Quản lý Báo giá
          </span>
          <span>/</span>
          <span>{targetQuote?.quoteNumber || baseQuote?.quoteNumber || 'Báo giá'}</span>
          <span>/</span>
          <strong style={{ color: '#0F172A' }}>So sánh phiên bản (QuoteDiffViewer)</strong>
        </div>

        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Printer size={15} />}
            onClick={handlePrint}
            title="In hoặc xuất biên bản đối chiếu phiên bản báo giá ra PDF"
          >
            In / Xuất biên bản
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={15} />}
              onClick={onClose}
              title="Đóng màn hình so sánh và quay lại"
            >
              Đóng so sánh
            </Button>
          )}
        </div>
      </div>

      <header className={styles.headerCard}>
        <div className={styles.headerTitleRow}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIconBadge} title="Chức năng so sánh phiên bản báo giá">
              <ArrowLeftRight size={24} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>
                Đối Chiếu &amp; So Sánh Phiên Bản Báo Giá
              </h1>
              <div className={styles.pageSubtitle}>
                <span>Mã báo giá:</span>
                <strong style={{ color: '#0F172A' }}>
                  {targetQuote?.quoteNumber || baseQuote?.quoteNumber}
                </strong>
                <span>·</span>
                <span>
                  Khách hàng: <strong>{targetQuote?.customerCompany || targetQuote?.customerName}</strong>
                </span>
                <span>·</span>
                <span>
                  Cơ hội: <strong>{targetQuote?.dealTitle}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            2. Side-by-side Version Selection Bar
            ==================================================================== */}
        <section
          className={styles.versionCompareBar}
          aria-label="Chọn phiên bản so sánh cạnh nhau"
        >
          {/* Cột Version A (Cơ sở) */}
          <div
            className={`${styles.versionCard} ${
              baseQuote?.isEffective ? styles['versionCard--effective'] : ''
            }`}
          >
            <div className={styles.versionCardHeader}>
              <span className={styles.versionRoleLabel}>
                <History size={14} /> Phiên bản A (Cơ sở):
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {baseQuote?.isEffective && (
                  <span className={styles.versionEffectiveBadge} title="Phiên bản này đang có hiệu lực pháp lý">
                    <Check size={12} /> Đang hiệu lực
                  </span>
                )}
                <Badge
                  tone={
                    baseQuote?.status === 'sent' || baseQuote?.status === 'approved'
                      ? 'success'
                      : baseQuote?.status === 'pending_approval'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {baseQuote?.status === 'draft'
                    ? 'Bản nháp'
                    : baseQuote?.status === 'pending_approval'
                    ? 'Chờ duyệt'
                    : baseQuote?.status === 'approved'
                    ? 'Đã duyệt'
                    : baseQuote?.status === 'sent'
                    ? 'Đã gửi'
                    : 'Lưu trữ'}
                </Badge>
              </div>
            </div>

            <select
              className={styles.versionSelect}
              value={baseVersionId}
              onChange={(e) => setBaseVersionId(e.target.value)}
              title="Chọn phiên bản A để làm mốc đối chiếu"
              aria-label="Chọn phiên bản A"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Phiên bản v{v.version} ({v.versionLabel || `Bản v${v.version}`}) —{' '}
                  {formatVndCurrency(v.grandTotal)}
                  {v.isEffective ? ' [Đang hiệu lực]' : ''}
                </option>
              ))}
            </select>

            <div className={styles.versionMetaRow}>
              <div>
                <span>Người lập: </span>
                <strong>{baseQuote?.createdBy || '—'}</strong>
              </div>
              <div className={styles.versionPrice}>
                {formatVndCurrency(baseQuote?.grandTotal ?? 0)}
              </div>
            </div>
          </div>

          {/* Nút Hoán đổi 2 bên */}
          <div className={styles.swapCol}>
            <button
              type="button"
              className={styles.swapBtn}
              onClick={handleSwapVersions}
              title="Hoán đổi vị trí so sánh (Phiên bản A ⇄ Phiên bản B)"
              aria-label="Hoán đổi vị trí so sánh hai phiên bản"
            >
              <ArrowLeftRight size={18} />
            </button>
            <span className={styles.swapLabel}>Hoán đổi</span>
          </div>

          {/* Cột Version B (Mới / So sánh) */}
          <div
            className={`${styles.versionCard} ${
              targetQuote?.isEffective ? styles['versionCard--effective'] : ''
            }`}
          >
            <div className={styles.versionCardHeader}>
              <span className={styles.versionRoleLabel}>
                <Sparkles size={14} /> Phiên bản B (So sánh):
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {targetQuote?.isEffective ? (
                  <span className={styles.versionEffectiveBadge} title="Phiên bản này đang có hiệu lực pháp lý">
                    <Check size={12} /> Đang hiệu lực
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<CheckCircle2 size={13} />}
                    onClick={handleSetEffectiveTarget}
                    disabled={isActivating}
                    title="Chỉ một phiên bản ở trạng thái đang hiệu lực tại một thời điểm: Bấm để đặt phiên bản này làm hiệu lực"
                  >
                    Đặt làm hiệu lực
                  </Button>
                )}
                <Badge
                  tone={
                    targetQuote?.status === 'sent' || targetQuote?.status === 'approved'
                      ? 'success'
                      : targetQuote?.status === 'pending_approval'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {targetQuote?.status === 'draft'
                    ? 'Bản nháp'
                    : targetQuote?.status === 'pending_approval'
                    ? 'Chờ duyệt'
                    : targetQuote?.status === 'approved'
                    ? 'Đã duyệt'
                    : targetQuote?.status === 'sent'
                    ? 'Đã gửi'
                    : 'Lưu trữ'}
                </Badge>
              </div>
            </div>

            <select
              className={styles.versionSelect}
              value={targetVersionId}
              onChange={(e) => setTargetVersionId(e.target.value)}
              title="Chọn phiên bản B để so sánh với phiên bản A"
              aria-label="Chọn phiên bản B"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Phiên bản v{v.version} ({v.versionLabel || `Bản v${v.version}`}) —{' '}
                  {formatVndCurrency(v.grandTotal)}
                  {v.isEffective ? ' [Đang hiệu lực]' : ''}
                </option>
              ))}
            </select>

            <div className={styles.versionMetaRow}>
              <div>
                <span>Người lập: </span>
                <strong>{targetQuote?.createdBy || '—'}</strong>
              </div>
              <div className={styles.versionPrice}>
                {formatVndCurrency(targetQuote?.grandTotal ?? 0)}
              </div>
            </div>
          </div>
        </section>
      </header>

      {/* ====================================================================
          3. Tóm tắt Biến Động & KPI Dashboard (Delta Highlights)
          ==================================================================== */}
      {comparison && (
        <section className={styles.summaryBanner} aria-label="Tóm tắt thay đổi giữa 2 phiên bản">
          <div className={styles.summaryHeadline}>
            <FileText size={20} color="#2563EB" />
            <span>
              So sánh giữa <strong>Phiên bản v{baseQuote?.version}</strong> và{' '}
              <strong>Phiên bản v{targetQuote?.version}</strong>:
            </span>
          </div>

          {targetQuote?.changeSummary && (
            <div className={styles.changeReasonBox}>
              <MessageSquare size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Lý do sửa đổi phiên bản v{targetQuote.version}:</strong>{' '}
                {targetQuote.changeSummary}
              </div>
            </div>
          )}

          <div className={styles.kpiGrid}>
            {/* Chênh lệch Tổng giá trị thanh toán */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Biến động Tổng Thanh Toán</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {comparison.grandTotalDiff > 0 ? '+' : ''}
                  {formatVndCurrency(comparison.grandTotalDiff)}
                </span>
                <span
                  className={`${styles.kpiDeltaBadge} ${
                    comparison.grandTotalDiff > 0
                      ? styles['kpiDelta--increase']
                      : comparison.grandTotalDiff < 0
                      ? styles['kpiDelta--decrease']
                      : styles['kpiDelta--neutral']
                  }`}
                >
                  {comparison.grandTotalDiff > 0 ? 'Tăng giá trị' : comparison.grandTotalDiff < 0 ? 'Giảm giá trị' : 'Không đổi'}
                </span>
              </div>
            </div>

            {/* Chênh lệch Tỷ lệ Chiết khấu */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Biến động Chiết Khấu</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {baseQuote?.totalDiscountPercent.toFixed(1)}% → {targetQuote?.totalDiscountPercent.toFixed(1)}%
                </span>
                <span
                  className={`${styles.kpiDeltaBadge} ${
                    comparison.discountPercentDiff > 0
                      ? styles['kpiDelta--increase']
                      : comparison.discountPercentDiff < 0
                      ? styles['kpiDelta--decrease']
                      : styles['kpiDelta--neutral']
                  }`}
                >
                  {comparison.discountPercentDiff > 0 ? `+${comparison.discountPercentDiff.toFixed(1)}%` : `${comparison.discountPercentDiff.toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Thống kê biến động dòng sản phẩm */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Dòng Sản Phẩm &amp; Dịch Vụ</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  +{comparison.totalAddedItems} / -{comparison.totalRemovedItems} / ~{comparison.totalModifiedItems}
                </span>
                <span className={`${styles.kpiDeltaBadge} ${styles['kpiDelta--neutral']}`}>
                  {comparison.totalUnchangedItems} giữ nguyên
                </span>

              </div>
            </div>

            {/* Trạng thái Hiệu lực quy định */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Phiên Bản Đang Hiệu Lực</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#059669' }}>
                  {versions.find((v) => v.isEffective)
                    ? `v${versions.find((v) => v.isEffective)?.version}`
                    : 'Chưa chỉ định'}
                </span>
                <span className={`${styles.kpiDeltaBadge} ${styles['kpiDelta--decrease']}`}>
                  Hiệu lực duy nhất
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          4. Toolbar Lọc & Chú giải màu sắc (Filter & Legend Bar)
          ==================================================================== */}
      <section className={styles.toolbarCard} aria-label="Bộ lọc so sánh dòng sản phẩm">
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterBtn} ${!filterChangedOnly ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilterChangedOnly(false)}
            title="Hiển thị tất cả các dòng sản phẩm bao gồm cả mục giữ nguyên"
          >
            Tất cả hạng mục ({comparison?.lineItemDiffs.length || 0})
          </button>

          <button
            type="button"
            className={`${styles.filterBtn} ${filterChangedOnly ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilterChangedOnly(true)}
            title="Chỉ hiển thị các dòng sản phẩm có sự thay đổi (Thêm mới, Đã xóa hoặc Điều chỉnh)"
          >
            <Filter size={14} />
            Chỉ mục thay đổi (
            {(comparison?.totalAddedItems || 0) +
              (comparison?.totalRemovedItems || 0) +
              (comparison?.totalModifiedItems || 0)}
            )
          </button>

          <div style={{ position: 'relative', minWidth: 240 }}>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.versionSelect}
              style={{ paddingLeft: 36, height: 38 }}
              title="Tìm kiếm sản phẩm trong danh sách đối chiếu"
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }}
            />
          </div>
        </div>

        <div className={styles.legendBar}>
          <span>Chú giải thay đổi:</span>
          <span className={`${styles.legendTag} ${styles['tag--added']}`}>+ Thêm mới</span>
          <span className={`${styles.legendTag} ${styles['tag--removed']}`}>- Đã xóa</span>
          <span className={`${styles.legendTag} ${styles['tag--modified']}`}>~ Điều chỉnh</span>
          <span className={`${styles.legendTag} ${styles['tag--unchanged']}`}>= Giữ nguyên</span>
        </div>
      </section>

      {/* ====================================================================
          5. Bảng So Sánh Chi Tiết Cạnh Nhau (Side-by-Side Table)
          ==================================================================== */}
      <section className={styles.tableCard} aria-label="Bảng so sánh chi tiết sản phẩm">
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            <Layers size={18} color="#2563EB" />
            Chi Tiết Từng Dòng Sản Phẩm &amp; Dịch Vụ
          </h2>
          <span style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Hiển thị <strong>{filteredLineItemDiffs.length}</strong> dòng
          </span>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.diffTable}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>SẢN PHẨM / DỊCH VỤ</th>
                <th style={{ width: '25%' }}>PHIÊN BẢN A (v{baseQuote?.version})</th>
                <th style={{ width: '12%', textAlign: 'center' }}>TRẠNG THÁI</th>
                <th style={{ width: '25%' }}>PHIÊN BẢN B (v{targetQuote?.version})</th>
                <th style={{ width: '16%', textAlign: 'right' }}>CHÊNH LỆCH (DELTA)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLineItemDiffs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                    Không có dòng sản phẩm nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLineItemDiffs.map((diffItem) => {
                  const rowClass =
                    diffItem.changeType === 'added'
                      ? styles['row--added']
                      : diffItem.changeType === 'removed'
                      ? styles['row--removed']
                      : diffItem.changeType === 'modified'
                      ? styles['row--modified']
                      : styles['row--unchanged'];

                  return (
                    <tr key={diffItem.id} className={rowClass}>
                      {/* Cột Tên sản phẩm */}
                      <td>
                        <div className={styles.productNameCell}>
                          <span className={styles.productTitle}>{diffItem.productName}</span>
                          <span className={styles.productSub}>
                            Đơn vị: {diffItem.unit}
                            {diffItem.productId ? ` · ${diffItem.productId}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Cột Chi tiết ở Phiên bản A */}
                      <td>
                        {diffItem.oldItem ? (
                          <div
                            className={`${styles.itemSnapshot} ${
                              diffItem.changeType === 'removed' ? styles['itemSnapshot--strike'] : ''
                            }`}
                          >
                            <span className={styles.itemPriceLine}>
                              {formatVndCurrency(diffItem.oldItem.lineTotal)}
                            </span>
                            <span className={styles.itemDetailLine}>
                              {diffItem.oldItem.quantity} {diffItem.oldItem.unit} ×{' '}
                              {formatVndCurrency(diffItem.oldItem.unitPrice)}
                            </span>
                            {diffItem.oldItem.discountAmount > 0 && (
                              <span className={styles.itemDetailLine} style={{ color: '#D97706' }}>
                                Chiết khấu: {diffItem.oldItem.discountValue}
                                {diffItem.oldItem.discountType === 'percent' ? '%' : ' đ'} (
                                {formatVndCurrency(diffItem.oldItem.discountAmount)})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                            (Chưa có trong bản này)
                          </span>
                        )}
                      </td>

                      {/* Cột Tag Trạng thái */}
                      <td style={{ textAlign: 'center' }}>
                        {diffItem.changeType === 'added' && (
                          <span className={`${styles.legendTag} ${styles['tag--added']}`}>
                            + Thêm mới
                          </span>
                        )}
                        {diffItem.changeType === 'removed' && (
                          <span className={`${styles.legendTag} ${styles['tag--removed']}`}>
                            - Đã xóa
                          </span>
                        )}
                        {diffItem.changeType === 'modified' && (
                          <span className={`${styles.legendTag} ${styles['tag--modified']}`}>
                            ~ Thay đổi
                          </span>
                        )}
                        {diffItem.changeType === 'unchanged' && (
                          <span className={`${styles.legendTag} ${styles['tag--unchanged']}`}>
                            = Giữ nguyên
                          </span>
                        )}
                      </td>

                      {/* Cột Chi tiết ở Phiên bản B */}
                      <td>
                        {diffItem.newItem ? (
                          <div className={styles.itemSnapshot}>
                            <span className={styles.itemPriceLine}>
                              {formatVndCurrency(diffItem.newItem.lineTotal)}
                            </span>
                            <span className={styles.itemDetailLine}>
                              {diffItem.newItem.quantity} {diffItem.newItem.unit} ×{' '}
                              {formatVndCurrency(diffItem.newItem.unitPrice)}
                            </span>
                            {diffItem.newItem.discountAmount > 0 && (
                              <span className={styles.itemDetailLine} style={{ color: '#D97706' }}>
                                Chiết khấu: {diffItem.newItem.discountValue}
                                {diffItem.newItem.discountType === 'percent' ? '%' : ' đ'} (
                                {formatVndCurrency(diffItem.newItem.discountAmount)})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                            (Đã loại bỏ trong bản này)
                          </span>
                        )}
                      </td>

                      {/* Cột Chênh lệch Delta */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.deltaCell}>
                          <span
                            className={
                              diffItem.lineTotalDiff > 0
                                ? styles.deltaPos
                                : diffItem.lineTotalDiff < 0
                                ? styles.deltaNeg
                                : styles.deltaZero
                            }
                          >
                            {diffItem.lineTotalDiff > 0 ? '+' : ''}
                            {formatVndCurrency(diffItem.lineTotalDiff)}
                          </span>
                          {diffItem.quantityDiff !== 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                              SL: {diffItem.quantityDiff > 0 ? `+${diffItem.quantityDiff}` : diffItem.quantityDiff}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====================================================================
          6. Đối Chiếu Tài Chính & Điều Khoản Thương Mại (2 Cột)
          ==================================================================== */}
      {comparison && baseQuote && targetQuote && (
        <div className={styles.twoColGrid}>
          {/* Cột Trái: Bảng Tổng Hợp Tài Chính */}
          <section className={styles.breakdownCard} aria-label="Bảng so sánh tổng hợp tài chính">
            <h3 className={styles.cardSectionTitle}>
              <DollarSign size={18} color="#2563EB" />
              Tổng Hợp Tài Chính &amp; Chiết Khấu
            </h3>

            <table className={styles.financeTable}>
              <thead>
                <tr>
                  <th>CHỈ SỐ TÀI CHÍNH</th>
                  <th>BẢN v{baseQuote.version}</th>
                  <th>BẢN v{targetQuote.version}</th>
                  <th>CHÊNH LỆCH</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tổng tiền trước thuế (Subtotal)</td>
                  <td>{formatVndCurrency(baseQuote.subtotal)}</td>
                  <td>{formatVndCurrency(targetQuote.subtotal)}</td>
                  <td className={comparison.subtotalDiff > 0 ? styles.deltaPos : comparison.subtotalDiff < 0 ? styles.deltaNeg : styles.deltaZero}>
                    {comparison.subtotalDiff > 0 ? '+' : ''}
                    {formatVndCurrency(comparison.subtotalDiff)}
                  </td>
                </tr>
                <tr>
                  <td>
                    Chiết khấu thương mại ({targetQuote.totalDiscountPercent.toFixed(1)}%)
                  </td>
                  <td style={{ color: '#D97706' }}>
                    -{formatVndCurrency(baseQuote.totalDiscountAmount)}
                  </td>
                  <td style={{ color: '#D97706' }}>
                    -{formatVndCurrency(targetQuote.totalDiscountAmount)}
                  </td>
                  <td className={styles.deltaZero}>
                    {comparison.discountAmountDiff > 0 ? '+' : ''}
                    {formatVndCurrency(comparison.discountAmountDiff)}
                  </td>
                </tr>
                <tr>
                  <td>Thuế GTGT (VAT)</td>
                  <td>{formatVndCurrency(baseQuote.totalVatAmount)}</td>
                  <td>{formatVndCurrency(targetQuote.totalVatAmount)}</td>
                  <td className={comparison.vatAmountDiff > 0 ? styles.deltaPos : comparison.vatAmountDiff < 0 ? styles.deltaNeg : styles.deltaZero}>
                    {comparison.vatAmountDiff > 0 ? '+' : ''}
                    {formatVndCurrency(comparison.vatAmountDiff)}
                  </td>
                </tr>
                <tr className={styles.financeGrandTotalRow}>
                  <td>TỔNG THANH TOÁN (Grand Total)</td>
                  <td>{formatVndCurrency(baseQuote.grandTotal)}</td>
                  <td>{formatVndCurrency(targetQuote.grandTotal)}</td>
                  <td className={comparison.grandTotalDiff > 0 ? styles.deltaPos : comparison.grandTotalDiff < 0 ? styles.deltaNeg : styles.deltaZero}>
                    {comparison.grandTotalDiff > 0 ? '+' : ''}
                    {formatVndCurrency(comparison.grandTotalDiff)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Cột Phải: Đối Chiếu Điều Khoản Thương Mại */}
          <section className={styles.breakdownCard} aria-label="So sánh điều khoản thương mại">
            <h3 className={styles.cardSectionTitle}>
              <CreditCard size={18} color="#2563EB" />
              Điều Khoản Thương Mại &amp; Bàn Giao
            </h3>

            <div className={styles.termsList}>
              {/* Ngày hết hiệu lực */}
              <div
                className={`${styles.termItem} ${
                  comparison.termsDiff.validUntilChanged ? styles['termItem--changed'] : ''
                }`}
              >
                <div className={styles.termItemHeader}>
                  <span>
                    <Calendar size={14} /> Thời hạn hiệu lực báo giá
                  </span>
                  {comparison.termsDiff.validUntilChanged && (
                    <span className={`${styles.legendTag} ${styles['tag--modified']}`}>Có thay đổi</span>
                  )}
                </div>
                <div className={styles.termSideBySide}>
                  <div className={styles.termSideCol}>
                    <label>Bản v{baseQuote.version}:</label>
                    <span>{comparison.termsDiff.oldValidUntil}</span>
                  </div>
                  <div className={styles.termSideCol}>
                    <label>Bản v{targetQuote.version}:</label>
                    <span style={{ fontWeight: comparison.termsDiff.validUntilChanged ? 700 : 400 }}>
                      {comparison.termsDiff.newValidUntil}
                    </span>
                  </div>
                </div>
              </div>

              {/* Điều khoản thanh toán */}
              <div
                className={`${styles.termItem} ${
                  comparison.termsDiff.paymentTermsChanged ? styles['termItem--changed'] : ''
                }`}
              >
                <div className={styles.termItemHeader}>
                  <span>
                    <CreditCard size={14} /> Điều khoản thanh toán
                  </span>
                  {comparison.termsDiff.paymentTermsChanged && (
                    <span className={`${styles.legendTag} ${styles['tag--modified']}`}>Có thay đổi</span>
                  )}
                </div>
                <div className={styles.termSideBySide}>
                  <div className={styles.termSideCol}>
                    <label>Bản v{baseQuote.version}:</label>
                    <span>{comparison.termsDiff.oldPaymentTerms}</span>
                  </div>
                  <div className={styles.termSideCol}>
                    <label>Bản v{targetQuote.version}:</label>
                    <span style={{ fontWeight: comparison.termsDiff.paymentTermsChanged ? 700 : 400 }}>
                      {comparison.termsDiff.newPaymentTerms}
                    </span>
                  </div>
                </div>
              </div>

              {/* Điều khoản giao hàng / triển khai */}
              <div
                className={`${styles.termItem} ${
                  comparison.termsDiff.deliveryTermsChanged ? styles['termItem--changed'] : ''
                }`}
              >
                <div className={styles.termItemHeader}>
                  <span>
                    <Truck size={14} /> Điều khoản giao hàng &amp; triển khai
                  </span>
                  {comparison.termsDiff.deliveryTermsChanged && (
                    <span className={`${styles.legendTag} ${styles['tag--modified']}`}>Có thay đổi</span>
                  )}
                </div>
                <div className={styles.termSideBySide}>
                  <div className={styles.termSideCol}>
                    <label>Bản v{baseQuote.version}:</label>
                    <span>{comparison.termsDiff.oldDeliveryTerms}</span>
                  </div>
                  <div className={styles.termSideCol}>
                    <label>Bản v{targetQuote.version}:</label>
                    <span style={{ fontWeight: comparison.termsDiff.deliveryTermsChanged ? 700 : 400 }}>
                      {comparison.termsDiff.newDeliveryTerms}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghi chú báo giá */}
              {(baseQuote.notes || targetQuote.notes) && (
                <div
                  className={`${styles.termItem} ${
                    comparison.termsDiff.notesChanged ? styles['termItem--changed'] : ''
                  }`}
                >
                  <div className={styles.termItemHeader}>
                    <span>
                      <MessageSquare size={14} /> Ghi chú nội bộ
                    </span>
                    {comparison.termsDiff.notesChanged && (
                      <span className={`${styles.legendTag} ${styles['tag--modified']}`}>Có thay đổi</span>
                    )}
                  </div>
                  <div className={styles.termSideBySide}>
                    <div className={styles.termSideCol}>
                      <label>Bản v{baseQuote.version}:</label>
                      <span>{comparison.termsDiff.oldNotes || '—'}</span>
                    </div>
                    <div className={styles.termSideCol}>
                      <label>Bản v{targetQuote.version}:</label>
                      <span>{comparison.termsDiff.newNotes || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================
          7. Lịch Sử Toàn Bộ Phiên Bản (Version History Timeline)
          ==================================================================== */}
      <section className={styles.historyCard} aria-label="Lịch sử các phiên bản của báo giá">
        <h3 className={styles.cardSectionTitle}>
          <History size={18} color="#2563EB" />
          Tiến Trình Phiên Bản Báo Giá (Version Audit Trail)
        </h3>

        <ul className={styles.timelineList}>
          {versions.map((ver) => {
            const isComparingA = ver.id === baseVersionId;
            const isComparingB = ver.id === targetVersionId;
            return (
              <li
                key={ver.id}
                className={`${styles.timelineItem} ${
                  ver.isEffective
                    ? styles['timelineItem--effective']
                    : isComparingB || isComparingA
                    ? styles['timelineItem--active']
                    : ''
                }`}
              >
                <div className={styles.timelineHeading}>
                  <span className={styles.timelineVersionTitle}>
                    Phiên bản v{ver.version} ({ver.versionLabel || `Bản v${ver.version}`})
                  </span>
                  <span className={styles.versionPrice}>
                    {formatVndCurrency(ver.grandTotal)}
                  </span>
                  {ver.isEffective && (
                    <span className={styles.versionEffectiveBadge}>
                      <Check size={12} /> Đang hiệu lực
                    </span>
                  )}
                  <Badge
                    tone={
                      ver.status === 'sent' || ver.status === 'approved'
                        ? 'success'
                        : ver.status === 'pending_approval'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {ver.status === 'draft'
                      ? 'Bản nháp'
                      : ver.status === 'pending_approval'
                      ? 'Chờ duyệt'
                      : ver.status === 'approved'
                      ? 'Đã duyệt'
                      : ver.status === 'sent'
                      ? 'Đã gửi khách'
                      : 'Lưu trữ'}
                  </Badge>
                  {onSelectVersion && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectVersion(ver)}
                      title={`Mở phiên bản v${ver.version} vào trình soạn thảo`}
                    >
                      Mở soạn thảo
                    </Button>
                  )}
                </div>

                <div className={styles.timelineSummaryText}>
                  {ver.changeSummary ? (
                    <>
                      <strong>Lý do sửa đổi:</strong> {ver.changeSummary}
                    </>
                  ) : (
                    'Khởi tạo ban đầu kế thừa từ cơ hội bán hàng.'
                  )}
                </div>

                <div className={styles.timelineMeta}>
                  Tạo bởi <strong>{ver.createdBy}</strong> ({ver.creatorRole}) lúc{' '}
                  <time dateTime={ver.createdAt}>
                    {new Date(ver.createdAt).toLocaleString('vi-VN')}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
