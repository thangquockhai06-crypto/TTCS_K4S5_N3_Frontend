import React from 'react';
import {
  ArrowRightLeft,
  Building2,
  Edit2,
  History,
  Mail,
  Phone,
  Star,
  Trash2,
} from 'lucide-react';
import { IContact } from '../../interfaces/contact.interface';
import { Avatar, Badge } from '../common';
import { ContactRoleBadge } from './ContactRoleBadge';
import styles from './ContactCard.module.css';

export interface IContactCardProps {
  contact: IContact;
  onEdit: (contact: IContact) => void;
  onDelete: (contactId: string) => void;
  onTransfer: (contact: IContact) => void;
  onViewHistory: (contact: IContact) => void;
  onSetPrimary: (contactId: string, customerId: string) => void;
}

export const ContactCard: React.FC<IContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onTransfer,
  onViewHistory,
  onSetPrimary,
}) => {
  const transferCount = contact.transferHistory?.length || 0;

  return (
    <article
      className={`${styles.contactCard} ${
        contact.isPrimary ? styles['contactCard--primary'] : ''
      }`}
      aria-label={`Thẻ người liên hệ ${contact.fullName}`}
    >
      <div>
        {/* Card Top: Avatar, Name, Job title */}
        <div className={styles.contactCard__top}>
          <div className={styles.contactCard__avatarWrapper}>
            <Avatar src={contact.avatarUrl} name={contact.fullName} size="lg" />
            {contact.isPrimary && (
              <span
                className={styles.contactCard__primaryStar}
                title="Đầu mối liên hệ chính của doanh nghiệp"
                aria-label="Đầu mối liên hệ chính"
              >
                ★
              </span>
            )}
          </div>

          <div className={styles.contactCard__headerInfo}>
            <div className={styles.contactCard__nameRow}>
              <h3 className={styles.contactCard__name}>{contact.fullName}</h3>
              {contact.isPrimary && (
                <Badge tone="warning" size="sm">
                  ⭐ Đầu mối chính
                </Badge>
              )}
            </div>
            <span className={styles.contactCard__jobTitle} title={contact.jobTitle}>
              {contact.jobTitle}
            </span>
            <span className={styles.contactCard__company}>
              <Building2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {contact.companyName}
              {contact.department && ` · ${contact.department}`}
            </span>
          </div>
        </div>

        {/* Meta badges: Buying Role, Influence Level, Transfer history */}
        <div className={styles.contactCard__metaSection}>
          <ContactRoleBadge role={contact.roleInBuying} size="sm" showSubtitle />

          {contact.influenceLevel === 'high' && (
            <Badge tone="accent" size="sm">
              Ảnh hưởng cao
            </Badge>
          )}

          {transferCount > 0 && (
            <button
              type="button"
              className={styles.contactCard__actionBtn}
              style={{ padding: '2px 8px', fontSize: '0.75rem', borderColor: '#bfdbfe' }}
              onClick={() => onViewHistory(contact)}
              title="Xem nhật ký chuyển công ty"
            >
              <History size={12} /> Đã chuyển ({transferCount})
            </button>
          )}
        </div>

        {/* Contact Info (Email, Phone) */}
        <div className={styles.contactCard__contactInfo}>
          <div className={styles.contactCard__contactRow}>
            <Mail size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <a href={`mailto:${contact.email}`} title={`Gửi email tới ${contact.email}`}>
              {contact.email}
            </a>
          </div>
          <div className={styles.contactCard__contactRow}>
            <Phone size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <a href={`tel:${contact.phone}`} title={`Gọi tới ${contact.phone}`}>
              {contact.phone}
            </a>
          </div>
        </div>

        {/* Sales Notes / Coaching Tips */}
        {contact.notes && (
          <p className={styles.contactCard__notes} title={contact.notes}>
            <strong>Ghi chú:</strong> {contact.notes}
          </p>
        )}
      </div>

      {/* Footer action buttons */}
      <footer className={styles.contactCard__footer}>
        <div className={styles.contactCard__footerLeft}>
          {!contact.isPrimary && (
            <button
              type="button"
              className={styles.contactCard__actionBtn}
              onClick={() => onSetPrimary(contact.id, contact.customerId)}
              title="Đặt làm đầu mối chính của khách hàng này"
            >
              <Star size={13} />
              <span>Đầu mối chính</span>
            </button>
          )}

          <button
            type="button"
            className={`${styles.contactCard__actionBtn} ${styles['contactCard__actionBtn--transfer']}`}
            onClick={() => onTransfer(contact)}
            title="Chuyển contact này sang doanh nghiệp / khách hàng mới"
          >
            <ArrowRightLeft size={13} />
            <span>Chuyển cty</span>
          </button>
        </div>

        <div className={styles.contactCard__footerRight}>
          <button
            type="button"
            className={styles.contactCard__actionBtn}
            onClick={() => onEdit(contact)}
            title="Chỉnh sửa thông tin"
            aria-label="Chỉnh sửa"
          >
            <Edit2 size={13} />
          </button>

          <button
            type="button"
            className={`${styles.contactCard__actionBtn} ${styles['contactCard__actionBtn--danger']}`}
            onClick={() => {
              if (window.confirm(`Bạn có chắc muốn xóa người liên hệ ${contact.fullName}?`)) {
                onDelete(contact.id);
              }
            }}
            title="Xóa người liên hệ"
            aria-label="Xóa"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </footer>
    </article>
  );
};
