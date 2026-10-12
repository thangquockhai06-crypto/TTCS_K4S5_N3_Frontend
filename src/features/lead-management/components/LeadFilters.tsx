import React from 'react';
import { Check, Filter, RotateCcw, Search } from 'lucide-react';
import {
  ILeadFilter,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  LEAD_TEMPERATURE_OPTIONS,
} from '../types/Lead.types';
import styles from '../styles/LeadManagement.module.css';

export interface ILeadFiltersProps {
  filters: ILeadFilter;
  owners: ReadonlyArray<{ id: string; name: string }>;
  error: string | null;
  onChange: (filters: ILeadFilter) => void;
  onApply: () => void;
  onClear: () => void;
}

export const LeadFilters: React.FC<ILeadFiltersProps> = ({
  filters,
  owners,
  error,
  onChange,
  onApply,
  onClear,
}) => {
  const toggleSelected = <T extends string,>(
    values: T[],
    value: T,
    key: 'statuses' | 'sources' | 'temperatures' | 'ownerIds'
  ): void => {
    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    onChange({ ...filters, [key]: nextValues });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className={styles.filters} onSubmit={handleSubmit} noValidate>
      <div className={styles.filters__title}>
        <Filter size={17} aria-hidden="true" />
        <h2>Bộ lọc Lead</h2>
      </div>

      <label className={styles.searchField}>
        <span>Tìm theo tên, công ty, email hoặc số điện thoại</span>
        <span className={styles.searchField__control}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Tìm kiếm Lead..."
          />
        </span>
      </label>

      <div className={styles.filterGroups}>
        <fieldset className={styles.filterGroup}>
          <legend>Trạng thái</legend>
          {LEAD_STATUS_OPTIONS.map((option) => (
            <label className={styles.checkboxOption} key={option.value}>
              <input
                type="checkbox"
                checked={filters.statuses.includes(option.value)}
                onChange={() => toggleSelected(filters.statuses, option.value, 'statuses')}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.filterGroup}>
          <legend>Nguồn Lead</legend>
          {LEAD_SOURCE_OPTIONS.map((option) => (
            <label className={styles.checkboxOption} key={option.value}>
              <input
                type="checkbox"
                checked={filters.sources.includes(option.value)}
                onChange={() => toggleSelected(filters.sources, option.value, 'sources')}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.filterGroup}>
          <legend>Phân loại</legend>
          {LEAD_TEMPERATURE_OPTIONS.map((option) => (
            <label className={styles.checkboxOption} key={option.value}>
              <input
                type="checkbox"
                checked={filters.temperatures.includes(option.value)}
                onChange={() =>
                  toggleSelected(filters.temperatures, option.value, 'temperatures')
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.filterGroup}>
          <legend>Người phụ trách</legend>
          {owners.map((owner) => (
            <label className={styles.checkboxOption} key={owner.id}>
              <input
                type="checkbox"
                checked={filters.ownerIds.includes(owner.id)}
                onChange={() => toggleSelected(filters.ownerIds, owner.id, 'ownerIds')}
              />
              <span>{owner.name}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={`${styles.filterGroup} ${styles['filterGroup--date']}`}>
          <legend>Ngày tạo (UTC)</legend>
          <label className={styles.dateField}>
            <span>Từ ngày</span>
            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) => onChange({ ...filters, createdFrom: event.target.value })}
            />
          </label>
          <label className={styles.dateField}>
            <span>Đến ngày</span>
            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) => onChange({ ...filters, createdTo: event.target.value })}
            />
          </label>
        </fieldset>
      </div>

      {error && (
        <p className={styles.inlineError} role="alert">
          {error}
        </p>
      )}

      <div className={styles.filterActions}>
        <button className={styles.button} type="submit">
          <Check size={16} aria-hidden="true" />
          Áp dụng bộ lọc
        </button>
        <button className={`${styles.button} ${styles['button--secondary']}`} type="button" onClick={onClear}>
          <RotateCcw size={15} aria-hidden="true" />
          Xóa bộ lọc
        </button>
      </div>
    </form>
  );
};
