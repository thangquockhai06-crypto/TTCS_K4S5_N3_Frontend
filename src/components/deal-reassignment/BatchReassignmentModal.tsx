import React, { useState } from 'react';
import { ArrowRightLeft, Check, Info, X } from 'lucide-react';
import {
  IReassignableDeal,
  IReassignmentPayload,
  ReassignmentReasonType,
} from '../../interfaces/deal-reassignment.interface';
import { REASSIGNMENT_REASONS } from '../../mock/deal-reassignment.mock';
import { SALES_REPS } from '../../mock/forecast.mock';
import { formatCurrency } from '../../utils/formatters';
import styles from './BatchReassignmentModal.module.css';

export interface IBatchReassignmentModalProps {
  isOpen: boolean;
  selectedDeals: ReadonlyArray<IReassignableDeal>;
  onClose: () => void;
  onSubmit: (payload: IReassignmentPayload) => void;
}

export const BatchReassignmentModal: React.FC<IBatchReassignmentModalProps> = ({
  isOpen,
  selectedDeals,
  onClose,
  onSubmit,
}) => {
  const [toRepId, setToRepId] = useState<string>('');
  const [reason, setReason] = useState<ReassignmentReasonType>('overloaded');
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [notifyNewOwner, setNotifyNewOwner] = useState<boolean>(true);

  if (!isOpen || selectedDeals.length === 0) return null;

  const totalValue = selectedDeals.reduce((sum, d) => sum + d.dealValue, 0);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!toRepId) {
      window.alert('Vui lòng chọn nhân sự tiếp nhận mới!');
      return;
    }
    if (!handoverNotes.trim()) {
      window.alert('Vui lòng nhập lý do cụ thể và ghi chú bàn giao để lưu vết nhật ký!');
      return;
    }

    onSubmit({
      dealIds: selectedDeals.map((d) => d.id),
      toRepId,
      reason,
      handoverNotes,
      notifyNewOwner,
      transferredBy: 'Trần Thị Mai Phương (Trưởng nhóm Kinh doanh)',
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <ArrowRightLeft size={18} color="var(--color-primary)" />
            Điều Phối & Bàn Giao Quyền Sở Hữu ({selectedDeals.length} Cơ Hội)
          </h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Banner tóm tắt các deal được chọn */}
            <div className={styles.selectedDealsBanner}>
              <div className={styles.selectedDealsHeader}>
                <span>Các thương vụ được chọn ({selectedDeals.length}):</span>
                <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalValue)}</strong>
              </div>
              <div className={styles.selectedDealsChips}>
                {selectedDeals.map((deal) => (
                  <span key={deal.id} className={styles.dealChip}>
                    {deal.company} ({formatCurrency(deal.dealValue)})
                  </span>
                ))}
              </div>
            </div>

            {/* Chọn chuyên viên tiếp nhận mới */}
            <div className={styles.formGroup}>
              <label htmlFor="select-new-rep" className={styles.formLabel}>
                Chuyên viên nhận bàn giao mới: <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                id="select-new-rep"
                className={styles.formSelect}
                value={toRepId}
                onChange={(e) => setToRepId(e.target.value)}
                required
              >
                <option value="">-- Chọn chuyên viên tiếp nhận --</option>
                {SALES_REPS.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} · {rep.title} ({rep.teamName})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn lý do điều phối (Nghỉ dài, Quá tải, Chuyên môn...) */}
            <div className={styles.formGroup}>
              <label htmlFor="select-reason" className={styles.formLabel}>
                Lý do điều chuyển thương vụ: <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                id="select-reason"
                className={styles.formSelect}
                value={reason}
                onChange={(e) => setReason(e.target.value as ReassignmentReasonType)}
              >
                {REASSIGNMENT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nội dung ghi chú bàn giao & tiến độ */}
            <div className={styles.formGroup}>
              <label htmlFor="handover-notes" className={styles.formLabel}>
                Ghi chú bàn giao & Chỉ đạo công việc: <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                id="handover-notes"
                className={styles.formTextarea}
                placeholder="Nhập tiến độ hiện tại, đầu mối liên hệ khách hàng, cam kết báo giá, hướng xử lý tiếp theo..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                required
              />
            </div>

            {/* Tùy chọn gửi thông báo */}
            <label className={styles.checkboxWrap}>
              <input
                type="checkbox"
                checked={notifyNewOwner}
                onChange={(e) => setNotifyNewOwner(e.target.checked)}
              />
              <span>Gửi thông báo tức thì đến hòm thư và chuông hệ thống của người nhận mới</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <Info size={14} />
              <span>Người nhận sẽ thấy ngay toàn bộ lịch sử trao đổi, báo giá và tương tác cũ của thương vụ.</span>
            </div>
          </div>

          <footer className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={styles.btnSubmit}>
              <Check size={16} />
              Xác Nhận Bàn Giao
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
