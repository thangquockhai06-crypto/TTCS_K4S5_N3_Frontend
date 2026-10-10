import React from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import { IRepWorkloadStat } from '../../interfaces/deal-reassignment.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './DealReassignmentSummaryCards.module.css';

export interface IDealReassignmentSummaryCardsProps {
  totalDealsCount: number;
  selectedDealsCount: number;
  selectedDealsTotalValue: number;
  totalTransfersCount: number;
  workloadStats: ReadonlyArray<IRepWorkloadStat>;
}

export const DealReassignmentSummaryCards: React.FC<IDealReassignmentSummaryCardsProps> = ({
  totalDealsCount,
  selectedDealsCount,
  selectedDealsTotalValue,
  totalTransfersCount,
  workloadStats,
}) => {
  const overloadedCount = workloadStats.filter((w) => w.status === 'overloaded').length;
  const onLeaveCount = workloadStats.filter((w) => w.status === 'on_leave').length;

  return (
    <section className={styles.reassignSummary} aria-label="Thống kê điều phối và tải trọng nhân sự">
      {/* 1. TỔNG CƠ HỘI ĐANG QUẢN LÝ */}
      <article className={`${styles.reassignSummary__card} ${styles['reassignSummary__card--primary']}`}>
        <header className={styles.reassignSummary__header}>
          <span className={styles.reassignSummary__title}>
            <Briefcase size={16} />
            Tổng Cơ Hội Đang Chạy
          </span>
          <div className={`${styles.reassignSummary__iconWrap} ${styles['reassignSummary__iconWrap--primary']}`}>
            <Briefcase size={18} />
          </div>
        </header>

        <div>
          <div className={styles.reassignSummary__value}>
            {totalDealsCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>thương vụ</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Phân bổ cho <strong>{workloadStats.length} chuyên viên kinh doanh</strong>
          </p>
        </div>

        <div className={styles.reassignSummary__meta}>
          <span>Đang chọn để chuyển giao:</span>
          <strong style={{ color: selectedDealsCount > 0 ? '#2563EB' : 'inherit' }}>
            {selectedDealsCount} deal ({formatCurrency(selectedDealsTotalValue)})
          </strong>
        </div>
      </article>

      {/* 2. CẢNH BÁO NHÂN SỰ QUÁ TẢI */}
      <article className={`${styles.reassignSummary__card} ${styles['reassignSummary__card--warning']}`}>
        <header className={styles.reassignSummary__header}>
          <span className={styles.reassignSummary__title}>
            <AlertTriangle size={16} color="#F59E0B" />
            Nhân Sự Quá Tải (&gt; 8 Deals)
          </span>
          <div className={`${styles.reassignSummary__iconWrap} ${styles['reassignSummary__iconWrap--warning']}`}>
            <AlertTriangle size={18} />
          </div>
        </header>

        <div>
          <div className={styles.reassignSummary__value} style={{ color: overloadedCount > 0 ? '#F59E0B' : 'inherit' }}>
            {overloadedCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>chuyên viên</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Cần san sẻ bớt thương vụ để tránh giảm tỷ lệ chốt
          </p>
        </div>

        <div className={styles.reassignSummary__meta}>
          <span>Trạng thái sức chứa:</span>
          <strong>{overloadedCount > 0 ? 'Có nhân sự cần hỗ trợ' : 'Tải trọng cân bằng'}</strong>
        </div>
      </article>

      {/* 3. NHÂN SỰ NGHỈ DÀI NGÀY / VẮNG MẶT */}
      <article className={`${styles.reassignSummary__card} ${styles['reassignSummary__card--accent']}`}>
        <header className={styles.reassignSummary__header}>
          <span className={styles.reassignSummary__title}>
            <Clock size={16} color="#8B5CF6" />
            Nghỉ Dài Ngày / Vắng Mặt
          </span>
          <div className={`${styles.reassignSummary__iconWrap} ${styles['reassignSummary__iconWrap--accent']}`}>
            <Clock size={18} />
          </div>
        </header>

        <div>
          <div className={styles.reassignSummary__value} style={{ color: '#8B5CF6' }}>
            {onLeaveCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>chuyên viên</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Nghỉ phép năm, thai sản hoặc ốm đau dài ngày
          </p>
        </div>

        <div className={styles.reassignSummary__meta}>
          <span>Yêu cầu bàn giao:</span>
          <strong style={{ color: '#8B5CF6' }}>Bàn giao ngay tránh nguội deal</strong>
        </div>
      </article>

      {/* 4. NHẬT KÝ ĐIỀU CHUYỂN TOÀN NHÓM */}
      <article className={`${styles.reassignSummary__card} ${styles['reassignSummary__card--success']}`}>
        <header className={styles.reassignSummary__header}>
          <span className={styles.reassignSummary__title}>
            <History size={16} color="#10B981" />
            Lịch Sử Bàn Giao Cơ Hội
          </span>
          <div className={`${styles.reassignSummary__iconWrap} ${styles['reassignSummary__iconWrap--success']}`}>
            <ArrowRightLeft size={18} />
          </div>
        </header>

        <div>
          <div className={styles.reassignSummary__value}>
            {totalTransfersCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>lần bàn giao</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Ghi nhận minh bạch 100% kèm lý do và ghi chú
          </p>
        </div>

        <div className={styles.reassignSummary__meta}>
          <span>Kiểm toán nội bộ:</span>
          <span style={{ color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} /> Lưu vết đầy đủ
          </span>
        </div>
      </article>
    </section>
  );
};
