import React from 'react';
import { Calendar, Filter, RotateCcw, Search, Users, UserCheck } from 'lucide-react';
import { ForecastPeriodType, IForecastFilterState } from '../../interfaces/forecast.interface';
import { PIPELINE_STAGES, SALES_REPS, SALES_TEAMS } from '../../mock/forecast.mock';
import styles from './ForecastPeriodFilter.module.css';

export interface IForecastPeriodFilterProps {
  filterState: IForecastFilterState;
  onPeriodChange: (period: ForecastPeriodType) => void;
  onTeamChange: (teamId: string) => void;
  onRepChange: (repId: string) => void;
  onStageChange: (stage: string) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

export const ForecastPeriodFilter: React.FC<IForecastPeriodFilterProps> = ({
  filterState,
  onPeriodChange,
  onTeamChange,
  onRepChange,
  onStageChange,
  onSearchChange,
  onReset,
}) => {
  // Lọc danh sách Rep theo team đã chọn (nếu có)
  const availableReps = filterState.teamId === 'all'
    ? SALES_REPS
    : SALES_REPS.filter((r) => r.teamId === filterState.teamId);

  return (
    <nav className={styles.forecastFilter} aria-label="Bộ lọc dự báo doanh số">
      {/* Hàng 1: Nút chuyển Kỳ dự kiến chốt (Tháng này / Tháng sau / Quý này) */}
      <div className={styles.forecastFilter__row}>
        <div className={styles.forecastFilter__periodGroup} role="tablist" aria-label="Kỳ dự kiến chốt">
          <button
            type="button"
            role="tab"
            aria-selected={filterState.period === 'this_month'}
            className={`${styles.forecastFilter__periodButton} ${
              filterState.period === 'this_month' ? styles['forecastFilter__periodButton--active'] : ''
            }`}
            onClick={() => onPeriodChange('this_month')}
          >
            <Calendar size={15} />
            Tháng Này (10/2026)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.period === 'next_month'}
            className={`${styles.forecastFilter__periodButton} ${
              filterState.period === 'next_month' ? styles['forecastFilter__periodButton--active'] : ''
            }`}
            onClick={() => onPeriodChange('next_month')}
          >
            <Calendar size={15} />
            Tháng Sau (11/2026)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.period === 'this_quarter'}
            className={`${styles.forecastFilter__periodButton} ${
              filterState.period === 'this_quarter' ? styles['forecastFilter__periodButton--active'] : ''
            }`}
            onClick={() => onPeriodChange('this_quarter')}
          >
            <Calendar size={15} />
            Quý Này (Q4/2026)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.period === 'all'}
            className={`${styles.forecastFilter__periodButton} ${
              filterState.period === 'all' ? styles['forecastFilter__periodButton--active'] : ''
            }`}
            onClick={() => onPeriodChange('all')}
          >
            Tất Cả Kỳ
          </button>
        </div>

        {/* Ô tìm kiếm cơ hội / khách hàng */}
        <div className={styles.forecastFilter__searchWrap}>
          <Search size={16} className={styles.forecastFilter__searchIcon} />
          <input
            type="text"
            className={styles.forecastFilter__searchInput}
            placeholder="Tìm kiếm theo cơ hội, khách hàng, phụ trách..."
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Hàng 2: Bộ lọc Dropdown (Phòng ban / Nhóm, Nhân viên, Giai đoạn, Reset) */}
      <div className={styles.forecastFilter__row}>
        <div className={styles.forecastFilter__controls}>
          {/* Lọc theo Nhóm / Phòng ban */}
          <div className={styles.forecastFilter__selectGroup}>
            <label htmlFor="forecast-team-select" className={styles.forecastFilter__label}>
              <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Nhóm:
            </label>
            <select
              id="forecast-team-select"
              className={styles.forecastFilter__select}
              value={filterState.teamId}
              onChange={(e) => onTeamChange(e.target.value)}
            >
              <option value="all">Toàn bộ phòng ban</option>
              {SALES_TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Nhân viên */}
          <div className={styles.forecastFilter__selectGroup}>
            <label htmlFor="forecast-rep-select" className={styles.forecastFilter__label}>
              <UserCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Nhân viên:
            </label>
            <select
              id="forecast-rep-select"
              className={styles.forecastFilter__select}
              value={filterState.repId}
              onChange={(e) => onRepChange(e.target.value)}
            >
              <option value="all">Tất cả nhân sự ({availableReps.length})</option>
              {availableReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Giai đoạn phễu */}
          <div className={styles.forecastFilter__selectGroup}>
            <label htmlFor="forecast-stage-select" className={styles.forecastFilter__label}>
              <Filter size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Giai đoạn:
            </label>
            <select
              id="forecast-stage-select"
              className={styles.forecastFilter__select}
              value={filterState.stage}
              onChange={(e) => onStageChange(e.target.value)}
            >
              <option value="all">Tất cả giai đoạn</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameVi} ({s.defaultProbability}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nút đặt lại bộ lọc */}
        <button
          type="button"
          className={styles.forecastFilter__resetBtn}
          onClick={onReset}
          title="Đặt lại tất cả bộ lọc về mặc định"
        >
          <RotateCcw size={14} />
          Đặt lại
        </button>
      </div>
    </nav>
  );
};
