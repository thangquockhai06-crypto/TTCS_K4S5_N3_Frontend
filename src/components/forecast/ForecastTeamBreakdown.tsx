import React from 'react';
import { Building2 } from 'lucide-react';
import { ISalesTeamForecast } from '../../interfaces/forecast.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './ForecastTeamBreakdown.module.css';

export interface IForecastTeamBreakdownProps {
  teamsForecast: ReadonlyArray<ISalesTeamForecast>;
  onSelectTeam?: (teamId: string) => void;
}

export const ForecastTeamBreakdown: React.FC<IForecastTeamBreakdownProps> = ({
  teamsForecast,
  onSelectTeam,
}) => {
  return (
    <section className={styles.teamBreakdown} aria-label="Bảng dự báo doanh số theo từng nhóm kinh doanh">
      <header className={styles.teamBreakdown__header}>
        <h2 className={styles.teamBreakdown__title}>
          <Building2 size={18} color="var(--color-primary)" />
          Dự Báo & Chỉ Tiêu Theo Từng Nhóm Kinh Doanh (Sales Teams)
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {teamsForecast.length} phòng ban kinh doanh
        </span>
      </header>

      <div className={styles.teamBreakdown__tableWrap}>
        <table className={styles.teamBreakdown__table}>
          <thead>
            <tr>
              <th className={styles.teamBreakdown__th}>Phòng Ban / Quản Lý</th>
              <th className={styles.teamBreakdown__th}>Chỉ Tiêu (Quota)</th>
              <th className={styles.teamBreakdown__th}>Đã Chốt (Won)</th>
              <th className={styles.teamBreakdown__th}>Dự Báo Trọng Số</th>
              <th className={styles.teamBreakdown__th}>Tổng Dự Kiến</th>
              <th className={styles.teamBreakdown__th}>Tiến Độ Chỉ Tiêu</th>
              <th className={styles.teamBreakdown__th}>Số Cơ Hội</th>
            </tr>
          </thead>
          <tbody>
            {teamsForecast.map((team) => {
              const progressCapped = Math.min(100, Math.max(0, team.quotaAchievementRate));
              const isTargetReached = team.gapToTarget <= 0;

              return (
                <tr
                  key={team.teamId}
                  className={styles.teamBreakdown__tr}
                  onClick={() => onSelectTeam && onSelectTeam(team.teamId)}
                  style={{ cursor: onSelectTeam ? 'pointer' : 'default' }}
                >
                  <td className={styles.teamBreakdown__td}>
                    <div className={styles.teamBreakdown__teamCell}>
                      <img
                        src={team.managerAvatar}
                        alt={team.managerName}
                        className={styles.teamBreakdown__managerAvatar}
                      />
                      <div className={styles.teamBreakdown__teamInfo}>
                        <span className={styles.teamBreakdown__teamName}>{team.teamName}</span>
                        <span className={styles.teamBreakdown__managerName}>
                          Quản lý: {team.managerName} ({team.memberCount} nhân sự)
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className={styles.teamBreakdown__td}>
                    <strong>{formatCurrency(team.quotaTarget)}</strong>
                  </td>

                  <td className={styles.teamBreakdown__td} style={{ color: '#10B981', fontWeight: 600 }}>
                    {formatCurrency(team.actualWonValue)}
                  </td>

                  <td className={styles.teamBreakdown__td} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {formatCurrency(team.weightedForecastValue)}
                  </td>

                  <td className={styles.teamBreakdown__td}>
                    <strong>{formatCurrency(team.totalProjectedValue)}</strong>
                  </td>

                  <td className={styles.teamBreakdown__td}>
                    <div className={styles.teamBreakdown__progressContainer}>
                      <div className={styles.teamBreakdown__progressBar}>
                        <div
                          className={styles.teamBreakdown__progressFill}
                          style={{ width: `${progressCapped}%` }}
                        />
                      </div>
                      <span
                        className={`${styles.teamBreakdown__badge} ${
                          isTargetReached
                            ? styles['teamBreakdown__badge--success']
                            : styles['teamBreakdown__badge--warning']
                        }`}
                      >
                        {team.quotaAchievementRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  <td className={styles.teamBreakdown__td}>
                    <span>{team.dealCount} cơ hội ({team.wonCount} won)</span>
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
