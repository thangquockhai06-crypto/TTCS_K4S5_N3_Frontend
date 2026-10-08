import React, { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Check, Plus, RefreshCw, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { useCustomerFilters } from '../hooks/useCustomerFilters';
import { useSavedCustomerFilters } from '../hooks/useSavedCustomerFilters';
import {
  CustomerFilterCustomer,
  CustomerFilterField,
  CustomerFilterOption,
} from '../types/CustomerFilter.types';
import styles from './CustomerFilterFeature.module.css';

export interface CustomerFilterFeatureProps {
  customers: readonly CustomerFilterCustomer[];
  onFilteredCustomerIdsChange: (customerIds: string[]) => void;
  resetKey?: number;
}

interface FilterControlProps {
  field: CustomerFilterField;
  label: string;
  options: CustomerFilterOption[];
  selectedValues: string[];
  onToggle: (field: CustomerFilterField, value: string) => void;
}

const FilterControl: React.FC<FilterControlProps> = ({
  field,
  label,
  options,
  selectedValues,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <details
      ref={detailsRef}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className={styles.customerFilter__control}
    >
      <summary className={styles.customerFilter__controlTrigger}>
        <span>{label}</span>
        <span className={styles.customerFilter__controlCount}>
          {selectedValues.length > 0 ? selectedValues.length : 'Tất cả'}
        </span>
      </summary>
      <div className={styles.customerFilter__options} role="group" aria-label={label}>
        {options.length === 0 ? (
          <span className={styles.customerFilter__optionEmpty}>Chưa có lựa chọn</span>
        ) : (
          options.map((option) => (
            <label key={option.value} className={styles.customerFilter__option}>
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onToggle(field, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))
        )}
      </div>
    </details>
  );
};

export const CustomerFilterFeature: React.FC<CustomerFilterFeatureProps> = ({
  customers,
  onFilteredCustomerIdsChange,
  resetKey = 0,
}) => {
  const searchInputId = useId();
  const savedFilterNameId = useId();
  const [newFilterName, setNewFilterName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const filters = useCustomerFilters(customers);
  const saved = useSavedCustomerFilters();

  useEffect(() => {
    onFilteredCustomerIdsChange(filters.filteredCustomers.map(({ id }) => id));
  }, [filters.filteredCustomers, onFilteredCustomerIdsChange]);

  useEffect(() => {
    filters.resetFilters();
  }, [filters.resetFilters, resetKey]);

  const saveCurrentFilter = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSuccessMessage(null);
    const wasSaved = await saved.saveFilter(newFilterName, filters.filterState);
    if (wasSaved) {
      setNewFilterName('');
      setSuccessMessage('Đã lưu bộ lọc.');
    }
  };

  const filterControls: FilterControlProps[] = [
    {
      field: 'statuses',
      label: 'Trạng thái',
      options: filters.options.statuses,
      selectedValues: filters.filterState.statuses,
      onToggle: filters.toggleFilter,
    },
    {
      field: 'industries',
      label: 'Ngành nghề',
      options: filters.options.industries,
      selectedValues: filters.filterState.industries,
      onToggle: filters.toggleFilter,
    },
    {
      field: 'companySizes',
      label: 'Quy mô',
      options: filters.options.companySizes,
      selectedValues: filters.filterState.companySizes,
      onToggle: filters.toggleFilter,
    },
    {
      field: 'regions',
      label: 'Khu vực',
      options: filters.options.regions,
      selectedValues: filters.filterState.regions,
      onToggle: filters.toggleFilter,
    },
    {
      field: 'ownerIds',
      label: 'Người sở hữu',
      options: filters.options.owners,
      selectedValues: filters.filterState.ownerIds,
      onToggle: filters.toggleFilter,
    },
  ];

  return (
    <section className={styles.customerFilter} aria-label="Tìm kiếm và lọc khách hàng">
      <div className={styles.customerFilter__searchRow}>
        <label
          className={styles.customerFilter__visuallyHidden}
          htmlFor={searchInputId}
        >
          Tìm tên khách hàng, mã số thuế hoặc số điện thoại
        </label>
        <div className={styles.customerFilter__search}>
          <Search size={17} aria-hidden="true" />
          <input
            id={searchInputId}
            type="search"
            value={filters.filterState.search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              filters.setSearch(event.currentTarget.value)
            }
            placeholder="Tìm tên khách hàng/doanh nghiệp, mã số thuế hoặc số điện thoại"
            aria-label="Tìm tên khách hàng/doanh nghiệp, mã số thuế hoặc số điện thoại"
          />
          {filters.filterState.search && (
            <button
              type="button"
              className={styles.customerFilter__clearSearch}
              onClick={() => filters.setSearch('')}
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <span className={styles.customerFilter__searchHint}>
          Mã số thuế sẽ được tìm khi có trong dữ liệu khách hàng.
        </span>
      </div>

      <div
        className={styles.customerFilter__controls}
        role="group"
        aria-label="Điều kiện lọc"
      >
        {filterControls.map((control) => (
          <FilterControl key={control.field} {...control} />
        ))}
      </div>

      <div className={styles.customerFilter__active} aria-live="polite">
        <div className={styles.customerFilter__activeHeader}>
          <h2>Điều kiện đang áp dụng</h2>
          {filters.activeFilters.length > 0 && (
            <button
              type="button"
              className={styles.customerFilter__textButton}
              onClick={filters.resetFilters}
            >
              <RotateCcw size={14} />
              Xóa tất cả
            </button>
          )}
        </div>
        {filters.activeFilters.length === 0 ? (
          <p className={styles.customerFilter__muted}>Chưa có điều kiện lọc.</p>
        ) : (
          <div className={styles.customerFilter__chips}>
            {filters.activeFilters.map((filter) => (
              <span key={filter.id} className={styles.customerFilter__chip}>
                {filter.label}
                <button
                  type="button"
                  onClick={() => filters.removeFilter(filter)}
                  aria-label={`Xóa điều kiện ${filter.label}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.customerFilter__saved}>
        <div className={styles.customerFilter__savedHeader}>
          <div>
            <h2>Bộ lọc đã lưu</h2>
            <p className={styles.customerFilter__muted}>
              Được lưu trên trình duyệt hiện tại.
            </p>
          </div>
          <span className={styles.customerFilter__savedCount}>
            {saved.savedFilters.length}
          </span>
        </div>

        <form className={styles.customerFilter__saveForm} onSubmit={saveCurrentFilter}>
          <label className={styles.customerFilter__visuallyHidden} htmlFor={savedFilterNameId}>
            Tên bộ lọc mới
          </label>
          <input
            id={savedFilterNameId}
            type="text"
            value={newFilterName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setNewFilterName(event.currentTarget.value);
              setSuccessMessage(null);
              if (!saved.canRetry) {
                saved.clearError();
              }
            }}
            placeholder="Đặt tên bộ lọc"
            maxLength={80}
            disabled={saved.isSaving}
          />
          <button
            type="submit"
            className={styles.customerFilter__primaryButton}
            disabled={
              saved.isLoading ||
              saved.isSaving ||
              saved.applyingFilterId !== null ||
              saved.deletingFilterId !== null ||
              !newFilterName.trim()
            }
          >
            <Save size={15} />
            {saved.isSaving ? 'Đang lưu...' : 'Lưu bộ lọc'}
          </button>
        </form>

        {saved.error && (
          <div className={styles.customerFilter__error} role="alert">
            <span>{saved.error}</span>
            {saved.canRetry && !saved.isLoading ? (
              <button
                type="button"
                className={styles.customerFilter__textButton}
                onClick={() => void saved.reload()}
                aria-label="Tải lại bộ lọc đã lưu"
              >
                <RefreshCw size={14} />
                Thử lại
              </button>
            ) : null}
          </div>
        )}
        {successMessage && (
          <p className={styles.customerFilter__success} role="status">
            <Check size={15} />
            {successMessage}
          </p>
        )}

        {saved.isLoading ? (
          <p className={styles.customerFilter__loading} role="status">
            Đang tải bộ lọc đã lưu...
          </p>
        ) : saved.savedFilters.length === 0 ? (
          <p className={styles.customerFilter__muted}>Chưa có bộ lọc nào được lưu.</p>
        ) : (
          <ul className={styles.customerFilter__savedList}>
            {saved.savedFilters.map((filter) => (
              <li key={filter.id} className={styles.customerFilter__savedItem}>
                <span className={styles.customerFilter__savedName}>{filter.name}</span>
                <div className={styles.customerFilter__savedActions}>
                  <button
                    type="button"
                    className={styles.customerFilter__textButton}
                    onClick={() => {
                      setSuccessMessage(null);
                      void saved.applyFilter(filter, filters.applyFilterState);
                    }}
                    disabled={
                      saved.isSaving ||
                      saved.applyingFilterId !== null ||
                      saved.deletingFilterId !== null
                    }
                    aria-label={`Áp dụng bộ lọc ${filter.name}`}
                  >
                    <Plus size={14} />
                    {saved.applyingFilterId === filter.id ? 'Đang áp dụng...' : 'Áp dụng'}
                  </button>
                  <button
                    type="button"
                    className={styles.customerFilter__deleteButton}
                    onClick={() => void saved.deleteFilter(filter.id)}
                    disabled={
                      saved.isSaving ||
                      saved.applyingFilterId !== null ||
                      saved.deletingFilterId !== null
                    }
                    aria-label={`Xóa bộ lọc ${filter.name}`}
                  >
                    <Trash2 size={14} />
                    {saved.deletingFilterId === filter.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
