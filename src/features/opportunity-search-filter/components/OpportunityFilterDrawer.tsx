import React, { useState } from 'react';
import { Bookmark, Check, Save, Trash2 } from 'lucide-react';
import { Button, Drawer } from '../../../components/common';
import {
  IOpportunityFilterCriteria,
  IOpportunityFilterOptions,
  ISavedOpportunityFilter,
} from '../types/OpportunitySearchFilter.types';
import styles from '../styles/OpportunityFilterDrawer.module.css';

export interface IOpportunityFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: IOpportunityFilterCriteria;
  options: IOpportunityFilterOptions;
  savedFilters: ReadonlyArray<ISavedOpportunityFilter>;
  activePresetId: string | null;
  validationError: string | null;
  persistenceError: string | null;
  onCriteriaChange: (criteria: IOpportunityFilterCriteria) => void;
  onApply: () => boolean;
  onClearAll: () => void;
  onApplySavedFilter: (filter: ISavedOpportunityFilter) => void;
  onSaveFilter: (name: string) => boolean;
  onDeleteSavedFilter: (id: string) => void;
}

export const OpportunityFilterDrawer: React.FC<IOpportunityFilterDrawerProps> = ({
  isOpen,
  onClose,
  criteria,
  options,
  savedFilters,
  activePresetId,
  validationError,
  persistenceError,
  onCriteriaChange,
  onApply,
  onClearAll,
  onApplySavedFilter,
  onSaveFilter,
  onDeleteSavedFilter,
}) => {
  const [filterName, setFilterName] = useState('');

  const update = (partial: Partial<IOpportunityFilterCriteria>): void => {
    onCriteriaChange({ ...criteria, ...partial });
  };

  const handleApply = (): void => {
    if (onApply()) onClose();
  };

  const handleSave = (): void => {
    if (onSaveFilter(filterName)) setFilterName('');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Bộ lọc cơ hội"
      subtitle="Thiết lập điều kiện hoặc áp dụng bộ lọc đã lưu"
      position="right"
    >
      <div className={styles.filterDrawer}>
        <section className={styles.savedSection} aria-labelledby="saved-opportunity-filters">
          <div className={styles.sectionHeading}>
            <Bookmark size={16} aria-hidden="true" />
            <h3 id="saved-opportunity-filters">Bộ lọc đã lưu</h3>
          </div>
          {savedFilters.length === 0 ? (
            <p className={styles.muted}>Chưa có bộ lọc nào được lưu trên trình duyệt này.</p>
          ) : (
            <ul className={styles.savedList}>
              {savedFilters.map((filter) => (
                <li key={filter.id} className={styles.savedItem}>
                  <button
                    type="button"
                    className={styles.savedApply}
                    aria-current={activePresetId === filter.id ? 'true' : undefined}
                    onClick={() => {
                      onApplySavedFilter(filter);
                      onClose();
                    }}
                  >
                    {filter.name}
                    {activePresetId === filter.id && <Check size={15} aria-label="Đang áp dụng" />}
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    aria-label={`Xóa bộ lọc ${filter.name}`}
                    onClick={() => onDeleteSavedFilter(filter.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.saveRow}>
            <label className={styles.field} htmlFor="opportunity-filter-name">
              Lưu điều kiện đang áp dụng
              <input
                id="opportunity-filter-name"
                type="text"
                maxLength={60}
                value={filterName}
                onChange={(event) => setFilterName(event.target.value)}
                placeholder="Tên bộ lọc"
              />
            </label>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={handleSave}
            >
              Lưu
            </Button>
          </div>
        </section>

        <div className={styles.fields}>
          <label className={styles.field} htmlFor="opportunity-filter-stage">
            Giai đoạn bán hàng
            <select
              id="opportunity-filter-stage"
              value={criteria.stage}
              onChange={(event) => {
                const stage = options.stages.find(
                  (option) => option.id === event.target.value
                );
                update({ stage: stage?.id ?? '' });
              }}
            >
              <option value="">Tất cả giai đoạn</option>
              {options.stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.rangeFields}>
            <label className={styles.field} htmlFor="opportunity-filter-min-value">
              Giá trị tối thiểu
              <input
                id="opportunity-filter-min-value"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={criteria.minValue}
                onChange={(event) => update({ minValue: event.target.value })}
                placeholder="Không giới hạn"
              />
            </label>
            <label className={styles.field} htmlFor="opportunity-filter-max-value">
              Giá trị tối đa
              <input
                id="opportunity-filter-max-value"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={criteria.maxValue}
                onChange={(event) => update({ maxValue: event.target.value })}
                placeholder="Không giới hạn"
              />
            </label>
          </div>

          <div className={styles.rangeFields}>
            <label className={styles.field} htmlFor="opportunity-filter-close-from">
              Ngày chốt từ
              <input
                id="opportunity-filter-close-from"
                type="date"
                value={criteria.closeDateFrom}
                onChange={(event) => update({ closeDateFrom: event.target.value })}
              />
            </label>
            <label className={styles.field} htmlFor="opportunity-filter-close-to">
              Ngày chốt đến
              <input
                id="opportunity-filter-close-to"
                type="date"
                value={criteria.closeDateTo}
                onChange={(event) => update({ closeDateTo: event.target.value })}
              />
            </label>
          </div>

          <label className={styles.field} htmlFor="opportunity-filter-product">
            Sản phẩm liên quan
            <select
              id="opportunity-filter-product"
              value={criteria.productId}
              onChange={(event) => update({ productId: event.target.value })}
            >
              <option value="">Tất cả sản phẩm</option>
              {options.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field} htmlFor="opportunity-filter-owner">
            Người sở hữu
            <select
              id="opportunity-filter-owner"
              value={criteria.ownerName}
              onChange={(event) => update({ ownerName: event.target.value })}
            >
              <option value="">Tất cả nhân sự</option>
              {options.owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>
        </div>

        {validationError && (
          <p className={styles.error} role="alert">
            {validationError}
          </p>
        )}
        {persistenceError && (
          <p className={styles.error} role="alert">
            {persistenceError}
          </p>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClearAll}>
            Đặt lại tất cả
          </Button>
          <Button variant="primary" leftIcon={<Check size={15} />} onClick={handleApply}>
            Áp dụng bộ lọc
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
