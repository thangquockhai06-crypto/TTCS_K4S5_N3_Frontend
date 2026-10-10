import React from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { IStagnantDeal } from '../../interfaces/stagnant-deal.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './StagnantDealsTable.module.css';

export interface IStagnantDealsTableProps {
  deals: ReadonlyArray<IStagnantDeal>;
  onSelectDealForIntervention: (deal: IStagnantDeal) => void;
}

export const StagnantDealsTable: React.FC<IStagnantDealsTableProps> = ({
  deals,
  onSelectDealForIntervention,
}) => {
  return (
    <section className={styles.stagnantTableCard} aria-label="Bảng cơ hội bị gắn cờ đình trệ">
      <header className={styles.stagnantTableCard__header}>
        <h2 className={styles.stagnantTableCard__title}>
          <ShieldAlert size={18} color="#EF4444" />
          Danh Sách Thương Vụ Gắn Cờ Cần Trưởng Nhóm Xử Lý ({deals.length})
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Cảnh báo tự động dựa trên quy tắc số ngày N & ngày dự kiến chốt
        </span>
      </header>

      <div className={styles.stagnantTableCard__tableWrap}>
        <table className={styles.stagnantTable}>
          <thead>
            <tr>
              <th className={styles.stagnantTable__th}>Thương Vụ / Khách Hàng</th>
              <th className={styles.stagnantTable__th}>Giá Trị / Giai Đoạn</th>
              <th className={styles.stagnantTable__th}>Lý Do Gắn Cờ</th>
              <th className={styles.stagnantTable__th}>Hoạt Động Gần Nhất</th>
              <th className={styles.stagnantTable__th}>Hạn Chốt & Độ Trễ</th>
              <th className={styles.stagnantTable__th}>Phụ Trách</th>
              <th className={styles.stagnantTable__th}>Trạng Thái & Can Thiệp</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  Không có thương vụ nào bị đình trệ trong phạm vi lọc đã chọn.
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const hasInactiveFlag = deal.flagReasons.includes('inactive_threshold');
                const hasOverdueFlag = deal.flagReasons.includes('overdue_close_date');

                return (
                  <tr key={deal.id} className={styles.stagnantTable__tr}>
                    {/* Cột 1: Tên Thương Vụ & Doanh nghiệp */}
                    <td className={styles.stagnantTable__td}>
                      <div className={styles.stagnantTable__dealCell}>
                        {deal.companyAvatar && (
                          <img
                            src={deal.companyAvatar}
                            alt={deal.company}
                            className={styles.stagnantTable__companyAvatar}
                          />
                        )}
                        <div className={styles.stagnantTable__dealInfo}>
                          <span className={styles.stagnantTable__dealTitle} title={deal.title}>
                            {deal.title}
                          </span>
                          <span className={styles.stagnantTable__customerName}>
                            {deal.company} · {deal.customerName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Giá trị thương vụ & Giai đoạn */}
                    <td className={styles.stagnantTable__td}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(deal.dealValue)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        {deal.stageName} ({deal.winProbability}%)
                      </span>
                    </td>

                    {/* Cột 3: Lý do gắn cờ (Flags) */}
                    <td className={styles.stagnantTable__td}>
                      <div className={styles.stagnantTable__flagsWrap}>
                        {hasInactiveFlag && (
                          <span
                            className={`${styles.stagnantTable__flagBadge} ${styles['stagnantTable__flagBadge--danger']}`}
                          >
                            <Clock size={12} />
                            Bất động {deal.daysWithoutActivity} ngày (Ngưỡng {deal.allowedInactiveDays} ngày)
                          </span>
                        )}

                        {hasOverdueFlag && (
                          <span
                            className={`${styles.stagnantTable__flagBadge} ${styles['stagnantTable__flagBadge--warning']}`}
                          >
                            <AlertTriangle size={12} />
                            Quá hạn chốt {deal.daysOverdue} ngày
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 4: Hoạt động gần nhất */}
                    <td className={styles.stagnantTable__td}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {deal.lastActivityDate}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={deal.lastActivityDescription}
                      >
                        {deal.lastActivityDescription}
                      </div>
                    </td>

                    {/* Cột 5: Hạn chốt & Độ trễ */}
                    <td className={styles.stagnantTable__td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                        <Calendar size={13} color="var(--color-text-muted)" />
                        <span>{deal.expectedCloseDate}</span>
                      </div>
                      {deal.daysOverdue > 0 ? (
                        <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 600 }}>
                          Trễ {deal.daysOverdue} ngày
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 500 }}>
                          Chưa đến hạn
                        </span>
                      )}
                    </td>

                    {/* Cột 6: Phụ trách & Nhóm */}
                    <td className={styles.stagnantTable__td}>
                      <div className={styles.stagnantTable__repCell}>
                        {deal.assignedRepAvatar && (
                          <img
                            src={deal.assignedRepAvatar}
                            alt={deal.assignedRepName}
                            className={styles.stagnantTable__repAvatar}
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

                    {/* Cột 7: Can thiệp */}
                    <td className={styles.stagnantTable__td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-start' }}>
                        <span
                          className={`${styles.stagnantTable__statusBadge} ${
                            deal.interventionStatus === 'resolved'
                              ? styles['stagnantTable__statusBadge--resolved']
                              : styles['stagnantTable__statusBadge--pending']
                          }`}
                        >
                          {deal.interventionStatus === 'resolved'
                            ? 'Đã can thiệp'
                            : deal.interventionStatus === 'in_progress'
                            ? 'Đang xử lý'
                            : 'Chờ can thiệp'}
                        </span>

                        <button
                          type="button"
                          className={styles.stagnantTable__actionBtn}
                          onClick={() => onSelectDealForIntervention(deal)}
                        >
                          <ShieldAlert size={12} />
                          Can Thiệp
                        </button>
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
