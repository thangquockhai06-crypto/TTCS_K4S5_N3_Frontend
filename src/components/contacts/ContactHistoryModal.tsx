import React from 'react';
import { ArrowRight, Calendar, History } from 'lucide-react';
import { IContact } from '../../interfaces/contact.interface';
import { Avatar, Badge, Button, Modal } from '../common';
import { ContactRoleBadge } from './ContactRoleBadge';
import styles from './ContactHistoryModal.module.css';

export interface IContactHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: IContact | null;
}

export const ContactHistoryModal: React.FC<IContactHistoryModalProps> = ({
  isOpen,
  onClose,
  contact,
}) => {
  if (!contact) return null;

  const history = contact.transferHistory || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử Luân chuyển Doanh nghiệp"
      subtitle={`Nhật ký chuyển đổi công ty và thay đổi vai trò trong quyết định mua của ${contact.fullName}`}
    >
      <div className={styles.historyModal}>
        {/* Contact Info Header */}
        <div className={styles.historyHeader}>
          <Avatar src={contact.avatarUrl} name={contact.fullName} size="lg" />
          <div className={styles.historyHeader__info}>
            <span className={styles.historyHeader__name}>{contact.fullName}</span>
            <span className={styles.historyHeader__sub}>
              Hiện tại: <strong>{contact.jobTitle}</strong> tại <strong>{contact.companyName}</strong>
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
              <ContactRoleBadge role={contact.roleInBuying} size="sm" />
              {contact.isPrimary && (
                <Badge tone="warning" size="sm">
                  ⭐ Đầu mối chính
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        {history.length === 0 ? (
          <div className={styles.historyEmpty}>
            <div className={styles.historyEmpty__icon}>
              <History size={24} />
            </div>
            <p className={styles.historyEmpty__text}>
              Chưa có ghi nhận luân chuyển doanh nghiệp nào cho <strong>{contact.fullName}</strong>.
              Hồ sơ công tác ban đầu tại <strong>{contact.companyName}</strong> vẫn được giữ nguyên vẹn.
            </p>
          </div>
        ) : (
          <div className={styles.historyTimeline}>
            {history.map((record) => (
              <div key={record.id} className={styles.historyTimeline__item}>
                <span className={styles.historyTimeline__dot} />

                <div className={styles.historyTimeline__topRow}>
                  <span className={styles.historyTimeline__date}>
                    <Calendar size={14} /> Ngày chuyển: {record.transferDate}
                  </span>
                  <span className={styles.historyTimeline__by}>
                    Thực hiện bởi: <strong>{record.transferredBy}</strong>
                  </span>
                </div>

                {/* Transition Card */}
                <div className={styles.historyTimeline__transition}>
                  {/* From */}
                  <div className={styles.historyTimeline__fromCol}>
                    <span className={styles.historyTimeline__colTitle}>Từ Doanh nghiệp cũ</span>
                    <span className={styles.historyTimeline__company}>{record.fromCompanyName}</span>
                    <span className={styles.historyTimeline__job}>{record.oldJobTitle}</span>
                    <div style={{ marginTop: '4px' }}>
                      <ContactRoleBadge role={record.oldRole} size="sm" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className={styles.historyTimeline__arrow}>
                    <ArrowRight size={20} />
                  </div>

                  {/* To */}
                  <div className={styles.historyTimeline__toCol}>
                    <span className={styles.historyTimeline__colTitle}>Sang Doanh nghiệp mới</span>
                    <span className={styles.historyTimeline__company}>{record.toCompanyName}</span>
                    <span className={styles.historyTimeline__job}>{record.newJobTitle}</span>
                    <div style={{ marginTop: '4px' }}>
                      <ContactRoleBadge role={record.newRole} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {record.reason && (
                  <div className={styles.historyTimeline__reasonBox}>
                    <span className={styles.historyTimeline__reasonTitle}>
                      Lý do chuyển đổi & Ghi chú bối cảnh:
                    </span>
                    <span>{record.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
