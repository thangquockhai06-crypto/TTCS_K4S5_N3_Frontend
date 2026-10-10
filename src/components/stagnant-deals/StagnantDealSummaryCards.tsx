import React from 'react';
import {
  AlertOctagon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { IStagnantSummary } from '../../interfaces/stagnant-deal.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './StagnantDealSummaryCards.module.css';

export interface IStagnantDealSummaryCardsProps {
  summary: IStagnantSummary;
  isEvaluating?: boolean;
  onTriggerEvaluation?: () => void;
}

export const StagnantDealSummaryCards: React.FC<IStagnantDealSummaryCardsProps> = ({
  summary,
  isEvaluating,
  onTriggerEvaluation,
}) => {
  return (
    <section className={styles.stagnantSummary} aria-label="Tóm tắt tình trạng cơ hội đình trệ">
      {/* 1. TỔNG GIÁ TRỊ GẶP RỦI RO (At-Risk Pipeline Value) */}
      <article className={`${styles.stagnantSummary__card} ${styles['stagnantSummary__card--danger']}`}>
        <header className={styles.stagnantSummary__header}>
          <span className={styles.stagnantSummary__title}>
            <AlertOctagon size={16} color="#EF4444" />
            Tổng Giá Trị Gặp Rủi Ro
          </span>
          <div className={`${styles.stagnantSummary__iconWrap} ${styles['stagnantSummary__iconWrap--danger']}`}>
            <TrendingDown size={18} />
          </div>
        </header>

        <div>
          <div className={styles.stagnantSummary__value} style={{ color: '#EF4444' }}>
            {formatCurrency(summary.totalAtRiskValue)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Trong tổng số <strong>{summary.totalStagnantDeals} thương vụ</strong> bị gắn cờ
          </p>
        </div>

        <div className={styles.stagnantSummary__meta}>
          <span>Tổn thất trọng số ước tính:</span>
          <strong className={styles.stagnantSummary__metaHighlight} style={{ color: '#EF4444' }}>
            {formatCurrency(summary.totalAtRiskWeightedValue)}
          </strong>
        </div>
      </article>

      {/* 2. CƠ HỘI NGUY CẤP (Critical Severity) */}
      <article className={`${styles.stagnantSummary__card} ${styles['stagnantSummary__card--danger']}`}>
        <header className={styles.stagnantSummary__header}>
          <span className={styles.stagnantSummary__title}>
            <AlertTriangle size={16} color="#EF4444" />
            Mức Độ Nguy Cấp (Đỏ)
          </span>
          <div className={`${styles.stagnantSummary__iconWrap} ${styles['stagnantSummary__iconWrap--danger']}`}>
            <AlertOctagon size={18} />
          </div>
        </header>

        <div>
          <div className={styles.stagnantSummary__value}>
            {summary.criticalSeverityCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>cơ hội</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Vừa quá hạn chốt vừa vượt ngưỡng không hoạt động
          </p>
        </div>

        <div className={styles.stagnantSummary__meta}>
          <span>Cần can thiệp gấp:</span>
          <strong className={styles.stagnantSummary__metaHighlight} style={{ color: '#EF4444' }}>
            {summary.pendingInterventionsCount} cơ hội chưa xử lý
          </strong>
        </div>
      </article>

      {/* 3. PHÂN LOẠI NGUYÊN NHÂN ĐÌNH TRỆ */}
      <article className={`${styles.stagnantSummary__card} ${styles['stagnantSummary__card--warning']}`}>
        <header className={styles.stagnantSummary__header}>
          <span className={styles.stagnantSummary__title}>
            <Clock size={16} color="#F59E0B" />
            Phân Loại Lý Do Gắn Cờ
          </span>
          <div className={`${styles.stagnantSummary__iconWrap} ${styles['stagnantSummary__iconWrap--warning']}`}>
            <Clock size={18} />
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span>Không hoạt động &gt; N ngày:</span>
            <strong style={{ color: '#F59E0B' }}>{summary.inactiveThresholdCount} deals</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span>Quá hạn ngày dự kiến:</span>
            <strong style={{ color: '#EF4444' }}>{summary.overdueCloseDateCount} deals</strong>
          </div>
        </div>

        <div className={styles.stagnantSummary__meta}>
          <span>Đã can thiệp thành công:</span>
          <strong className={styles.stagnantSummary__metaHighlight} style={{ color: '#10B981' }}>
            {summary.resolvedInterventionsCount} deals
          </strong>
        </div>
      </article>

      {/* 4. TÁC VỤ ĐÁNH GIÁ TỰ ĐỘNG HÀNG NGÀY (Daily Cron Task) */}
      <article className={`${styles.stagnantSummary__card} ${styles['stagnantSummary__card--info']}`}>
        <header className={styles.stagnantSummary__header}>
          <span className={styles.stagnantSummary__title}>
            <Sparkles size={16} color="#0EA5E9" />
            Tác Vụ Quét Hàng Ngày
          </span>
          <button
            type="button"
            className={`${styles.stagnantSummary__iconWrap} ${styles['stagnantSummary__iconWrap--info']}`}
            onClick={onTriggerEvaluation}
            title="Kích hoạt quét lại toàn bộ CSDL ngay bây giờ"
            style={{ border: 'none', cursor: 'pointer' }}
            disabled={isEvaluating}
          >
            <RefreshCw size={18} className={isEvaluating ? 'spin' : ''} />
          </button>
        </header>

        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Chạy tự động 00:00 mỗi ngày
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
            {summary.lastEvaluatedAt}
          </p>
        </div>

        <div className={styles.stagnantSummary__meta}>
          <span>Trạng thái máy quét:</span>
          <span style={{ color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} /> Sẵn sàng & Hoạt động
          </span>
        </div>
      </article>
    </section>
  );
};
