import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, History, RefreshCw } from 'lucide-react';
import { Button, Drawer, EmptyState, LoadingSkeleton } from '../../../components/common';
import { useOpportunityHistory } from '../hooks/useOpportunityHistory';
import {
  IOpportunityHistoryFilter,
  OpportunityHistoryField,
} from '../types/OpportunityHistory.types';
import {
  filterOpportunityHistory,
  formatHistoryTimestamp,
  formatHistoryValue,
  OPPORTUNITY_HISTORY_FIELD_LABELS,
  sortHistoryNewestFirst,
} from '../utils/opportunityHistory';
import styles from '../styles/OpportunityHistoryDrawer.module.css';

interface IOpportunityHistoryDrawerProps {
  isOpen: boolean;
  opportunityId: string | null;
  opportunityTitle: string;
  onClose: () => void;
}

const FIELD_FILTER_OPTIONS: ReadonlyArray<{
  value: OpportunityHistoryField | 'all';
  label: string;
}> = [
  { value: 'all', label: 'Tất cả thay đổi' },
  { value: 'stage', label: OPPORTUNITY_HISTORY_FIELD_LABELS.stage },
  { value: 'value', label: OPPORTUNITY_HISTORY_FIELD_LABELS.value },
  {
    value: 'expectedCloseDate',
    label: OPPORTUNITY_HISTORY_FIELD_LABELS.expectedCloseDate,
  },
  { value: 'owner', label: OPPORTUNITY_HISTORY_FIELD_LABELS.owner },
];

const EMPTY_FILTERS: IOpportunityHistoryFilter = {
  field: 'all',
  fromDate: '',
  toDate: '',
};

export const OpportunityHistoryDrawer: React.FC<IOpportunityHistoryDrawerProps> = ({
  isOpen,
  opportunityId,
  opportunityTitle,
  onClose,
}) => {
  const [filters, setFilters] = useState<IOpportunityHistoryFilter>(EMPTY_FILTERS);
  const { entries, isLoading, error, retry } = useOpportunityHistory(
    opportunityId,
    isOpen
  );
  const visibleEntries = useMemo(
    () =>
      filterOpportunityHistory(sortHistoryNewestFirst(entries), filters),
    [entries, filters]
  );

  useEffect(() => {
    if (isOpen) {
      setFilters(EMPTY_FILTERS);
    }
  }, [isOpen, opportunityId]);

  function updateFilter<K extends keyof IOpportunityHistoryFilter>(
    key: K,
    value: IOpportunityHistoryFilter[K]
  ): void {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử thay đổi"
      subtitle={opportunityTitle}
    >
      <div className={styles.history}>
        <p className={styles.history__mockWarning} role="note">
          DEVELOPMENT MOCK DATA — Dữ liệu giả lập, không phải lịch sử thực tế từ hệ thống.
        </p>

        <div
          className={styles.history__filters}
          role="group"
          aria-label="Bộ lọc lịch sử"
        >
          <label className={styles.history__filter}>
            <span>Loại thay đổi</span>
            <select
              value={filters.field}
              onChange={(event) =>
                updateFilter(
                  'field',
                  event.target.value as OpportunityHistoryField | 'all'
                )
              }
            >
              {FIELD_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.history__filter}>
            <span>Từ ngày</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => updateFilter('fromDate', event.target.value)}
            />
          </label>
          <label className={styles.history__filter}>
            <span>Đến ngày</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => updateFilter('toDate', event.target.value)}
            />
          </label>
        </div>

        {filters.fromDate &&
          filters.toDate &&
          filters.fromDate > filters.toDate && (
            <p className={styles.history__filterError} role="alert">
              Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
            </p>
          )}

        {isLoading ? (
          <div aria-live="polite" aria-label="Đang tải lịch sử thay đổi">
            <LoadingSkeleton rows={4} height={104} />
          </div>
        ) : error ? (
          <div className={styles.history__error} role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{error}</p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={15} />}
              onClick={retry}
            >
              Thử lại
            </Button>
          </div>
        ) : visibleEntries.length === 0 ? (
          <EmptyState
            icon={<History size={28} />}
            title="Không có thay đổi phù hợp"
            description="Thử đổi bộ lọc hoặc xóa khoảng thời gian đã chọn."
            action={
              filters.field !== 'all' || filters.fromDate || filters.toDate ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Xóa bộ lọc
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ol className={styles.history__list} aria-label="Các thay đổi gần đây nhất">
            {visibleEntries.map((entry) => {
              const timestamp = entry.changedAt
                ? new Date(entry.changedAt)
                : null;
              const validTimestamp =
                timestamp !== null && !Number.isNaN(timestamp.getTime());

              return (
                <li className={styles.history__entry} key={entry.id}>
                  <div className={styles.history__entryHeader}>
                    <h3>{OPPORTUNITY_HISTORY_FIELD_LABELS[entry.field]}</h3>
                    {validTimestamp ? (
                      <time
                        className={styles.history__timestamp}
                        dateTime={entry.changedAt ?? undefined}
                      >
                        {formatHistoryTimestamp(entry.changedAt)}
                      </time>
                    ) : (
                      <span className={styles.history__timestamp}>
                        {formatHistoryTimestamp(entry.changedAt)}
                      </span>
                    )}
                  </div>
                  <dl className={styles.history__values}>
                    <div>
                      <dt>Trước</dt>
                      <dd>{formatHistoryValue(entry.field, entry.oldValue)}</dd>
                    </div>
                    <div>
                      <dt>Sau</dt>
                      <dd>{formatHistoryValue(entry.field, entry.newValue)}</dd>
                    </div>
                  </dl>
                  <p className={styles.history__actor}>
                    Người thực hiện: {entry.performedBy?.trim() || 'Không rõ'}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Drawer>
  );
};
