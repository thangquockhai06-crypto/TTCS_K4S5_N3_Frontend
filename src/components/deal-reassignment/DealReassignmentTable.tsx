import React from 'react';
import {
  ArrowRightLeft,
  Briefcase,
  Calendar,
  Clock,
  History,
} from 'lucide-react';
import { IReassignableDeal } from '../../interfaces/deal-reassignment.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './DealReassignmentTable.module.css';

export interface IDealReassignmentTableProps {
  deals: ReadonlyArray<IReassignableDeal>;
  selectedDealIds: ReadonlyArray<string>;
  onToggleSelect: (dealId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSingleReassign: (deal: IReassignableDeal) => void;
  onViewHistory: (deal: IReassignableDeal) => void;
}

export const DealReassignmentTable: React.FC<IDealReassignmentTableProps> = ({
  deals,
  selectedDealIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onSingleReassign,
  onViewHistory,
}) => {
  const isAllSelected = deals.length > 0 && selectedDealIds.length === deals.length;

  const handleHeaderCheckboxChange = (): void => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <section className={styles.reassignTableCard} aria-label="Bảng cơ hội kinh doanh cần điều phối">
      <header className={styles.reassignTableCard__header}>
        <h2 className={styles.reassignTableCard__title}>
          <Briefcase size={18} color="var(--color-primary)" />
          Danh Sách Cơ Hội Trong Nhóm ({deals.length})
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Tích chọn các cơ hội để bàn giao nhanh cho nhân sự tiếp nhận mới
        </span>
      </header>

      <div className={styles.reassignTableCard__tableWrap}>
        <table className={styles.reassignTable}>
          <thead>
            <tr>
              <th className={styles.reassignTable__th} style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleHeaderCheckboxChange}
                  title="Chọn tất cả"
                />
              </th>
              <th className={styles.reassignTable__th}>Thương Vụ / Doanh Nghiệp</th>
              <th className={styles.reassignTable__th}>Giá Trị / Giai Đoạn</th>
              <th className={styles.reassignTable__th}>Phụ Trách Hiện Tại</th>
              <th className={styles.reassignTable__th}>Ngày Dự Kiến</th>
              <th className={styles.reassignTable__th}>Tương Tác Cuối</th>
              <th className={styles.reassignTable__th}>Thao Tác Điều Phối</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  Không tìm thấy cơ hội nào phù hợp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const isSelected = selectedDealIds.includes(deal.id);
                const hasHistory = deal.history.length > 0;

                return (
                  <tr
                    key={deal.id}
                    className={`${styles.reassignTable__tr} ${
                      isSelected ? styles['reassignTable__tr--selected'] : ''
                    }`}
                  >
                    {/* Checkbox chọn */}
                    <td className={styles.reassignTable__td}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(deal.id)}
                      />
                    </td>

                    {/* Thương vụ & Khách hàng */}
                    <td className={styles.reassignTable__td}>
                      <div className={styles.reassignTable__dealCell}>
                        {deal.companyAvatar && (
                          <img
                            src={deal.companyAvatar}
                            alt={deal.company}
                            className={styles.reassignTable__companyAvatar}
                          />
                        )}
                        <div className={styles.reassignTable__dealInfo}>
                          <span className={styles.reassignTable__dealTitle} title={deal.title}>
                            {deal.title}
                          </span>
                          <span className={styles.reassignTable__customerName}>
                            {deal.company} · {deal.customerName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Giá trị & Giai đoạn */}
                    <td className={styles.reassignTable__td}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(deal.dealValue)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        {deal.stageName} ({deal.winProbability}%)
                      </span>
                    </td>

                    {/* Phụ trách hiện tại */}
                    <td className={styles.reassignTable__td}>
                      <div className={styles.reassignTable__repCell}>
                        {deal.assignedRepAvatar && (
                          <img
                            src={deal.assignedRepAvatar}
                            alt={deal.assignedRepName}
                            className={styles.reassignTable__repAvatar}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{deal.assignedRepName}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                            {deal.teamName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hạn chốt */}
                    <td className={styles.reassignTable__td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                        <Calendar size={13} color="var(--color-text-muted)" />
                        <span>{deal.expectedCloseDate}</span>
                      </div>
                    </td>

                    {/* Tương tác cuối */}
                    <td className={styles.reassignTable__td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                        <Clock size={13} color="var(--color-text-muted)" />
                        <span>{deal.lastActivityDate}</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        ({deal.daysWithoutActivity} ngày trước)
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className={styles.reassignTable__td}>
                      <div className={styles.reassignTable__actionGroup}>
                        <button
                          type="button"
                          className={styles.reassignTable__btnTransfer}
                          onClick={() => onSingleReassign(deal)}
                        >
                          <ArrowRightLeft size={12} />
                          Bàn Giao
                        </button>

                        {hasHistory && (
                          <button
                            type="button"
                            className={styles.reassignTable__btnHistory}
                            onClick={() => onViewHistory(deal)}
                            title={`Xem lịch sử ${deal.history.length} lần bàn giao`}
                          >
                            <History size={12} />
                            Lịch sử ({deal.history.length})
                          </button>
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
  );
};
