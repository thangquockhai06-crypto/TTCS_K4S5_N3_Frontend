import React from 'react';
import { UserCheck } from 'lucide-react';
import { ISalesRepForecast } from '../../interfaces/forecast.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './ForecastRepBreakdown.module.css';

export interface IForecastRepBreakdownProps {
  repsForecast: ReadonlyArray<ISalesRepForecast>;
  onSelectRep?: (repId: string) => void;
}

export const ForecastRepBreakdown: React.FC<IForecastRepBreakdownProps> = ({
  repsForecast,
  onSelectRep,
}) => {
  return (
    <section className={styles.repBreakdown} aria-label="Bảng dự báo doanh số theo từng nhân viên">
      <header className={styles.repBreakdown__header}>
        <h2 className={styles.repBreakdown__title}>
          <UserCheck size={18} color="var(--color-primary)" />
          Chi Tiết Dự Báo & Chỉ Tiêu Theo Từng Nhân Viên Kinh Doanh (Sales Reps)
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {repsForecast.length} nhân sự
        </span>
      </header>

      <div className={styles.repBreakdown__tableWrap}>
        <table className={styles.repBreakdown__table}>
          <thead>
            <tr>
              <th className={styles.repBreakdown__th}>Nhân Viên / Vị Trí</th>
              <th className={styles.repBreakdown__th}>Phòng Ban</th>
              <th className={styles.repBreakdown__th}>Chỉ Tiêu (Quota)</th>
              <th className={styles.repBreakdown__th}>Đã Chốt (Won)</th>
              <th className={styles.repBreakdown__th}>Dự Báo Trọng Số</th>
              <th className={styles.repBreakdown__th}>Tổng Kỳ Vọng</th>
              <th className={styles.repBreakdown__th}>% Đạt Chỉ Tiêu</th>
              <th className={styles.repBreakdown__th}>Cơ Hội</th>
            </tr>
          </thead>
          <tbody>
            {repsForecast.map((rep) => {
              const progressCapped = Math.min(100, Math.max(0, rep.quotaAchievementRate));
              let badgeClass = styles['repBreakdown__badge--warning'];
              let fillGradient = 'linear-gradient(90deg, #F59E0B, #F97316)';

              if (rep.quotaAchievementRate >= 100) {
                badgeClass = styles['repBreakdown__badge--success'];
                fillGradient = 'linear-gradient(90deg, #10B981, #059669)';
              } else if (rep.quotaAchievementRate < 50) {
                badgeClass = styles['repBreakdown__badge--danger'];
                fillGradient = 'linear-gradient(90deg, #EF4444, #DC2626)';
              }

              return (
                <tr
                  key={rep.repId}
                  className={styles.repBreakdown__tr}
                  onClick={() => onSelectRep && onSelectRep(rep.repId)}
                  style={{ cursor: onSelectRep ? 'pointer' : 'default' }}
                >
                  <td className={styles.repBreakdown__td}>
                    <div className={styles.repBreakdown__repCell}>
                      <img
                        src={rep.repAvatar}
                        alt={rep.repName}
                        className={styles.repBreakdown__avatar}
                      />
                      <div className={styles.repBreakdown__repInfo}>
                        <span className={styles.repBreakdown__repName}>{rep.repName}</span>
                        <span className={styles.repBreakdown__repMeta}>{rep.repTitle}</span>
                      </div>
                    </div>
                  </td>

                  <td className={styles.repBreakdown__td} style={{ color: 'var(--color-text-secondary)' }}>
                    {rep.teamName}
                  </td>

                  <td className={styles.repBreakdown__td}>
                    <strong>{formatCurrency(rep.quotaTarget)}</strong>
                  </td>

                  <td className={styles.repBreakdown__td} style={{ color: '#10B981', fontWeight: 600 }}>
                    {formatCurrency(rep.actualWonValue)}
                  </td>

                  <td className={styles.repBreakdown__td} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {formatCurrency(rep.weightedForecastValue)}
                  </td>

                  <td className={styles.repBreakdown__td}>
                    <strong>{formatCurrency(rep.totalProjectedValue)}</strong>
                  </td>

                  <td className={styles.repBreakdown__td}>
                    <div className={styles.repBreakdown__progressContainer}>
                      <div className={styles.repBreakdown__progressBar}>
                        <div
                          className={styles.repBreakdown__progressFill}
                          style={{ width: `${progressCapped}%`, background: fillGradient }}
                        />
                      </div>
                      <span className={`${styles.repBreakdown__badge} ${badgeClass}`}>
                        {rep.quotaAchievementRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  <td className={styles.repBreakdown__td}>
                    <span>{rep.dealCount} deals ({rep.wonCount} won)</span>
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
