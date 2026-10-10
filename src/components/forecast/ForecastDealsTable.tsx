import React from 'react';
import { Briefcase, Calendar } from 'lucide-react';
import { IForecastDeal, PipelineStageType } from '../../interfaces/forecast.interface';
import { PIPELINE_STAGES } from '../../mock/forecast.mock';
import { formatCurrency } from '../../utils/formatters';
import styles from './ForecastDealsTable.module.css';

export interface IForecastDealsTableProps {
  deals: ReadonlyArray<IForecastDeal>;
  onUpdateProbability?: (dealId: string, prob: number) => void;
  onUpdateStage?: (dealId: string, stage: PipelineStageType) => void;
}

export const ForecastDealsTable: React.FC<IForecastDealsTableProps> = ({
  deals,
  onUpdateProbability,
  onUpdateStage,
}) => {
  return (
    <section className={styles.dealsTable} aria-label="Bảng cơ hội kinh doanh chi tiết">
      <header className={styles.dealsTable__header}>
        <h2 className={styles.dealsTable__title}>
          <Briefcase size={18} color="var(--color-primary)" />
          Chi Tiết Cơ Hội & Tính Trọng Số Xác Suất (Deal Details)
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {deals.length} cơ hội trong phạm vi lọc
        </span>
      </header>

      <div className={styles.dealsTable__tableWrap}>
        <table className={styles.dealsTable__table}>
          <thead>
            <tr>
              <th className={styles.dealsTable__th}>Tên Cơ Hội / Doanh Nghiệp</th>
              <th className={styles.dealsTable__th}>Giai Đoạn Phễu</th>
              <th className={styles.dealsTable__th}>Giá Trị Gốc</th>
              <th className={styles.dealsTable__th}>Xác Suất Thắng (%)</th>
              <th className={styles.dealsTable__th}>Dự Báo Trọng Số</th>
              <th className={styles.dealsTable__th}>Kỳ / Ngày Chốt</th>
              <th className={styles.dealsTable__th}>Phụ Trách & Nhóm</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const stageConfig = PIPELINE_STAGES.find((s) => s.id === deal.stage);
              const isWon = deal.stage === 'won';

              return (
                <tr key={deal.id} className={styles.dealsTable__tr}>
                  <td className={styles.dealsTable__td}>
                    <div className={styles.dealsTable__dealCell}>
                      {deal.companyAvatar && (
                        <img
                          src={deal.companyAvatar}
                          alt={deal.company}
                          className={styles.dealsTable__companyAvatar}
                        />
                      )}
                      <div className={styles.dealsTable__dealInfo}>
                        <span className={styles.dealsTable__dealTitle} title={deal.title}>
                          {deal.title}
                        </span>
                        <span className={styles.dealsTable__customerName}>
                          {deal.company} · {deal.customerName}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className={styles.dealsTable__td}>
                    {onUpdateStage ? (
                      <select
                        className={styles.dealsTable__stageBadge}
                        style={{
                          background: stageConfig?.bgColor || 'rgba(37, 99, 235, 0.1)',
                          color: stageConfig?.color || '#2563EB',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        value={deal.stage}
                        onChange={(e) => onUpdateStage(deal.id, e.target.value as PipelineStageType)}
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nameVi}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={styles.dealsTable__stageBadge}
                        style={{
                          background: stageConfig?.bgColor || 'rgba(37, 99, 235, 0.1)',
                          color: stageConfig?.color || '#2563EB',
                        }}
                      >
                        {deal.stageName}
                      </span>
                    )}
                  </td>

                  <td className={styles.dealsTable__td}>
                    <strong>{formatCurrency(deal.dealValue)}</strong>
                  </td>

                  <td className={styles.dealsTable__td}>
                    {onUpdateProbability && !isWon ? (
                      <div className={styles.dealsTable__probSliderWrap}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={deal.winProbability}
                          className={styles.dealsTable__probSlider}
                          onChange={(e) => onUpdateProbability(deal.id, Number(e.target.value))}
                        />
                        <span className={styles.dealsTable__probLabel}>
                          {deal.winProbability}%
                        </span>
                      </div>
                    ) : (
                      <strong style={{ color: isWon ? '#10B981' : 'var(--color-primary)' }}>
                        {deal.winProbability}%
                      </strong>
                    )}
                  </td>

                  <td className={styles.dealsTable__td}>
                    <strong style={{ color: isWon ? '#10B981' : 'var(--color-primary)' }}>
                      {formatCurrency(deal.weightedValue)}
                    </strong>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      ({formatCurrency(deal.dealValue)} × {deal.winProbability}%)
                    </div>
                  </td>

                  <td className={styles.dealsTable__td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={13} color="var(--color-text-muted)" />
                      <span>{deal.expectedCloseDate}</span>
                    </div>
                  </td>

                  <td className={styles.dealsTable__td}>
                    <div className={styles.dealsTable__repCell}>
                      {deal.assignedRepAvatar && (
                        <img
                          src={deal.assignedRepAvatar}
                          alt={deal.assignedRepName}
                          className={styles.dealsTable__repAvatar}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{deal.assignedRepName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {deal.teamName}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
