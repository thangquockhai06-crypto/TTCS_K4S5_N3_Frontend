import React, { useState } from 'react';
import { Check, Info, SlidersHorizontal, X } from 'lucide-react';
import { IStageThresholdRule } from '../../interfaces/stagnant-deal.interface';
import styles from './StageThresholdConfigModal.module.css';

export interface IStageThresholdConfigModalProps {
  isOpen: boolean;
  thresholdRules: ReadonlyArray<IStageThresholdRule>;
  onClose: () => void;
  onSaveRule: (stageId: string, newMaxDays: number) => void;
}

export const StageThresholdConfigModal: React.FC<IStageThresholdConfigModalProps> = ({
  isOpen,
  thresholdRules,
  onClose,
  onSaveRule,
}) => {
  const [localRules, setLocalRules] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    thresholdRules.forEach((r) => {
      map[r.stageId] = r.maxInactiveDays;
    });
    return map;
  });

  if (!isOpen) return null;

  const handleInputChange = (stageId: string, value: number): void => {
    setLocalRules((prev) => ({
      ...prev,
      [stageId]: Math.max(1, Math.min(60, value)),
    }));
  };

  const handleSaveAll = (): void => {
    Object.entries(localRules).forEach(([stageId, maxDays]) => {
      onSaveRule(stageId, maxDays);
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <SlidersHorizontal size={18} color="var(--color-primary)" />
            Cấu Hình Ngưỡng N Ngày Bất Động Theo Giai Đoạn
          </h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className={styles.modalBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 99, 235, 0.08)', padding: '0.75rem', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>
              Hệ thống sẽ tự động gắn cờ cảnh báo khi một cơ hội không có bất kỳ cuộc gọi, email, cuộc họp hoặc ghi chú nào trong quá <strong>N ngày</strong> quy định.
            </span>
          </div>

          <div className={styles.rulesList}>
            {thresholdRules.map((rule) => {
              const currentVal = localRules[rule.stageId] ?? rule.maxInactiveDays;

              return (
                <div key={rule.stageId} className={styles.ruleItem}>
                  <div className={styles.ruleInfo}>
                    <span className={styles.ruleStageName}>
                      {rule.stageNameVi} ({rule.stageName})
                    </span>
                    <span className={styles.ruleDesc}>{rule.description}</span>
                  </div>

                  <div className={styles.ruleInputWrap}>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className={styles.ruleInput}
                      value={currentVal}
                      onChange={(e) => handleInputChange(rule.stageId, Number(e.target.value))}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      ngày
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Hủy Bỏ
          </button>
          <button type="button" className={styles.btnSave} onClick={handleSaveAll}>
            <Check size={16} />
            Lưu Cấu Hình
          </button>
        </footer>
      </div>
    </div>
  );
};
