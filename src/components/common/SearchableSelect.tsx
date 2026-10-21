import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, Check, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import styles from './SearchableSelect.module.css';

export interface ISearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

export interface ISearchableSelectProps {
  options: ISearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  allowAll?: boolean;
  allLabel?: string;
  allValue?: string;
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  title?: string;
  align?: 'left' | 'right';
}

export const SearchableSelect: React.FC<ISearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm người phụ trách...',
  pageSize = 6,
  allowAll = true,
  allLabel = 'Tất cả người phụ trách',
  allValue = 'all',
  icon,
  className,
  triggerClassName,
  disabled = false,
  title,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
      setPage(1);
    }
  }, [isOpen]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return options;
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(query) : false;
      const matchVal = opt.value.toLowerCase().includes(query);
      return matchLabel || matchSub || matchVal;
    });
  }, [options, search]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOptions.slice(start, start + pageSize);
  }, [filteredOptions, currentPage, pageSize]);

  // Selected item label
  const isAllSelected = allowAll && (value === allValue || value === '');
  const selectedOption = useMemo(() => {
    if (isAllSelected) return null;
    return options.find((opt) => opt.value === value);
  }, [options, value, isAllSelected]);

  const displayLabel = useMemo(() => {
    if (isAllSelected) {
      return `👥 ${allLabel}`;
    }
    if (selectedOption) {
      return selectedOption.label;
    }
    return placeholder;
  }, [isAllSelected, allLabel, selectedOption, placeholder]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const getInitials = (text: string) => {
    if (!text) return '?';
    const words = text.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`${styles.container} ${className || ''}`} ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles['trigger--open'] : ''} ${triggerClassName || ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        title={title || displayLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          {icon && <span className={styles.triggerIcon}>{icon}</span>}
          <span className={styles.triggerText}>{displayLabel}</span>
        </div>
        <ChevronDown
          size={15}
          className={`${styles.triggerChevron} ${isOpen ? styles['triggerChevron--open'] : ''}`}
        />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={`${styles.popover} ${align === 'right' ? styles['popover--alignRight'] : ''}`}
          role="dialog"
          aria-label="Chọn người phụ trách"
        >
          {/* Search Header */}
          <div className={styles.searchHeader}>
            <div className={styles.searchBox}>
              <Search size={14} style={{ color: 'var(--color-text-muted, #94a3b8)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                  title="Xóa tìm kiếm"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className={styles.optionsList} role="listbox">
            {/* "All" Option pinned when no search query or matches "all" */}
            {allowAll && (!search || allLabel.toLowerCase().includes(search.toLowerCase()) || 'tất cả'.includes(search.toLowerCase())) && (
              <button
                type="button"
                className={`${styles.optionItem} ${isAllSelected ? styles['optionItem--selected'] : ''}`}
                onClick={() => handleSelect(allValue)}
                role="option"
                aria-selected={isAllSelected}
              >
                <div className={styles.optionLeft}>
                  <div className={`${styles.avatarCircle} ${styles.avatarAll}`}>
                    <Users size={14} />
                  </div>
                  <div className={styles.optionText}>
                    <span className={`${styles.optionLabel} ${isAllSelected ? styles['optionLabel--selected'] : ''}`}>
                      {allLabel}
                    </span>
                    <span className={styles.optionSubLabel}>Toàn bộ danh sách phân công</span>
                  </div>
                </div>
                {isAllSelected && <Check size={14} className={styles.checkIcon} />}
              </button>
            )}

            {paginatedOptions.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.optionItem} ${isSelected ? styles['optionItem--selected'] : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  title={`${opt.label} ${opt.subLabel ? `(${opt.subLabel})` : ''}`}
                >
                  <div className={styles.optionLeft}>
                    {opt.icon ? (
                      <span className={styles.triggerIcon}>{opt.icon}</span>
                    ) : (
                      <div className={styles.avatarCircle}>{getInitials(opt.label)}</div>
                    )}
                    <div className={styles.optionText}>
                      <span className={`${styles.optionLabel} ${isSelected ? styles['optionLabel--selected'] : ''}`}>
                        {opt.label}
                      </span>
                      {opt.subLabel && <span className={styles.optionSubLabel}>{opt.subLabel}</span>}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className={styles.checkIcon} />}
                </button>
              );
            })}

            {filteredOptions.length === 0 && !allowAll && (
              <div className={styles.emptyState}>Không tìm thấy mục nào khớp &quot;{search}&quot;</div>
            )}
            {filteredOptions.length === 0 && allowAll && search && !allLabel.toLowerCase().includes(search.toLowerCase()) && (
              <div className={styles.emptyState}>Không tìm thấy người phụ trách khớp &quot;{search}&quot;</div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className={styles.paginationFooter}>
            <span className={styles.paginationText}>
              {filteredOptions.length === 0
                ? '0 kết quả'
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredOptions.length)} / ${filteredOptions.length}`}
            </span>

            {totalPages > 1 && (
              <div className={styles.paginationActions}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((prev) => Math.max(1, prev - 1));
                  }}
                  title="Trang trước"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className={styles.pageIndicator}>
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                  title="Trang tiếp theo"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
