import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  PieChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
} from 'lucide-react';
import { IForecastSummary } from '../../interfaces/forecast.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './ForecastSummaryCards.module.css';

export interface IForecastSummaryCardsProps {
  summary: IForecastSummary;
}

export const ForecastSummaryCards: React.FC<IForecastSummaryCardsProps> = ({ summary }) => {
  const isGapPositive = summary.gapToTarget <= 0;
  const progressCapped = Math.min(100, Math.max(0, summary.quotaAchievementRate));
  const wonProgressCapped = Math.min(100, Math.max(0, summary.actualWonAchievementRate));

  return (
    <section className={styles.forecastSummary} aria-label="Tóm tắt dự báo doanh số và chỉ tiêu">
      {/* 1. DỰ BÁO TRỌNG SỐ XÁC SUẤT (Tính năng trọng tâm) */}
      <article className={`${styles.forecastSummary__card} ${styles['forecastSummary__card--primary']}`}>
        <header className={styles.forecastSummary__header}>
          <span className={styles.forecastSummary__title}>
            <Calculator size={16} />
            Dự báo Trọng số Xác suất
          </span>
          <div className={styles.forecastSummary__iconWrap}>
            <TrendingUp size={18} />
          </div>
        </header>

        <div>
          <div className={styles.forecastSummary__value}>
            {formatCurrency(summary.weightedForecastValue)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Kỳ vọng từ <strong>{summary.inProgressDealsCount} cơ hội</strong> đang tiến hành (∑ Giá trị × % Thắng)
          </p>
        </div>

        <div className={styles.forecastSummary__meta}>
          <span>Tổng dự kiến chốt kỳ này:</span>
          <strong className={styles.forecastSummary__metaHighlight}>
            {formatCurrency(summary.totalProjectedValue)}
          </strong>
        </div>
      </article>

      {/* 2. SỐ ĐÃ CHỐT THỰC TẾ (Actual Won Closed) */}
      <article className={`${styles.forecastSummary__card} ${styles['forecastSummary__card--success']}`}>
        <header className={styles.forecastSummary__header}>
          <span className={styles.forecastSummary__title}>
            <CheckCircle2 size={16} />
            Đã Chốt Thực Tế (Won)
          </span>
          <div className={`${styles.forecastSummary__iconWrap} ${styles['forecastSummary__iconWrap--success']}`}>
            <CheckCircle2 size={18} />
          </div>
        </header>

        <div>
          <div className={styles.forecastSummary__value}>
            {formatCurrency(summary.actualWonValue)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Đã ký kết từ <strong>{summary.wonDealsCount} hợp đồng</strong> chính thức
          </p>
        </div>

        <div className={styles.forecastSummary__progressContainer}>
          <div className={styles.forecastSummary__progressBar}>
            <div
              className={`${styles.forecastSummary__progressFill} ${styles['forecastSummary__progressFill--success']}`}
              style={{ width: `${wonProgressCapped}%` }}
            />
          </div>
          <div className={styles.forecastSummary__meta}>
            <span>Tỷ lệ chốt / Chỉ tiêu:</span>
            <span className={`${styles.forecastSummary__metaHighlight} ${styles['forecastSummary__metaHighlight--positive']}`}>
              {summary.actualWonAchievementRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </article>

      {/* 3. TỔNG CƠ HỘI PIPELINE (Unweighted Pipeline) */}
      <article className={`${styles.forecastSummary__card} ${styles['forecastSummary__card--warning']}`}>
        <header className={styles.forecastSummary__header}>
          <span className={styles.forecastSummary__title}>
            <PieChart size={16} />
            Tổng Giá Trị Pipeline
          </span>
          <div className={`${styles.forecastSummary__iconWrap} ${styles['forecastSummary__iconWrap--warning']}`}>
            <PieChart size={18} />
          </div>
        </header>

        <div>
          <div className={styles.forecastSummary__value}>
            {formatCurrency(summary.pipelineValue)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Tổng giá trị thô chưa tính trọng số ({summary.totalDealsCount} cơ hội)
          </p>
        </div>

        <div className={styles.forecastSummary__meta}>
          <span>Hệ số quy đổi trọng số:</span>
          <strong className={styles.forecastSummary__metaHighlight}>
            {summary.pipelineValue > 0
              ? `${((summary.weightedForecastValue / summary.pipelineValue) * 100).toFixed(1)}%`
              : '0%'}
          </strong>
        </div>
      </article>

      {/* 4. CHỈ TIÊU & TIẾN ĐỘ HOÀN THÀNH (Quota Target & Gap) */}
      <article className={`${styles.forecastSummary__card} ${styles['forecastSummary__card--accent']}`}>
        <header className={styles.forecastSummary__header}>
          <span className={styles.forecastSummary__title}>
            <Target size={16} />
            Chỉ Tiêu & Độ Lệch (Target)
          </span>
          <div className={`${styles.forecastSummary__iconWrap} ${styles['forecastSummary__iconWrap--accent']}`}>
            <Target size={18} />
          </div>
        </header>

        <div>
          <div className={styles.forecastSummary__value}>
            {formatCurrency(summary.totalQuotaTarget)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Chỉ tiêu giao cho phạm vi lọc đang chọn
          </p>
        </div>

        <div className={styles.forecastSummary__progressContainer}>
          <div className={styles.forecastSummary__progressBar}>
            <div
              className={`${styles.forecastSummary__progressFill} ${styles['forecastSummary__progressFill--primary']}`}
              style={{ width: `${progressCapped}%` }}
            />
          </div>
          <div className={styles.forecastSummary__meta}>
            <span>Dự kiến đạt:</span>
            <span
              className={`${styles.forecastSummary__metaHighlight} ${
                isGapPositive
                  ? styles['forecastSummary__metaHighlight--positive']
                  : styles['forecastSummary__metaHighlight--negative']
              }`}
            >
              {isGapPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {summary.quotaAchievementRate.toFixed(1)}% ({isGapPositive ? 'Vượt chỉ tiêu' : `Thiếu ${formatCurrency(Math.abs(summary.gapToTarget))}`})
            </span>
          </div>
        </div>
      </article>
    </section>
  );
};
