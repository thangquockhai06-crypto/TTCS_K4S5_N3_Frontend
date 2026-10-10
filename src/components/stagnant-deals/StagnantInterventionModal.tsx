import React, { useState } from 'react';
import { Check, ShieldAlert, X } from 'lucide-react';
import { IInterventionPayload, IStagnantDeal } from '../../interfaces/stagnant-deal.interface';
import { SALES_REPS } from '../../mock/forecast.mock';
import { formatCurrency } from '../../utils/formatters';
import styles from './StagnantInterventionModal.module.css';

export interface IStagnantInterventionModalProps {
  deal: IStagnantDeal | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: IInterventionPayload) => void;
}

export const StagnantInterventionModal: React.FC<IStagnantInterventionModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [actionType, setActionType] = useState<IInterventionPayload['actionType']>('nudge_rep');
  const [newRepId, setNewRepId] = useState<string>('');
  const [newCloseDate, setNewCloseDate] = useState<string>('');
  const [managerNote, setManagerNote] = useState<string>('');

  if (!isOpen || !deal) return null;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!managerNote.trim()) {
      window.alert('Vui lòng nhập ghi chú chỉ đạo hoặc nội dung can thiệp!');
      return;
    }

    onSubmit({
      dealId: deal.id,
      actionType,
      newRepId: newRepId || undefined,
      newCloseDate: newCloseDate || undefined,
      managerNote,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <ShieldAlert size={18} color="#EF4444" />
            Can Thiệp Thương Vụ Đình Trệ (Manager Action)
          </h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Tóm tắt thương vụ */}
            <div className={styles.dealBanner}>
              <span className={styles.dealBannerTitle}>{deal.title}</span>
              <div className={styles.dealBannerMeta}>
                <span>Doanh nghiệp: <strong>{deal.company}</strong></span>
                <span>Giá trị: <strong>{formatCurrency(deal.dealValue)}</strong></span>
                <span>Phụ trách: <strong>{deal.assignedRepName}</strong></span>
              </div>
            </div>

            {/* Chọn hình thức can thiệp */}
            <div className={styles.formGroup}>
              <label htmlFor="action-type" className={styles.formLabel}>
                Hành động can thiệp của Trưởng nhóm:
              </label>
              <select
                id="action-type"
                className={styles.formSelect}
                value={actionType}
                onChange={(e) => setActionType(e.target.value as IInterventionPayload['actionType'])}
              >
                <option value="nudge_rep">1. Gửi nhắc nhở khẩn cấp & yêu cầu Sales follow-up</option>
                <option value="direct_manager_call">2. Trưởng nhóm trực tiếp gọi điện / họp 3 bên hỗ trợ</option>
                <option value="reassign_rep">3. Điều phối lại thương vụ cho nhân sự khác</option>
                <option value="reschedule_close_date">4. Đặt lại ngày dự kiến chốt mới</option>
                <option value="mark_resolved">5. Đánh dấu đã cứu vãn thương vụ thành công</option>
              </select>
            </div>

            {/* Điều phối lại nhân sự (nếu chọn) */}
            {actionType === 'reassign_rep' && (
              <div className={styles.formGroup}>
                <label htmlFor="new-rep" className={styles.formLabel}>
                  Chuyển nhượng cho nhân sự mới:
                </label>
                <select
                  id="new-rep"
                  className={styles.formSelect}
                  value={newRepId}
                  onChange={(e) => setNewRepId(e.target.value)}
                >
                  <option value="">Chọn nhân sự tiếp quản...</option>
                  {SALES_REPS.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.teamName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Đặt lại hạn chốt mới (nếu chọn) */}
            {actionType === 'reschedule_close_date' && (
              <div className={styles.formGroup}>
                <label htmlFor="new-close-date" className={styles.formLabel}>
                  Ngày dự kiến chốt mới:
                </label>
                <input
                  type="date"
                  id="new-close-date"
                  className={styles.formInput}
                  value={newCloseDate}
                  onChange={(e) => setNewCloseDate(e.target.value)}
                />
              </div>
            )}

            {/* Ghi chú chỉ đạo */}
            <div className={styles.formGroup}>
              <label htmlFor="manager-note" className={styles.formLabel}>
                Nội dung chỉ đạo & Ghi chú hành động:
              </label>
              <textarea
                id="manager-note"
                className={styles.formTextarea}
                placeholder="Nhập hướng xử lý, nội dung nhắc nhở hoặc kết quả trao đổi với khách..."
                value={managerNote}
                onChange={(e) => setManagerNote(e.target.value)}
              />
            </div>
          </div>

          <footer className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={styles.btnSubmit}>
              <Check size={16} />
              Xác Nhận Can Thiệp
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
