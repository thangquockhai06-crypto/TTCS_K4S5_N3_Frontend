import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import { IForecastSummary } from '../../interfaces/forecast.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './ForecastComparisonChart.module.css';

export interface IForecastComparisonChartProps {
  summary: IForecastSummary;
}

export const ForecastComparisonChart: React.FC<IForecastComparisonChartProps> = ({ summary }) => {
  // Tìm giá trị max để vẽ scale độ rộng thanh
  const maxValue = Math.max(
    summary.totalQuotaTarget,
    summary.totalProjectedValue,
    summary.pipelineValue,
    1
  );

  const wonWidth = (summary.actualWonValue / maxValue) * 100;
  const weightedWidth = (summary.weightedForecastValue / maxValue) * 100;
  const targetWidth = (summary.totalQuotaTarget / maxValue) * 100;
  const pipelineWidth = (summary.pipelineValue / maxValue) * 100;

  return (
    <section className={styles.forecastChart} aria-label="Biểu đồ so sánh dự báo và chỉ tiêu">
      <header className={styles.forecastChart__header}>
        <div className={styles.forecastChart__titleWrap}>
          <h2 className={styles.forecastChart__title}>
            <BarChart3 size={18} color="var(--color-primary)" />
            So Sánh Dự Báo vs Chỉ Tiêu Doanh Số ({summary.periodLabel})
          </h2>
          <p className={styles.forecastChart__subtitle}>
            Trực quan hóa khoảng cách giữa Chỉ tiêu (Quota), Đã chốt (Won) và Doanh số kỳ vọng (Weighted Forecast).
          </p>
        </div>

        <div className={styles.forecastChart__legend}>
          <span className={styles.forecastChart__legendItem}>
            <span className={styles.forecastChart__legendDot} style={{ background: '#10B981' }} />
            Đã chốt thực tế (Won)
          </span>
          <span className={styles.forecastChart__legendItem}>
            <span className={styles.forecastChart__legendDot} style={{ background: '#2563EB' }} />
            Dự báo trọng số (Weighted)
          </span>
          <span className={styles.forecastChart__legendItem}>
            <span className={styles.forecastChart__legendDot} style={{ background: '#EF4444' }} />
            Chỉ tiêu (Quota Target)
          </span>
        </div>
      </header>

      {/* Các thanh so sánh trực quan */}
      <div className={styles.forecastChart__barsContainer}>
        {/* Thanh 1: Tổng doanh số dự kiến hoàn thành (Won + Weighted) */}
        <div className={styles.forecastChart__barRow}>
          <div className={styles.forecastChart__barLabelWrap}>
            <span className={styles.forecastChart__barLabel}>
              1. Tổng Doanh Số Dự Kiến Về Kỳ Này (Đã chốt + Dự báo trọng số)
            </span>
            <span className={styles.forecastChart__barValue} style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(summary.totalProjectedValue)} ({summary.quotaAchievementRate.toFixed(1)}% Chỉ tiêu)
            </span>
          </div>

          <div className={styles.forecastChart__barTrack}>
            <div
              className={`${styles.forecastChart__barSegment} ${styles['forecastChart__barSegment--won']}`}
              style={{ width: `${wonWidth}%` }}
              title={`Đã chốt: ${formatCurrency(summary.actualWonValue)}`}
            >
              {wonWidth > 12 ? `${formatCurrency(summary.actualWonValue)}` : ''}
            </div>

            <div
              className={`${styles.forecastChart__barSegment} ${styles['forecastChart__barSegment--weighted']}`}
              style={{ width: `${weightedWidth}%` }}
              title={`Dự báo trọng số: ${formatCurrency(summary.weightedForecastValue)}`}
            >
              {weightedWidth > 12 ? `+${formatCurrency(summary.weightedForecastValue)}` : ''}
            </div>
          </div>
        </div>

        {/* Thanh 2: Chỉ tiêu doanh số (Quota Target) */}
        <div className={styles.forecastChart__barRow}>
          <div className={styles.forecastChart__barLabelWrap}>
            <span className={styles.forecastChart__barLabel}>
              2. Chỉ Tiêu Doanh Số Được Giao (Quota Target)
            </span>
            <span className={styles.forecastChart__barValue}>
              {formatCurrency(summary.totalQuotaTarget)}
            </span>
          </div>

          <div className={styles.forecastChart__barTrack}>
            <div
              className={`${styles.forecastChart__barSegment} ${styles['forecastChart__barSegment--target']}`}
              style={{ width: `${targetWidth}%` }}
            >
              {targetWidth > 15 ? `Mục tiêu 100%: ${formatCurrency(summary.totalQuotaTarget)}` : ''}
            </div>
          </div>
        </div>

        {/* Thanh 3: Tổng Pipeline thô (chưa nhân xác suất) */}
        <div className={styles.forecastChart__barRow}>
          <div className={styles.forecastChart__barLabelWrap}>
            <span className={styles.forecastChart__barLabel} style={{ color: 'var(--color-text-secondary)' }}>
              3. Tổng Dung Lượng Pipeline Chưa Trọng Số (Unweighted Pipeline)
            </span>
            <span className={styles.forecastChart__barValue} style={{ color: 'var(--color-text-secondary)' }}>
              {formatCurrency(summary.pipelineValue)}
            </span>
          </div>

          <div className={styles.forecastChart__barTrack}>
            <div
              className={styles.forecastChart__barSegment}
              style={{ width: `${pipelineWidth}%`, background: '#CBD5E1', color: '#334155' }}
            >
              {pipelineWidth > 20 ? `Dung lượng nguồn: ${formatCurrency(summary.pipelineValue)}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Hộp giải thích công thức nghiệp vụ */}
      <footer className={styles.forecastChart__formulaBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={16} color="var(--color-primary)" />
          <span>Công thức tính dự báo:</span>
          <span className={styles.forecastChart__formulaCode}>
            Weighted Forecast = ∑ (Deal Value × Stage Win Probability)
          </span>
        </div>

        <div>
          <span>Độ lệch chỉ tiêu (Gap): </span>
          <strong style={{ color: summary.gapToTarget <= 0 ? '#10B981' : '#EF4444' }}>
            {summary.gapToTarget <= 0
              ? `Vượt ${formatCurrency(Math.abs(summary.gapToTarget))} (+${(summary.quotaAchievementRate - 100).toFixed(1)}%)`
              : `Còn thiếu ${formatCurrency(summary.gapToTarget)} (-${(100 - summary.quotaAchievementRate).toFixed(1)}%)`}
          </strong>
        </div>
      </footer>
    </section>
  );
};
