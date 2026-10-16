import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Users,
  Mail,
  Briefcase,
  FileText,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Search,
  Plus,
  Pin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  ArrowRight,
  Download,
  DollarSign,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  ITimelineItem,
  TimelineItemType,
  ICreateTimelineItemDTO,
  TimelineTouchOutcomeType,
} from '../../interfaces/timeline.interface';
import { ICustomer360 } from '../../interfaces/customer.interface';
import { useTimelineActivity } from '../../hooks/useTimelineActivity';
import { formatCurrency } from '../../utils/formatters';
import { Button, Modal } from '../common';
import styles from './TimelineActivity.module.css';

export interface ITimelineActivityProps {
  customerId: string;
  customer360?: ICustomer360 | null;
  onActivityAdded?: () => void;
  className?: string;
}

export const TimelineActivity: React.FC<ITimelineActivityProps> = ({
  customerId,
  customer360,
  onActivityAdded,
  className = '',
}) => {
  const {
    allItems,
    filteredItems,
    paginatedItems,
    totalCount,
    filters,
    pagination,
    currentPage,
    pageSize,
    totalPages,
    availablePerformers,
    handoverBrief,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    addTouchpoint,
    togglePin,
    setTypeFilter,
    setPerformerFilter,
    setSearchQuery,
    resetFilters,
  } = useTimelineActivity({ customerId, customer360, initialPageSize: 5 });

  // Trạng thái thu gọn/mở rộng bảng tóm tắt bàn giao 5 phút
  const [isBriefExpanded, setIsBriefExpanded] = useState<boolean>(true);

  // Modal tạo tương tác mới
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newType, setNewType] = useState<TimelineItemType>('call');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPerformerName, setNewPerformerName] = useState<string>('Hoàng Minh Tuấn');
  const [newDuration, setNewDuration] = useState<string>('30 phút');
  const [newQuoteAmount, setNewQuoteAmount] = useState<number | undefined>(undefined);
  const [newOutcome, setNewOutcome] = useState<TimelineTouchOutcomeType>('success');
  const [newNextAction, setNewNextAction] = useState<string>('');
  const [newNextActionDate, setNewNextActionDate] = useState<string>('');

  // Thống kê số lượng theo từng loại tương tác
  const countsByType = useMemo(() => {
    const map: Record<string, number> = {
      all: allItems.length,
      call: 0,
      meeting: 0,
      email: 0,
      deal_change: 0,
      quote_sent: 0,
      note: 0,
      support_ticket: 0,
    };
    allItems.forEach((item) => {
      if (map[item.type] !== undefined) {
        map[item.type]++;
      }
    });
    return map;
  }, [allItems]);

  // Xử lý nộp form tạo tương tác mới
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const dto: ICreateTimelineItemDTO = {
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Đã hoàn tất tương tác với khách hàng.',
      performerName: newPerformerName,
      duration: newType === 'call' || newType === 'meeting' ? newDuration : undefined,
      quoteAmount: newType === 'quote_sent' ? newQuoteAmount : undefined,
      outcome: newOutcome,
      nextAction: newNextAction.trim() || undefined,
      nextActionDate: newNextActionDate.trim() || undefined,
    };

    addTouchpoint(dto);
    setIsAddModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewNextAction('');
    setNewNextActionDate('');

    if (onActivityAdded) {
      onActivityAdded();
    }
  };

  // Render icon đại diện tương ứng với từng loại tương tác
  const renderItemIcon = (type: TimelineItemType) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={17} />;
      case 'meeting':
        return <Users size={17} />;
      case 'email':
        return <Mail size={17} />;
      case 'deal_change':
        return <Briefcase size={17} />;
      case 'quote_sent':
        return <FileText size={17} />;
      case 'support_ticket':
        return <AlertCircle size={17} />;
      case 'note':
        return <MessageSquare size={17} />;
      case 'status_touch':
      default:
        return <ShieldCheck size={17} />;
    }
  };

  // Tạo dải số trang phân trang thông minh
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className={`${styles.container} ${className}`}>
      {/* ====================================================================
          1. Bảng Tóm Tắt Bối Cảnh Bàn Giao 5 Phút (Handover Executive Brief)
          ==================================================================== */}
      <section className={styles.handoverCard} aria-label="Tóm tắt bối cảnh bàn giao khách hàng">
        <div className={styles.handoverHeader}>
          <div className={styles.handoverTitleWrap}>
            <div className={styles.handoverIconBadge}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className={styles.handoverTitle}>
                Tóm Tắt Bối Cảnh Bàn Giao Khách Hàng (5-Minute Handover Brief)
              </h3>
              <p className={styles.handoverSubtitle}>
                Tổng hợp thông tin cốt lõi giúp nhân sự CSKH tiếp nhận khách từ đồng nghiệp nắm trọn bối cảnh trong 5 phút
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.handoverToggleBtn}
            onClick={() => setIsBriefExpanded(!isBriefExpanded)}
            title={isBriefExpanded ? 'Thu gọn bảng tóm tắt bối cảnh bàn giao' : 'Mở rộng bảng tóm tắt bối cảnh bàn giao'}
            aria-expanded={isBriefExpanded}
          >
            {isBriefExpanded ? (
              <>
                <ChevronUp size={16} /> Thu gọn
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Mở rộng bối cảnh
              </>
            )}
          </button>
        </div>

        {isBriefExpanded && (
          <>
            {/* 4 Chỉ số tóm tắt nhanh */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricChip} title="Tổng số lượt tương tác đa kênh đã thực hiện">
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                  <Clock size={18} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Tổng Lần Chạm</span>
                  <span className={styles.metricChipValue}>{handoverBrief.totalTouchpoints} lượt</span>
                </div>
              </div>

              <div className={styles.metricChip} title="Tổng giá trị cơ hội đang thảo luận với khách hàng">
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                  <Briefcase size={18} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Cơ Hội Đang Chạy</span>
                  <span className={styles.metricChipValue}>
                    {formatCurrency(handoverBrief.totalDealValue)}
                  </span>
                </div>
              </div>

              <div className={styles.metricChip} title="Giá trị bản báo giá gần đây nhất gửi cho khách">
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                  <FileText size={18} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Báo Giá Gần Nhất</span>
                  <span className={styles.metricChipValue}>
                    {formatCurrency(handoverBrief.latestQuoteAmount)}
                  </span>
                </div>
              </div>

              <div className={styles.metricChip} title="Thời điểm diễn ra tương tác chăm sóc mới nhất">
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <PhoneCall size={18} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Chăm Sóc Gần Nhất</span>
                  <span className={styles.metricChipValue}>{handoverBrief.lastTouchpointDate}</span>
                </div>
              </div>
            </div>

            {/* Bối cảnh cốt lõi & Lời khuyên hành động tiếp theo */}
            <div className={styles.contextSummaryBox}>
              <div className={styles.contextSummaryLead}>
                <ShieldCheck size={18} color="#2563EB" />
                <span>Bối cảnh quan hệ &amp; tiến độ hiện tại:</span>
              </div>
              <div>{handoverBrief.keyContextSummary}</div>

              <div className={styles.handoverAdviceHighlight}>
                <ArrowRight size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Hành động tiếp theo đề xuất:</strong> {handoverBrief.handoverAdvice}
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ====================================================================
          2. Bộ Lọc Đa Chiều & Tìm Kiếm & Công Cụ (Filter & Toolbar)
          ==================================================================== */}
      <section className={styles.filterCard} aria-label="Bộ lọc và tìm kiếm dòng thời gian">
        {/* Pills chọn loại hoạt động - Không để đè nhau */}
        <div className={styles.categoryPillsWrap} role="tablist">
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'all' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('all')}
            title="Lọc xem tất cả tương tác khách hàng"
          >
            Tất cả <span className={styles.pillCount}>{countsByType.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'call' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('call')}
            title="Lọc chỉ hiển thị các cuộc gọi tư vấn"
          >
            <PhoneCall size={15} /> Cuộc gọi{' '}
            <span className={styles.pillCount}>{countsByType.call}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'meeting' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('meeting')}
            title="Lọc chỉ hiển thị các cuộc họp & trao đổi"
          >
            <Users size={15} /> Cuộc họp{' '}
            <span className={styles.pillCount}>{countsByType.meeting}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'email' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('email')}
            title="Lọc chỉ hiển thị các email trao đổi"
          >
            <Mail size={15} /> Email{' '}
            <span className={styles.pillCount}>{countsByType.email}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'deal_change' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('deal_change')}
            title="Lọc chỉ hiển thị thay đổi giai đoạn cơ hội & giá trị deal"
          >
            <Briefcase size={15} /> Thay đổi Cơ hội{' '}
            <span className={styles.pillCount}>{countsByType.deal_change}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'quote_sent' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('quote_sent')}
            title="Lọc chỉ hiển thị các báo giá & hợp đồng thương mại đã gửi"
          >
            <FileText size={15} /> Báo giá &amp; Hợp đồng{' '}
            <span className={styles.pillCount}>{countsByType.quote_sent}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'note' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('note')}
            title="Lọc chỉ hiển thị ghi chú chăm sóc khách hàng nội bộ"
          >
            <MessageSquare size={15} /> Ghi chú CSKH{' '}
            <span className={styles.pillCount}>{countsByType.note}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'support_ticket' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('support_ticket')}
            title="Lọc chỉ hiển thị các phiếu hỗ trợ kỹ thuật"
          >
            <AlertCircle size={15} /> Phiếu hỗ trợ{' '}
            <span className={styles.pillCount}>{countsByType.support_ticket}</span>
          </button>
        </div>

        {/* Thanh công cụ: Lọc theo người thực hiện, Tìm kiếm & Nút thêm tương tác */}
        <div className={styles.toolbarRow}>
          <div className={styles.filterControlsLeft}>
            {/* Lọc theo người thực hiện */}
            <select
              className={styles.performerSelect}
              value={filters.performerId}
              onChange={(e) => setPerformerFilter(e.target.value)}
              title="Chọn nhân viên để lọc danh sách tương tác"
              aria-label="Lọc theo người thực hiện"
            >
              <option value="all">👥 Tất cả người thực hiện</option>
              {availablePerformers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.role.split(' ')[0]})
                </option>
              ))}
            </select>

            {/* Ô tìm kiếm từ khóa với icon xóa tức thì */}
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, ghi chú, người phụ trách..."
                className={styles.searchInput}
                value={filters.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                title="Nhập từ khóa để tìm kiếm tương tác (tiêu đề, ghi chú, người phụ trách...)"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  title="Xóa từ khóa tìm kiếm và hiển thị lại toàn bộ"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Nút đặt lại bộ lọc nếu đang có bộ lọc hoặc từ khóa */}
            {(filters.type !== 'all' || filters.performerId !== 'all' || filters.searchQuery) && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={resetFilters}
                title="Đặt lại toàn bộ bộ lọc và ô tìm kiếm về mặc định"
              >
                Đặt lại
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
            title="Ghi nhận thêm một lần chạm hoặc tương tác mới với khách hàng"
          >
            + Ghi nhận tương tác mới
          </Button>
        </div>
      </section>

      {/* ====================================================================
          3. Dòng Thời Gian Trực Quan (Vertical Visual Timeline Feed)
          ==================================================================== */}
      <section className={styles.timelineSection} aria-label="Danh sách tương tác">
        {filteredItems.length === 0 ? (
          <div className={styles.emptyStateWrap}>
            <Clock size={40} style={{ opacity: 0.35, color: '#2563EB' }} />
            <strong style={{ color: '#0F172A', fontSize: '1.05rem' }}>
              Không tìm thấy tương tác nào phù hợp
            </strong>
            <p style={{ margin: 0, fontSize: '0.9375rem' }}>
              {filters.searchQuery
                ? `Không có kết quả nào chứa từ khóa "${filters.searchQuery}". Hãy thử từ khóa khác hoặc xóa bộ lọc.`
                : 'Hãy thử thay đổi điều kiện lọc loại hoạt động hoặc người thực hiện.'}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={resetFilters}
              title="Đặt lại toàn bộ bộ lọc và ô tìm kiếm về mặc định"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className={styles.timelineFeed}>
            {paginatedItems.map((item: ITimelineItem) => (
              <div key={item.id} className={styles.timelineItemWrap}>
                {/* Nút icon tròn trên trục thời gian */}
                <div
                  className={`${styles.timelineNodeIcon} ${styles[`timelineNodeIcon--${item.type}`]}`}
                  title={`Loại tương tác: ${item.typeLabel}`}
                >
                  {renderItemIcon(item.type)}
                </div>

                {/* Thẻ nội dung mốc tương tác */}
                <div
                  className={`${styles.timelineCard} ${
                    item.isPinned ? styles['timelineCard--pinned'] : ''
                  }`}
                >
                  {/* Header thẻ */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <span className={`${styles.cardTypeBadge} ${styles[`cardTypeBadge--${item.type}`]}`}>
                        {item.typeLabel}
                      </span>
                      <h4 className={styles.cardTitleText}>{item.title}</h4>
                    </div>

                    <div className={styles.cardHeaderRight}>
                      <span className={styles.timestampText} title={item.timestamp}>
                        {item.relativeTime}
                      </span>
                      <button
                        type="button"
                        className={`${styles.pinBtn} ${item.isPinned ? styles['pinBtn--active'] : ''}`}
                        onClick={() => togglePin(item.id)}
                        title={item.isPinned ? 'Bỏ ghim tương tác này khỏi đầu trang' : 'Ghim tương tác quan trọng này lên đầu dòng thời gian'}
                        aria-label="Ghim tương tác"
                      >
                        <Pin size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Thanh thông tin người thực hiện */}
                  <div className={styles.performerBar}>
                    <img
                      src={item.performer.avatarUrl}
                      alt={item.performer.name}
                      className={styles.performerAvatar}
                    />
                    <span className={styles.performerName}>{item.performer.name}</span>
                    <span className={styles.performerRole}>· {item.performer.role}</span>
                  </div>

                  {/* Nội dung chi tiết buổi làm việc */}
                  {item.description && (
                    <p className={styles.cardDescription}>{item.description}</p>
                  )}

                  {/* Nhãn bổ trợ (Metadata Tags) - Không để đè nhau */}
                  {item.metadata && (
                    <div className={styles.metadataPillsRow}>
                      {item.metadata.duration && (
                        <span className={styles.metaPill} title={`Thời lượng diễn ra tương tác: ${item.metadata.duration}`}>
                          <Clock size={13} /> Thời lượng: <strong>{item.metadata.duration}</strong>
                        </span>
                      )}

                      {item.metadata.dealValue !== undefined && item.metadata.dealValue > 0 && (
                        <span className={`${styles.metaPill} ${styles['metaPill--highlight']}`} title={`Giá trị cơ hội: ${formatCurrency(item.metadata.dealValue)}`}>
                          <DollarSign size={13} /> Giá trị cơ hội:{' '}
                          <strong>{formatCurrency(item.metadata.dealValue)}</strong>
                        </span>
                      )}

                      {item.metadata.newStage && (
                        <span className={`${styles.metaPill} ${styles['metaPill--warning']}`} title={`Giai đoạn cơ hội mới: ${item.metadata.newStage}`}>
                          <Briefcase size={13} /> Giai đoạn: <strong>{item.metadata.newStage}</strong>
                        </span>
                      )}

                      {item.metadata.quoteAmount !== undefined && item.metadata.quoteAmount > 0 && (
                        <span className={`${styles.metaPill} ${styles['metaPill--success']}`} title={`Giá trị báo giá: ${formatCurrency(item.metadata.quoteAmount)}`}>
                          <FileText size={13} /> Báo giá:{' '}
                          <strong>{formatCurrency(item.metadata.quoteAmount)}</strong>
                        </span>
                      )}

                      {item.metadata.attachmentName && (
                        <span className={styles.metaPill} title={`Tải xuống tài liệu đính kèm: ${item.metadata.attachmentName}`}>
                          <Download size={13} /> {item.metadata.attachmentName}{' '}
                          {item.metadata.attachmentSize && `(${item.metadata.attachmentSize})`}
                        </span>
                      )}

                      {item.metadata.outcomeLabel && (
                        <span
                          className={`${styles.metaPill} ${
                            item.metadata.outcome === 'success'
                              ? styles['metaPill--success']
                              : item.metadata.outcome === 'followup_required'
                              ? styles['metaPill--warning']
                              : ''
                          }`}
                          title={`Kết quả ghi nhận: ${item.metadata.outcomeLabel}`}
                        >
                          <CheckCircle2 size={13} /> {item.metadata.outcomeLabel}
                        </span>
                      )}

                      {item.metadata.nextAction && (
                        <span className={styles.metaPill} style={{ color: '#2563EB' }} title={`Hành động tiếp theo cần làm: ${item.metadata.nextAction}`}>
                          <ArrowRight size={13} /> Tiếp theo: <strong>{item.metadata.nextAction}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====================================================================
            4. Khu Vực Phân Trang Chuẩn Hệ Thống (Pagination Bar)
            ==================================================================== */}
        {filteredItems.length > 0 && (
          <div className={styles.paginationWrap}>
            <div className={styles.paginationInfo}>
              <span>
                Hiển thị <strong>{pagination.startIndex} - {pagination.endIndex}</strong> trên <strong>{pagination.totalItems}</strong> tương tác (Trang {currentPage} / {totalPages})
              </span>

              <div className={styles.pageSizeWrap}>
                <label htmlFor="timelinePageSize" style={{ fontSize: '0.875rem', color: '#64748B' }}>
                  Hiển thị:
                </label>
                <select
                  id="timelinePageSize"
                  className={styles.pageSizeSelect}
                  value={pageSize}
                  onChange={(e) => changePageSize(Number(e.target.value))}
                  title="Chọn số lượng tương tác hiển thị trên mỗi trang"
                >
                  <option value={5}>5 mục / trang</option>
                  <option value={10}>10 mục / trang</option>
                  <option value={15}>15 mục / trang</option>
                  <option value={20}>20 mục / trang</option>
                </select>
              </div>
            </div>

            <div className={styles.paginationButtons}>
              {/* Trang đầu */}
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={currentPage <= 1}
                onClick={() => goToPage(1)}
                title="Về trang đầu tiên"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Trang trước */}
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={currentPage <= 1}
                onClick={prevPage}
                title="Chuyển về trang trước"
              >
                <ChevronLeft size={16} /> Trước
              </button>

              {/* Các số trang */}
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.paginationBtn} ${p === currentPage ? styles['paginationBtn--active'] : ''}`}
                  onClick={() => goToPage(p)}
                  title={`Chuyển đến trang ${p}`}
                >
                  {p}
                </button>
              ))}

              {/* Trang sau */}
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={currentPage >= totalPages}
                onClick={nextPage}
                title="Chuyển sang trang tiếp theo"
              >
                Sau <ChevronRight size={16} />
              </button>

              {/* Trang cuối */}
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(totalPages)}
                title="Đến trang cuối cùng"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ====================================================================
          5. Modal Ghi Nhận Lần Chạm Mới (Add Touchpoint Modal Form)
          ==================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ghi Nhận Tương Tác / Lần Chạm Mới"
        subtitle="Cập nhật nhật ký cuộc gọi, cuộc họp, email hoặc báo giá để đồng nghiệp nắm bối cảnh"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitAdd} className={styles.modalForm}>
          <div className={styles.formRow2}>
            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Loại hoạt động:</label>
              <select
                className={styles.modalFieldControl}
                value={newType}
                onChange={(e) => setNewType(e.target.value as TimelineItemType)}
                title="Chọn loại hoạt động tương tác"
              >
                <option value="call">📞 Cuộc gọi tư vấn</option>
                <option value="meeting">🤝 Cuộc họp trực tiếp / Online</option>
                <option value="email">✉️ Email trao đổi</option>
                <option value="note">📝 Ghi chú bàn giao nội bộ</option>
                <option value="quote_sent">📄 Báo giá / Đề xuất thương mại</option>
                <option value="deal_change">💼 Thay đổi trạng thái Cơ hội</option>
              </select>
            </div>

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Người thực hiện:</label>
              <select
                className={styles.modalFieldControl}
                value={newPerformerName}
                onChange={(e) => setNewPerformerName(e.target.value)}
                title="Chọn nhân viên thực hiện tương tác này"
              >
                {availablePerformers.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.modalFieldGroup}>
            <label className={styles.modalFieldLabel}>Tiêu đề tương tác:</label>
            <input
              type="text"
              className={styles.modalFieldControl}
              placeholder="Ví dụ: Họp bàn giao yêu cầu kỹ thuật & thống nhất điều khoản hợp đồng..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              title="Nhập tiêu đề tóm tắt buổi làm việc"
              required
            />
          </div>

          <div className={styles.formRow2}>
            {newType === 'call' || newType === 'meeting' ? (
              <div className={styles.modalFieldGroup}>
                <label className={styles.modalFieldLabel}>Thời lượng:</label>
                <input
                  type="text"
                  className={styles.modalFieldControl}
                  placeholder="Ví dụ: 30 phút, 1 giờ..."
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  title="Nhập thời lượng cuộc gọi hoặc cuộc họp"
                />
              </div>
            ) : newType === 'quote_sent' ? (
              <div className={styles.modalFieldGroup}>
                <label className={styles.modalFieldLabel}>Giá trị báo giá (VNĐ):</label>
                <input
                  type="number"
                  className={styles.modalFieldControl}
                  placeholder="Ví dụ: 185000000"
                  value={newQuoteAmount || ''}
                  onChange={(e) => setNewQuoteAmount(Number(e.target.value))}
                  title="Nhập tổng giá trị bản báo giá"
                />
              </div>
            ) : (
              <div className={styles.modalFieldGroup}>
                <label className={styles.modalFieldLabel}>Giai đoạn:</label>
                <input
                  type="text"
                  className={styles.modalFieldControl}
                  value="Chăm sóc khách hàng"
                  readOnly
                  title="Giai đoạn nghiệp vụ"
                />
              </div>
            )}

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Kết quả tương tác:</label>
              <select
                className={styles.modalFieldControl}
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value as TimelineTouchOutcomeType)}
                title="Chọn kết quả đạt được sau buổi làm việc"
              >
                <option value="success">✓ Thành công tốt đẹp</option>
                <option value="followup_required">⚠️ Cần theo dõi tiếp</option>
                <option value="pending_decision">⏳ Đang chờ khách duyệt</option>
                <option value="rescheduled">📅 Đã dời lịch hẹn</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFieldGroup}>
            <label className={styles.modalFieldLabel}>Nội dung chi tiết &amp; Cam kết tiếp theo:</label>
            <textarea
              className={styles.modalTextarea}
              placeholder="Ghi lại các ý chính trao đổi, thắc mắc của khách và hành động cần bàn giao cho đồng nghiệp..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              title="Nhập nội dung biên bản trao đổi và các lưu ý"
              required
            />
          </div>

          <div className={styles.formRow2}>
            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Hành động tiếp theo (Next Action):</label>
              <input
                type="text"
                className={styles.modalFieldControl}
                placeholder="Ví dụ: Gọi lại chốt lịch ký số hợp đồng..."
                value={newNextAction}
                onChange={(e) => setNewNextAction(e.target.value)}
                title="Nhập hành động tiếp theo cần người tiếp nhận thực hiện"
              />
            </div>

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Hạn chót thực hiện:</label>
              <input
                type="date"
                className={styles.modalFieldControl}
                value={newNextActionDate}
                onChange={(e) => setNewNextActionDate(e.target.value)}
                title="Chọn ngày hạn chót thực hiện hành động tiếp theo"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              title="Hủy bỏ và đóng cửa sổ ghi nhận"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<CheckCircle2 size={16} />}
              title="Lưu tương tác này vào hồ sơ khách hàng"
            >
              Lưu tương tác
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
