import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileCheck2,
  History,
  MessageSquareText,
  RotateCcw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Badge, Button, Modal, SearchBar } from '../components/common';
import { showGlobalToast } from '../context/ToastContext';
import {
  IQuote,
  IQuoteApprovalHistoryEntry,
  QuoteApprovalActionType,
} from '../interfaces/quote.interface';
import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';
import { quoteService } from '../services/quoteService';
import { formatVndCurrency } from '../utils/formatters';
import styles from './QuoteApprovalQueuePage.module.css';

type QueueTabType = 'pending' | 'history';
type DecisionActionType = Extract<
  QuoteApprovalActionType,
  'approved' | 'rejected' | 'returned_for_edit'
>;

const ACTION_LABELS: Record<QuoteApprovalActionType, string> = {
  auto_approved: 'Tự động thông qua',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  returned_for_edit: 'Trả lại chỉnh sửa',
  sent: 'Đã gửi khách hàng',
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Thời gian không hợp lệ'
    : date.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
};

const canReviewQuote = (quote: IQuote, isDirector: boolean): boolean =>
  quote.status === 'pending_approval' &&
  Boolean(quote.approvalLevel) &&
  (isDirector || quote.approvalLevel === 'team_leader');

const historyTone = (
  action: QuoteApprovalActionType
): 'success' | 'danger' | 'warning' | 'neutral' => {
  if (action === 'approved' || action === 'auto_approved' || action === 'sent') return 'success';
  if (action === 'rejected') return 'danger';
  if (action === 'returned_for_edit') return 'warning';
  return 'neutral';
};

export const QuoteApprovalQueuePage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission, isDirector, role } = useAuthorization();
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTabType>('pending');
  const [searchText, setSearchText] = useState<string>('');
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<IQuote | null>(null);
  const [decision, setDecision] = useState<DecisionActionType | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadQuotes = useCallback((): void => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setQuotes(quoteService.getAllQuotes());
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải danh sách báo giá.';
      setLoadError(message);
      showGlobalToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key === null || event.key.startsWith('nexus_quote')) loadQuotes();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadQuotes]);

  const visibleQuotes = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase('vi');
    return quotes
      .filter((quote) =>
        activeTab === 'pending'
          ? canReviewQuote(quote, isDirector)
          : quote.status !== 'pending_approval' &&
            (quote.approvalHistory?.length ?? 0) > 0
      )
      .filter((quote) => {
        if (!normalizedSearch) return true;
        return [
          quote.quoteNumber,
          quote.customerName,
          quote.customerCompany,
          quote.dealTitle,
        ].some((value) => value?.toLocaleLowerCase('vi').includes(normalizedSearch));
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [activeTab, isDirector, quotes, searchText]);

  const openDecision = (quote: IQuote, action: DecisionActionType): void => {
    setSelectedQuote(quote);
    setDecision(action);
    setComment('');
  };

  const closeDecision = (): void => {
    if (isSaving) return;
    setSelectedQuote(null);
    setDecision(null);
    setComment('');
  };

  const handleDecision = (): void => {
    if (!selectedQuote || !decision || !comment.trim()) return;
    setIsSaving(true);
    try {
      quoteService.decideApproval(
        selectedQuote.id,
        decision,
        comment,
        user?.fullName || 'Người duyệt',
        role
      );
      const successMessage: Record<DecisionActionType, string> = {
        approved: 'Đã duyệt báo giá.',
        rejected: 'Đã từ chối báo giá.',
        returned_for_edit: 'Đã trả báo giá về cho người tạo chỉnh sửa.',
      };
      showGlobalToast(successMessage[decision], 'success');
      setSelectedQuote(null);
      setDecision(null);
      setComment('');
      loadQuotes();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể cập nhật quyết định phê duyệt.';
      showGlobalToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPermission('approve_quotes')) {
    return (
      <section className={styles.accessDenied} role="alert">
        <ShieldAlert size={28} />
        <h1>Bạn không có quyền duyệt báo giá</h1>
        <p>Chức năng này dành cho Trưởng nhóm kinh doanh và Giám đốc Kinh doanh.</p>
      </section>
    );
  }

  const pendingCount = quotes.filter((quote) => canReviewQuote(quote, isDirector)).length;
  const processedCount = quotes.filter(
    (quote) =>
      quote.status !== 'pending_approval' && (quote.approvalHistory?.length ?? 0) > 0
  ).length;
  const decisionTitle: Record<DecisionActionType, string> = {
    approved: 'Duyệt báo giá',
    rejected: 'Từ chối báo giá',
    returned_for_edit: 'Trả lại để chỉnh sửa',
  };
  const decisionDescription: Record<DecisionActionType, string> = {
    approved: 'Báo giá sẽ được đánh dấu đã duyệt và mới đủ điều kiện gửi cho khách hàng.',
    rejected: 'Báo giá sẽ bị từ chối và không thể gửi cho khách hàng.',
    returned_for_edit: 'Báo giá sẽ về trạng thái bản nháp để người tạo cập nhật lại.',
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIcon} aria-hidden="true">
          <FileCheck2 size={22} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.eyebrow}>QUẢN LÝ BÁO GIÁ</div>
          <h1>Phê duyệt báo giá theo cấp</h1>
          <p>
            Tự động thông qua dưới 15%; Trưởng nhóm duyệt từ 15%; Giám đốc duyệt trên 20% hoặc
            khi giá bán thấp hơn giá sàn.
          </p>
        </div>
      </header>

      <div className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricIconPending}><Clock3 size={18} /></span>
          <div><strong>{pendingCount}</strong><span>Chờ tôi duyệt</span></div>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricIconDone}><History size={18} /></span>
          <div><strong>{processedCount}</strong><span>Đã có lịch sử xử lý</span></div>
        </article>
      </div>

      <section className={styles.queueCard} aria-label="Danh sách phê duyệt báo giá">
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Lọc báo giá">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pending'}
              className={activeTab === 'pending' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('pending')}
            >
              Chờ tôi duyệt <span>{pendingCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={activeTab === 'history' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('history')}
            >
              Lịch sử
            </button>
          </div>
          <div className={styles.search}>
            <SearchBar
              value={searchText}
              onChange={setSearchText}
              placeholder="Tìm mã báo giá, khách hàng, cơ hội..."
            />
          </div>
        </div>

        {loadError ? (
          <div className={styles.stateMessage} role="alert">
            <AlertCircle size={22} />
            <strong>{loadError}</strong>
            <Button variant="secondary" onClick={loadQuotes}>Tải lại</Button>
          </div>
        ) : isLoading ? (
          <div className={styles.stateMessage} aria-live="polite">Đang tải danh sách báo giá...</div>
        ) : visibleQuotes.length === 0 ? (
          <div className={styles.stateMessage}>
            <CheckCircle2 size={28} />
            <strong>
              {activeTab === 'pending' ? 'Không có báo giá nào cần bạn duyệt' : 'Chưa có lịch sử phù hợp'}
            </strong>
            <span>
              {activeTab === 'pending'
                ? 'Báo giá chờ Trưởng nhóm hoặc Giám đốc sẽ xuất hiện tại đây.'
                : 'Các quyết định và tự động thông qua sẽ được lưu tại đây.'}
            </span>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.quoteTable}>
              <thead>
                <tr>
                  <th>BÁO GIÁ / KHÁCH HÀNG</th>
                  <th>MỨC CHIẾT KHẤU</th>
                  <th>TỔNG CỘNG</th>
                  <th>CẤP DUYỆT / TRẠNG THÁI</th>
                  <th>CẬP NHẬT</th>
                  <th><span className={styles.srOnly}>Chi tiết</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleQuotes.map((quote) => {
                  const isExpanded = expandedQuoteId === quote.id;
                  return (
                    <React.Fragment key={quote.id}>
                      <tr>
                        <td>
                          <strong className={styles.quoteNumber}>{quote.quoteNumber}</strong>
                          <span className={styles.customerName}>
                            {quote.customerCompany || quote.customerName}
                          </span>
                          <span className={styles.dealTitle}>{quote.dealTitle}</span>
                        </td>
                        <td>
                          <strong className={quote.requiresApproval ? styles.discountAlert : ''}>
                            {quote.totalDiscountPercent.toFixed(1)}%
                          </strong>
                          <span className={styles.muted}>Ngưỡng 15% / 20%</span>
                        </td>
                        <td><strong>{formatVndCurrency(quote.grandTotal)}</strong></td>
                        <td>
                          {quote.status === 'pending_approval' ? (
                            <Badge tone="warning">
                              {quote.approvalLevel === 'director' ? 'Giám đốc' : 'Trưởng nhóm'}
                            </Badge>
                          ) : (
                            <Badge tone={quote.status === 'rejected' ? 'danger' : 'success'}>
                              {quote.status === 'draft'
                                ? 'Bản nháp'
                                : quote.status === 'sent'
                                  ? 'Đã gửi khách'
                                  : quote.status === 'rejected'
                                    ? 'Đã từ chối'
                                    : 'Đã duyệt'}
                            </Badge>
                          )}
                          <span className={styles.muted}>Tạo bởi {quote.createdBy}</span>
                        </td>
                        <td>{formatDateTime(quote.updatedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.expandButton}
                            aria-label={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết'}
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={styles.detailRow}>
                          <td colSpan={6}>
                            <div className={styles.detailContent}>
                              <div className={styles.detailColumns}>
                                <section>
                                  <h3>Sản phẩm và điều kiện giá</h3>
                                  <ul className={styles.lineItems}>
                                    {quote.items.map((item) => {
                                      const netUnitPrice =
                                        item.quantity > 0 ? item.lineTotal / item.quantity : item.unitPrice;
                                      const underFloor =
                                        item.floorPrice !== undefined && netUnitPrice < item.floorPrice;
                                      return (
                                        <li key={item.id}>
                                          <div>
                                            <strong>{item.productName || 'Sản phẩm chưa đặt tên'}</strong>
                                            <span>
                                              {item.quantity} {item.unit} · {item.discountAmount > 0
                                                ? `CK ${formatVndCurrency(item.discountAmount)}`
                                                : 'Không chiết khấu'}
                                            </span>
                                          </div>
                                          <div className={styles.linePrices}>
                                            <span>{formatVndCurrency(item.lineTotal)}</span>
                                            {item.floorPrice !== undefined && (
                                              <span className={underFloor ? styles.floorViolation : ''}>
                                                Sàn: {formatVndCurrency(item.floorPrice)}
                                              </span>
                                            )}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </section>
                                <section>
                                  <h3>Lịch sử phê duyệt (chỉ xem)</h3>
                                  <ApprovalHistory entries={quote.approvalHistory ?? []} />
                                </section>
                              </div>
                              {quote.status === 'pending_approval' &&
                                canReviewQuote(quote, isDirector) && (
                                  <div className={styles.actionBar}>
                                    <Button
                                      variant="primary"
                                      leftIcon={<Check size={16} />}
                                      onClick={() => openDecision(quote, 'approved')}
                                    >
                                      Duyệt
                                    </Button>
                                    <Button
                                      variant="danger"
                                      leftIcon={<X size={16} />}
                                      onClick={() => openDecision(quote, 'rejected')}
                                    >
                                      Từ chối
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      leftIcon={<RotateCcw size={16} />}
                                      onClick={() => openDecision(quote, 'returned_for_edit')}
                                    >
                                      Trả lại sửa
                                    </Button>
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.policyNote}>
          <ShieldAlert size={16} />
          <span>
            Mọi quyết định cần có ý kiến. Lịch sử được ghi nối tiếp và chỉ xem; báo giá chưa duyệt
            không thể phát hành cho khách hàng.
          </span>
        </div>
      </section>

      <Modal
        isOpen={Boolean(selectedQuote && decision)}
        onClose={closeDecision}
        title={decision ? decisionTitle[decision] : ''}
        subtitle={selectedQuote?.quoteNumber}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeDecision} disabled={isSaving}>Hủy</Button>
            <Button
              variant={decision === 'rejected' ? 'danger' : 'primary'}
              onClick={handleDecision}
              disabled={!comment.trim() || isSaving}
              isLoading={isSaving}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        {selectedQuote && decision && (
          <div className={styles.decisionForm}>
            <p>{decisionDescription[decision]}</p>
            <div className={styles.decisionSummary}>
              <strong>{selectedQuote.customerCompany || selectedQuote.customerName}</strong>
              <span>
                Chiết khấu {selectedQuote.totalDiscountPercent.toFixed(1)}% ·{' '}
                {formatVndCurrency(selectedQuote.grandTotal)}
              </span>
            </div>
            <label htmlFor="approval-comment">
              <MessageSquareText size={16} /> Ý kiến xử lý <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="approval-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              maxLength={1000}
              required
              placeholder="Nhập lý do và lưu ý cho người tạo báo giá..."
              autoFocus
            />
            <span className={styles.commentHint}>
              Bắt buộc · {comment.length}/1000 ký tự
            </span>
          </div>
        )}
      </Modal>
    </div>
  );
};

const ApprovalHistory: React.FC<{ entries: IQuoteApprovalHistoryEntry[] }> = ({ entries }) => {
  if (entries.length === 0) {
    return <p className={styles.emptyHistory}>Chưa có quyết định nào được ghi nhận.</p>;
  }
  return (
    <ol className={styles.historyList} aria-label="Lịch sử phê duyệt không thể chỉnh sửa">
      {entries.map((entry) => (
        <li key={entry.id}>
          <div className={styles.historyDot} />
          <div className={styles.historyText}>
            <div className={styles.historyHeading}>
              <Badge tone={historyTone(entry.action)} size="sm">{ACTION_LABELS[entry.action]}</Badge>
              <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
            </div>
            <strong>{entry.performedBy} · {entry.performedByRole}</strong>
            <p>{entry.comment}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
