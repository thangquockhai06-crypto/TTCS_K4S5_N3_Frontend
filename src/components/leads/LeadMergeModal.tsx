import React, { useState, useEffect } from 'react';
import { GitMerge, Check, History, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Modal, Button, Badge } from '../common';
import { ILeadSubmission } from '../../interfaces/lead-capture.interface';
import { IDuplicateLeadPair } from '../../interfaces/lead-deduplication.interface';
import styles from './LeadMergeModal.module.css';

export interface ILeadMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: IDuplicateLeadPair | null;
  onConfirmMerge: (dto: {
    masterLeadId: string;
    duplicateLeadId: string;
    mergedData: {
      fullName: string;
      email: string;
      phone: string;
      company: string;
      leadSource: string;
      interest: ILeadSubmission['interest'];
      notes?: string;
    };
    mergedHistoryNotes: string[];
  }) => boolean;
}

export const LeadMergeModal: React.FC<ILeadMergeModalProps> = ({
  isOpen,
  onClose,
  pair,
  onConfirmMerge,
}) => {
  const [masterId, setMasterId] = useState<string>('');

  useEffect(() => {
    if (pair) {
      setMasterId(pair.leadA.id);
    }
  }, [pair]);

  if (!pair) return null;

  const leadA = pair.leadA;
  const leadB = pair.leadB;

  const masterLead = masterId === leadA.id ? leadA : leadB;
  const duplicateLead = masterId === leadA.id ? leadB : leadA;

  const handleExecuteMerge = (): void => {
    const success = onConfirmMerge({
      masterLeadId: masterLead.id,
      duplicateLeadId: duplicateLead.id,
      mergedData: {
        fullName: masterLead.fullName,
        email: masterLead.email,
        phone: masterLead.phone,
        company: masterLead.company,
        leadSource: `${masterLead.leadSource} (gộp từ ${duplicateLead.leadSource})`,
        interest: masterLead.interest,
        notes: masterLead.notes
          ? `${masterLead.notes} | [Ghi chú gộp]: ${duplicateLead.notes || 'Không có'}`
          : duplicateLead.notes,
      },
      mergedHistoryNotes: [
        `Gộp thông tin bản ghi phụ ID: ${duplicateLead.id} (Tên: ${duplicateLead.fullName}, Email: ${duplicateLead.email}, SĐT: ${duplicateLead.phone}) vào ngày ${new Date().toLocaleDateString('vi-VN')}.`,
      ],
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gộp Bản Ghi Lead Trùng Lặp"
      subtitle="Hợp nhất thông tin và bảo toàn nguyên vẹn lịch sử hoạt động của cả hai bản ghi"
      maxWidth="lg"
    >
      <div className={styles.modalContent}>
        {/* Notice rule box */}
        <div className={styles.noticeBox}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Lý do phát hiện trùng lặp:</strong> {pair.matchDetail}.
            <div style={{ marginTop: '2px', fontSize: '0.78rem' }}>
              Chọn bản ghi chính bạn muốn lưu giữ. Mọi lịch sử tương tác, nguồn gốc và ghi chú của bản ghi còn lại sẽ được tự động tích hợp đầy đủ vào bản ghi chính.
            </div>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className={styles.comparisonGrid}>
          {/* Lead A Card */}
          <div
            className={`${styles.leadCard} ${masterId === leadA.id ? styles.leadCardActive : ''}`}
            onClick={() => setMasterId(leadA.id)}
          >
            <div className={styles.cardHeader}>
              <span
                className={`${styles.cardRoleTag} ${
                  masterId === leadA.id ? styles.roleMaster : styles.roleSecondary
                }`}
              >
                {masterId === leadA.id ? '✓ BẢN GHI CHÍNH (GIỮ LẠI)' : 'BẢN GHI PHỤ (SẼ GỘP)'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                ID: {leadA.id}
              </span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Họ và tên</span>
              <span className={styles.fieldValue}>{leadA.fullName}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Email liên hệ</span>
              <span className={styles.fieldValue}>{leadA.email}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Số điện thoại</span>
              <span className={styles.fieldValue}>{leadA.phone}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Công ty / Doanh nghiệp</span>
              <span className={styles.fieldValue}>{leadA.company || '—'}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Nguồn tiếp nhận</span>
              <span className={styles.fieldValue}>
                <Badge tone="primary">{leadA.leadSource}</Badge>
              </span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Thời gian gửi</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {leadA.submittedAt}
              </span>
            </div>
          </div>

          {/* Lead B Card */}
          <div
            className={`${styles.leadCard} ${masterId === leadB.id ? styles.leadCardActive : ''}`}
            onClick={() => setMasterId(leadB.id)}
          >
            <div className={styles.cardHeader}>
              <span
                className={`${styles.cardRoleTag} ${
                  masterId === leadB.id ? styles.roleMaster : styles.roleSecondary
                }`}
              >
                {masterId === leadB.id ? '✓ BẢN GHI CHÍNH (GIỮ LẠI)' : 'BẢN GHI PHỤ (SẼ GỘP)'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                ID: {leadB.id}
              </span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Họ và tên</span>
              <span className={styles.fieldValue}>{leadB.fullName}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Email liên hệ</span>
              <span className={styles.fieldValue}>{leadB.email}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Số điện thoại</span>
              <span className={styles.fieldValue}>{leadB.phone}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Công ty / Doanh nghiệp</span>
              <span className={styles.fieldValue}>{leadB.company || '—'}</span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Nguồn tiếp nhận</span>
              <span className={styles.fieldValue}>
                <Badge tone="primary">{leadB.leadSource}</Badge>
              </span>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Thời gian gửi</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {leadB.submittedAt}
              </span>
            </div>
          </div>
        </div>

        {/* History preservation preview */}
        <div className={styles.historyPreserveCard}>
          <div className={styles.historyTitle}>
            <History size={16} color="var(--color-primary, #2563EB)" />
            Bảo toàn lịch sử hoạt động của cả hai bản ghi
          </div>
          <div className={styles.historyList}>
            <div className={styles.historyItem}>
              <strong>Bản ghi {leadA.fullName}:</strong> Tiếp nhận lúc {leadA.submittedAt} từ nguồn &quot;{leadA.leadSource}&quot; (IP: {leadA.ipAddress}).
            </div>
            <div className={styles.historyItem}>
              <strong>Bản ghi {leadB.fullName}:</strong> Tiếp nhận lúc {leadB.submittedAt} từ nguồn &quot;{leadB.leadSource}&quot; (IP: {leadB.ipAddress}).
            </div>
            <div className={styles.historyItem}>
              <strong>Nhật ký hợp nhất:</strong> Tự động bổ sung ghi chú gộp và khóa bản ghi phụ để tránh trùng lặp cuộc gọi giữa các nhân viên kinh doanh.
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<GitMerge size={16} />}
            onClick={handleExecuteMerge}
          >
            Xác Nhận Gộp &amp; Bảo Toàn Lịch Sử
          </Button>
        </div>
      </div>
    </Modal>
  );
};
