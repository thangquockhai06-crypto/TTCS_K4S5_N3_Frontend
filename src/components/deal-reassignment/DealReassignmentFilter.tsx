import React from 'react';
import {
  ArrowRightLeft,
  Filter,
  History,
  RotateCcw,
  Search,
  Users,
  UserCheck,
} from 'lucide-react';
import { IReassignmentFilterState } from '../../interfaces/deal-reassignment.interface';
import { PIPELINE_STAGES, SALES_REPS, SALES_TEAMS } from '../../mock/forecast.mock';
import styles from './DealReassignmentFilter.module.css';

export interface IDealReassignmentFilterProps {
  filterState: IReassignmentFilterState;
  selectedDealsCount: number;
  onFromRepChange: (repId: string) => void;
  onTeamChange: (teamId: string) => void;
  onStageChange: (stage: string) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  onOpenReassignModal: () => void;
  onOpenHistoryModal: () => void;
}

export const DealReassignmentFilter: React.FC<IDealReassignmentFilterProps> = ({
  filterState,
  selectedDealsCount,
  onFromRepChange,
  onTeamChange,
  onStageChange,
  onSearchChange,
  onReset,
  onOpenReassignModal,
  onOpenHistoryModal,
}) => {
  const availableReps = filterState.teamId === 'all'
    ? SALES_REPS
    : SALES_REPS.filter((r) => r.teamId === filterState.teamId);

  return (
    <nav className={styles.reassignFilter} aria-label="Bộ lọc và thao tác điều phối cơ hội">
      {/* Hàng 1: Nút Chuyển giao hàng loạt (Bulk Transfer) & Nút Xem Nhật ký Bàn giao */}
      <div className={styles.reassignFilter__row}>
        <div className={styles.reassignFilter__leftActions}>
          <button
            type="button"
            className={styles.reassignFilter__btnPrimary}
            onClick={onOpenReassignModal}
            disabled={selectedDealsCount === 0}
            title={selectedDealsCount === 0 ? 'Vui lòng tích chọn ít nhất 1 cơ hội để phân bổ' : ''}
          >
            <ArrowRightLeft size={16} />
            Phân Bổ Lại Cơ Hội ({selectedDealsCount} đang chọn)
          </button>

          <button
            type="button"
            className={styles.reassignFilter__btnSecondary}
            onClick={onOpenHistoryModal}
          >
            <History size={15} />
            Nhật Ký Bàn Giao Nhóm
          </button>
        </div>

        {/* Ô tìm kiếm cơ hội */}
        <div className={styles.reassignFilter__searchWrap}>
          <Search size={16} className={styles.reassignFilter__searchIcon} />
          <input
            type="text"
            className={styles.reassignFilter__searchInput}
            placeholder="Tìm theo tên thương vụ, khách hàng, người phụ trách..."
            value={filterState.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Hàng 2: Bộ lọc Dropdown theo Nhóm, Người phụ trách hiện tại, Giai đoạn phễu */}
      <div className={styles.reassignFilter__row}>
        <div className={styles.reassignFilter__controls}>
          {/* Lọc theo Nhóm */}
          <div className={styles.reassignFilter__selectGroup}>
            <label htmlFor="reassign-team-select" className={styles.reassignFilter__label}>
              <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Nhóm:
            </label>
            <select
              id="reassign-team-select"
              className={styles.reassignFilter__select}
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

          {/* Lọc theo Người phụ trách hiện tại (Current Owner) */}
          <div className={styles.reassignFilter__selectGroup}>
            <label htmlFor="reassign-from-rep-select" className={styles.reassignFilter__label}>
              <UserCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Phụ trách hiện tại:
            </label>
            <select
              id="reassign-from-rep-select"
              className={styles.reassignFilter__select}
              value={filterState.fromRepId}
              onChange={(e) => onFromRepChange(e.target.value)}
            >
              <option value="all">Tất cả chuyên viên ({availableReps.length})</option>
              {availableReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Giai đoạn */}
          <div className={styles.reassignFilter__selectGroup}>
            <label htmlFor="reassign-stage-select" className={styles.reassignFilter__label}>
              <Filter size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Giai đoạn:
            </label>
            <select
              id="reassign-stage-select"
              className={styles.reassignFilter__select}
              value={filterState.stage}
              onChange={(e) => onStageChange(e.target.value)}
            >
              <option value="all">Tất cả giai đoạn</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameVi}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nút Reset */}
        <button
          type="button"
          className={styles.reassignFilter__resetBtn}
          onClick={onReset}
          title="Đặt lại bộ lọc"
        >
          <RotateCcw size={14} />
          Đặt lại
        </button>
      </div>
    </nav>
  );
};
