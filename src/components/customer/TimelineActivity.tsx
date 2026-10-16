import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Loader2,
  CheckCircle2,
  ArrowRight,
  Download,
  DollarSign,
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
    visibleItems,
    hasMore,
    isLoadingMore,
    totalCount,
    filters,
    availablePerformers,
    handoverBrief,
    loadMore,
    addTouchpoint,
    togglePin,
    setTypeFilter,
    setPerformerFilter,
    setSearchQuery,
    resetFilters,
  } = useTimelineActivity({ customerId, customer360, initialPageSize: 6 });

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

  // Ref cho sentinel cuộn vô hạn (Infinite Scroll IntersectionObserver)
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore]);

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
        return <PhoneCall size={15} />;
      case 'meeting':
        return <Users size={15} />;
      case 'email':
        return <Mail size={15} />;
      case 'deal_change':
        return <Briefcase size={15} />;
      case 'quote_sent':
        return <FileText size={15} />;
      case 'support_ticket':
        return <AlertCircle size={15} />;
      case 'note':
        return <MessageSquare size={15} />;
      case 'status_touch':
      default:
        return <ShieldCheck size={15} />;
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* ====================================================================
          1. Bảng Tóm Tắt Bối Cảnh Bàn Giao 5 Phút (Handover Executive Brief)
          ==================================================================== */}
      <section className={styles.handoverCard} aria-label="Tóm tắt bối cảnh bàn giao khách hàng">
        <div className={styles.handoverHeader}>
          <div className={styles.handoverTitleWrap}>
            <div className={styles.handoverIconBadge}>
              <Sparkles size={18} />
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
            aria-expanded={isBriefExpanded}
          >
            {isBriefExpanded ? (
              <>
                <ChevronUp size={15} /> Thu gọn
              </>
            ) : (
              <>
                <ChevronDown size={15} /> Mở rộng bối cảnh
              </>
            )}
          </button>
        </div>

        {isBriefExpanded && (
          <>
            {/* 4 Chỉ số tóm tắt nhanh */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricChip}>
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                  <Clock size={16} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Tổng Lần Chạm</span>
                  <span className={styles.metricChipValue}>{handoverBrief.totalTouchpoints} lượt</span>
                </div>
              </div>

              <div className={styles.metricChip}>
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                  <Briefcase size={16} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Cơ Hội Đang Chạy</span>
                  <span className={styles.metricChipValue}>
                    {formatCurrency(handoverBrief.totalDealValue)}
                  </span>
                </div>
              </div>

              <div className={styles.metricChip}>
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                  <FileText size={16} />
                </div>
                <div className={styles.metricChipContent}>
                  <span className={styles.metricChipLabel}>Báo Giá Gần Nhất</span>
                  <span className={styles.metricChipValue}>
                    {formatCurrency(handoverBrief.latestQuoteAmount)}
                  </span>
                </div>
              </div>

              <div className={styles.metricChip}>
                <div className={styles.metricChipIcon} style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <PhoneCall size={16} />
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
                <ShieldCheck size={16} color="#2563EB" />
                <span>Bối cảnh quan hệ &amp; tiến độ hiện tại:</span>
              </div>
              <div>{handoverBrief.keyContextSummary}</div>

              <div className={styles.handoverAdviceHighlight}>
                <ArrowRight size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Hành động tiếp theo đề xuất:</strong> {handoverBrief.handoverAdvice}
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ====================================================================
          2. Bộ Lọc Đa Chiều & Công Cụ (Filter & Toolbar)
          ==================================================================== */}
      <section className={styles.filterCard} aria-label="Bộ lọc dòng thời gian">
        {/* Pills chọn loại hoạt động */}
        <div className={styles.categoryPillsWrap} role="tablist">
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'all' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Tất cả <span className={styles.pillCount}>{countsByType.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'call' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('call')}
          >
            <PhoneCall size={13} /> Cuộc gọi{' '}
            <span className={styles.pillCount}>{countsByType.call}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'meeting' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('meeting')}
          >
            <Users size={13} /> Cuộc họp{' '}
            <span className={styles.pillCount}>{countsByType.meeting}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'email' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('email')}
          >
            <Mail size={13} /> Email{' '}
            <span className={styles.pillCount}>{countsByType.email}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'deal_change' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('deal_change')}
          >
            <Briefcase size={13} /> Thay đổi Cơ hội{' '}
            <span className={styles.pillCount}>{countsByType.deal_change}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'quote_sent' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('quote_sent')}
          >
            <FileText size={13} /> Báo giá &amp; Hợp đồng{' '}
            <span className={styles.pillCount}>{countsByType.quote_sent}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'note' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('note')}
          >
            <MessageSquare size={13} /> Ghi chú CSKH{' '}
            <span className={styles.pillCount}>{countsByType.note}</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryPill} ${filters.type === 'support_ticket' ? styles['categoryPill--active'] : ''}`}
            onClick={() => setTypeFilter('support_ticket')}
          >
            <AlertCircle size={13} /> Phiếu hỗ trợ{' '}
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
              aria-label="Lọc theo người thực hiện"
            >
              <option value="all">👥 Tất cả người thực hiện</option>
              {availablePerformers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.role.split(' ')[0]})
                </option>
              ))}
            </select>

            {/* Ô tìm kiếm từ khóa */}
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, nội dung, ghi chú..."
                className={styles.searchInput}
                value={filters.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
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
            <Clock size={36} style={{ opacity: 0.35, color: '#2563EB' }} />
            <strong style={{ color: '#0F172A' }}>Không tìm thấy tương tác nào phù hợp</strong>
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              Hãy thử thay đổi điều kiện lọc loại hoạt động hoặc người thực hiện.
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className={styles.timelineFeed}>
            {visibleItems.map((item: ITimelineItem) => (
              <div key={item.id} className={styles.timelineItemWrap}>
                {/* Nút icon tròn trên trục thời gian */}
                <div className={`${styles.timelineNodeIcon} ${styles[`timelineNodeIcon--${item.type}`]}`}>
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
                        title={item.isPinned ? 'Bỏ ghim khỏi đầu dòng thời gian' : 'Ghim tương tác quan trọng'}
                        aria-label="Ghim tương tác"
                      >
                        <Pin size={14} />
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

                  {/* Nhãn bổ trợ (Metadata Tags) */}
                  {item.metadata && (
                    <div className={styles.metadataPillsRow}>
                      {item.metadata.duration && (
                        <span className={styles.metaPill}>
                          <Clock size={12} /> Thời lượng: <strong>{item.metadata.duration}</strong>
                        </span>
                      )}

                      {item.metadata.dealValue !== undefined && item.metadata.dealValue > 0 && (
                        <span className={`${styles.metaPill} ${styles['metaPill--highlight']}`}>
                          <DollarSign size={12} /> Giá trị cơ hội:{' '}
                          <strong>{formatCurrency(item.metadata.dealValue)}</strong>
                        </span>
                      )}

                      {item.metadata.newStage && (
                        <span className={`${styles.metaPill} ${styles['metaPill--warning']}`}>
                          <Briefcase size={12} /> Giai đoạn: <strong>{item.metadata.newStage}</strong>
                        </span>
                      )}

                      {item.metadata.quoteAmount !== undefined && item.metadata.quoteAmount > 0 && (
                        <span className={`${styles.metaPill} ${styles['metaPill--success']}`}>
                          <FileText size={12} /> Báo giá:{' '}
                          <strong>{formatCurrency(item.metadata.quoteAmount)}</strong>
                        </span>
                      )}

                      {item.metadata.attachmentName && (
                        <span className={styles.metaPill} title="Tài liệu đính kèm">
                          <Download size={12} /> {item.metadata.attachmentName}{' '}
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
                        >
                          <CheckCircle2 size={12} /> {item.metadata.outcomeLabel}
                        </span>
                      )}

                      {item.metadata.nextAction && (
                        <span className={styles.metaPill} style={{ color: '#2563EB' }}>
                          <ArrowRight size={12} /> Tiếp theo: <strong>{item.metadata.nextAction}</strong>
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
            4. Khu Vực Cuộn Vô Hạn (Infinite Scroll Sentinel & Indicator)
            ==================================================================== */}
        <div className={styles.infiniteScrollArea}>
          {/* Phần tử Sentinel để IntersectionObserver nhận diện khi chạm đáy */}
          <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />

          {isLoadingMore ? (
            <div className={styles.loadingSpinnerWrap}>
              <Loader2 size={18} className="animate-spin" color="#2563EB" />
              <span>Đang tải các lần chạm cũ hơn...</span>
            </div>
          ) : hasMore ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Clock size={14} />}
              onClick={loadMore}
            >
              Tải thêm tương tác cũ hơn (Còn {totalCount - visibleItems.length} lần chạm)
            </Button>
          ) : (
            filteredItems.length > 0 && (
              <div className={styles.allLoadedBadge}>
                <CheckCircle2 size={14} />
                Đã tải toàn bộ lịch sử tương tác của khách hàng này ({totalCount} lần chạm)
              </div>
            )
          )}
        </div>
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
                />
              </div>
            ) : (
              <div className={styles.modalFieldGroup}>
                <label className={styles.modalFieldLabel}>Giai đoạn:</label>
                <input
                  type="text"
                  className={styles.modalFieldControl}
                  placeholder="Ví dụ: Chăm sóc định kỳ, Hỗ trợ kỹ thuật..."
                  value="Chăm sóc khách hàng"
                  readOnly
                />
              </div>
            )}

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Kết quả tương tác:</label>
              <select
                className={styles.modalFieldControl}
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value as TimelineTouchOutcomeType)}
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
              />
            </div>

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Hạn chót thực hiện:</label>
              <input
                type="date"
                className={styles.modalFieldControl}
                value={newNextActionDate}
                onChange={(e) => setNewNextActionDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" leftIcon={<CheckCircle2 size={16} />}>
              Lưu tương tác
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
