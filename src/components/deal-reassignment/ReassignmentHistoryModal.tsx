import React from 'react';
import { ArrowRight, History, X } from 'lucide-react';
import { IReassignmentHistoryItem } from '../../interfaces/deal-reassignment.interface';
import { formatCurrency } from '../../utils/formatters';
import styles from './ReassignmentHistoryModal.module.css';

export interface IReassignmentHistoryModalProps {
  isOpen: boolean;
  history: ReadonlyArray<IReassignmentHistoryItem>;
  dealTitle?: string;
  onClose: () => void;
}

export const ReassignmentHistoryModal: React.FC<IReassignmentHistoryModalProps> = ({
  isOpen,
  history,
  dealTitle,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <History size={18} color="var(--color-primary)" />
            {dealTitle ? `Nhật Ký Bàn Giao: ${dealTitle}` : 'Toàn Bộ Nhật Ký Phân Bổ Lại Cơ Hội'}
          </h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className={styles.modalBody}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Chưa có lượt bàn giao nào được ghi nhận.
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((item) => (
                <article key={item.id} className={styles.historyItem}>
                  <header className={styles.historyItemHeader}>
                    <span className={styles.historyDealTitle}>
                      {item.dealTitle} ({item.company})
                    </span>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                      {formatCurrency(item.dealValue)}
                    </strong>
                  </header>

                  <div className={styles.historyTransferRow}>
                    <span className={styles.repTag}>
                      {item.fromRepAvatar && (
                        <img src={item.fromRepAvatar} alt={item.fromRepName} className={styles.repAvatarSmall} />
                      )}
                      <span>{item.fromRepName}</span>
                    </span>

                    <ArrowRight size={16} color="var(--color-text-muted)" />

                    <span className={styles.repTag} style={{ borderColor: 'var(--color-primary)' }}>
                      {item.toRepAvatar && (
                        <img src={item.toRepAvatar} alt={item.toRepName} className={styles.repAvatarSmall} />
                      )}
                      <span style={{ color: 'var(--color-primary)' }}>{item.toRepName}</span>
                    </span>

                    <span className={styles.reasonBadge}>{item.reasonDisplay}</span>
                  </div>

                  <div className={styles.notesBox}>
                    <strong>Ghi chú bàn giao:</strong> {item.handoverNotes}
                  </div>

                  <footer className={styles.historyFooterMeta}>
                    <span>Thực hiện bởi: <strong>{item.transferredBy}</strong></span>
                    <span>Thời gian: {item.transferredAt}</span>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.modalFooter}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
};
