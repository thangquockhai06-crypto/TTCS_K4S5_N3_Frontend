import React, { useState } from 'react';
import { Bookmark, Pencil, Play, Trash2 } from 'lucide-react';
import { ISavedLeadFilter } from '../types/Lead.types';
import styles from '../styles/LeadManagement.module.css';

export interface ISavedLeadFiltersProps {
  filters: ISavedLeadFilter[];
  activePresetId: string | null;
  onApply: (preset: ISavedLeadFilter) => void;
  onRename: (preset: ISavedLeadFilter) => void;
  onDelete: (id: string) => void;
}

export const SavedLeadFilters: React.FC<ISavedLeadFiltersProps> = ({
  filters,
  activePresetId,
  onApply,
  onRename,
  onDelete,
}) => {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  return (
    <section className={styles.savedFilters} aria-labelledby="saved-lead-filters-title">
      <div className={styles.savedFilters__heading}>
        <div>
          <Bookmark size={17} aria-hidden="true" />
          <h2 id="saved-lead-filters-title">Bộ lọc đã lưu</h2>
        </div>
        <span>{filters.length}</span>
      </div>

      {filters.length === 0 ? (
        <p className={styles.savedFilters__empty}>
          Chưa có bộ lọc nào. Áp dụng điều kiện rồi chọn “Lưu bộ lọc”.
        </p>
      ) : (
        <ul className={styles.savedFilters__list}>
          {filters.map((preset) => (
            <li
              className={`${styles.savedFilter} ${
                activePresetId === preset.id ? styles['savedFilter--active'] : ''
              }`}
              key={preset.id}
            >
              <button
                type="button"
                className={styles.savedFilter__apply}
                aria-current={activePresetId === preset.id ? 'true' : undefined}
                onClick={() => onApply(preset)}
              >
                <span>{preset.name}</span>
                <Play size={14} aria-hidden="true" />
              </button>
              {confirmingDeleteId === preset.id ? (
                <div className={styles.savedFilter__confirm}>
                  <span role="status">Xóa bộ lọc này?</span>
                  <button type="button" onClick={() => onDelete(preset.id)}>
                    Xóa
                  </button>
                  <button type="button" onClick={() => setConfirmingDeleteId(null)}>
                    Hủy
                  </button>
                </div>
              ) : (
                <div className={styles.savedFilter__actions}>
                  <button
                    type="button"
                    aria-label={`Đổi tên ${preset.name}`}
                    onClick={() => onRename(preset)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xóa ${preset.name}`}
                    onClick={() => setConfirmingDeleteId(preset.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
