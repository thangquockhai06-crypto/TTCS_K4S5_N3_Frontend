import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  UserCheck,
} from 'lucide-react';
import { IStagnantFilterState } from '../../interfaces/stagnant-deal.interface';
import { SALES_REPS, SALES_TEAMS } from '../../mock/forecast.mock';
import styles from './StagnantDealFilter.module.css';

export interface IStagnantDealFilterProps {
  filterState: IStagnantFilterState;
  onSeverityChange: (severity: string) => void;
  onReasonChange: (reason: string) => void;
  onTeamChange: (teamId: string) => void;
  onRepChange: (repId: string) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  onOpenConfigModal: () => void;
}

export const StagnantDealFilter: React.FC<IStagnantDealFilterProps> = ({
  filterState,
  onSeverityChange,
  onReasonChange,
  onTeamChange,
  onRepChange,
  onStatusChange,
  onSearchChange,
  onReset,
  onOpenConfigModal,
}) => {
  const availableReps = filterState.teamId === 'all'
    ? SALES_REPS
    : SALES_REPS.filter((r) => r.teamId === filterState.teamId);

  return (
    <nav className={styles.stagnantFilter} aria-label="Bộ lọc cơ hội đình trệ">
      {/* Hàng 1: Tabs phân loại mức độ rủi ro & Ô tìm kiếm */}
      <div className={styles.stagnantFilter__row}>
        <div className={styles.stagnantFilter__tabsGroup} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filterState.severity === 'all'}
            className={`${styles.stagnantFilter__tabButton} ${
              filterState.severity === 'all' ? styles['stagnantFilter__tabButton--active'] : ''
            }`}
            onClick={() => onSeverityChange('all')}
          >
            Tất Cả Cảnh Báo
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.severity === 'critical'}
            className={`${styles.stagnantFilter__tabButton} ${styles['stagnantFilter__tabButton--critical']} ${
              filterState.severity === 'critical' ? styles['stagnantFilter__tabButton--active'] : ''
            }`}
            onClick={() => onSeverityChange('critical')}
          >
            <AlertOctagon size={14} />
            Nguy Cấp (Đỏ)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.severity === 'warning'}
            className={`${styles.stagnantFilter__tabButton} ${
              filterState.severity === 'warning' ? styles['stagnantFilter__tabButton--active'] : ''
            }`}
            onClick={() => onSeverityChange('warning')}
          >
            <AlertTriangle size={14} color="#F59E0B" />
            Cảnh Báo (Cam)
          </button>
        </div>

        {/* Ô tìm kiếm cơ hội đình trệ */}
        <div className={styles.stagnantFilter__searchWrap}>
          <Search size={16} className={styles.stagnantFilter__searchIcon} />
          <input
            type="text"
            className={styles.stagnantFilter__searchInput}
            placeholder="Tìm theo tên thương vụ, khách hàng, nhân sự..."
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Nút mở Modal Cấu hình số ngày N */}
        <button
          type="button"
          className={styles.stagnantFilter__configBtn}
          onClick={onOpenConfigModal}
        >
          <SlidersHorizontal size={15} />
          Cấu Hình Ngưỡng N Ngày
        </button>
      </div>

      {/* Hàng 2: Bộ lọc Dropdown (Lý do gắn cờ, Nhóm kinh doanh, Nhân sự, Trạng thái xử lý) */}
      <div className={styles.stagnantFilter__row}>
        <div className={styles.stagnantFilter__controls}>
          {/* Lọc theo Lý do gắn cờ */}
          <div className={styles.stagnantFilter__selectGroup}>
            <label htmlFor="filter-reason" className={styles.stagnantFilter__label}>
              <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Lý do cờ:
            </label>
            <select
              id="filter-reason"
              className={styles.stagnantFilter__select}
              value={filterState.reason}
              onChange={(e) => onReasonChange(e.target.value)}
            >
              <option value="all">Tất cả nguyên nhân</option>
              <option value="inactive_threshold">Không tương tác &gt; N ngày</option>
              <option value="overdue_close_date">Quá ngày dự kiến chốt</option>
            </select>
          </div>

          {/* Lọc theo Nhóm */}
          <div className={styles.stagnantFilter__selectGroup}>
            <label htmlFor="filter-team" className={styles.stagnantFilter__label}>
              <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Nhóm:
            </label>
            <select
              id="filter-team"
              className={styles.stagnantFilter__select}
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

          {/* Lọc theo Nhân sự */}
          <div className={styles.stagnantFilter__selectGroup}>
            <label htmlFor="filter-rep" className={styles.stagnantFilter__label}>
              <UserCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Nhân sự:
            </label>
            <select
              id="filter-rep"
              className={styles.stagnantFilter__select}
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

          {/* Lọc theo Trạng thái can thiệp */}
          <div className={styles.stagnantFilter__selectGroup}>
            <label htmlFor="filter-status" className={styles.stagnantFilter__label}>
              Xử lý:
            </label>
            <select
              id="filter-status"
              className={styles.stagnantFilter__select}
              value={filterState.interventionStatus}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ can thiệp</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã cứu vãn</option>
            </select>
          </div>
        </div>

        {/* Nút reset bộ lọc */}
        <button
          type="button"
          className={styles.stagnantFilter__resetBtn}
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
