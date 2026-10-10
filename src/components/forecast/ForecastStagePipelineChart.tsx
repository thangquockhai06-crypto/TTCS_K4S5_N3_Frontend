import React from 'react';
import { Layers } from 'lucide-react';
import { IForecastStageBreakdown } from '../../interfaces/forecast.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './ForecastStagePipelineChart.module.css';

export interface IForecastStagePipelineChartProps {
  stageBreakdown: ReadonlyArray<IForecastStageBreakdown>;
}

export const ForecastStagePipelineChart: React.FC<IForecastStagePipelineChartProps> = ({
  stageBreakdown,
}) => {
  return (
    <section className={styles.stagePipeline} aria-label="Phân bổ trọng số dự báo theo từng giai đoạn">
      <header className={styles.stagePipeline__header}>
        <h2 className={styles.stagePipeline__title}>
          <Layers size={18} color="var(--color-primary)" />
          Phân Bổ Trọng Số Theo Từng Giai Đoạn Phễu (Stage Breakdown)
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Tỷ lệ xác suất thắng tăng dần theo tiến độ chốt thỏa thuận
        </span>
      </header>

      <div className={styles.stagePipeline__grid}>
        {stageBreakdown.map((stage) => {
          return (
            <article
              key={stage.stage}
              className={styles.stagePipeline__stageCard}
              style={{ '--stage-color': stage.color } as React.CSSProperties}
            >
              <header className={styles.stagePipeline__stageHeader}>
                <span className={styles.stagePipeline__stageName} title={stage.stageName}>
                  {stage.stageName}
                </span>
                <span className={styles.stagePipeline__probabilityBadge}>
                  {stage.winProbability}% Thắng
                </span>
              </header>

              <div className={styles.stagePipeline__weightedVal}>
                {formatCurrency(stage.weightedValue)}
              </div>

              <div className={styles.stagePipeline__unweightedVal}>
                <span>Tổng cơ hội thô:</span>
                <strong>{formatCurrency(stage.unweightedValue)}</strong>
              </div>

              <div className={styles.stagePipeline__dealCount}>
                <span>{stage.dealCount} cơ hội</span>
                <span style={{ float: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {stage.percentageOfTotalWeighted.toFixed(1)}% tổng dự báo
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
