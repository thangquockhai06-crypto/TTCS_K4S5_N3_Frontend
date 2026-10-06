import React from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Crown,
  Edit2,
  History,
  Sparkles,
  Star,
} from 'lucide-react';
import { ContactRoleType, IContact } from '../../interfaces/contact.interface';
import { Avatar } from '../common';
import styles from './BuyingInfluenceMatrix.module.css';

export interface IBuyingInfluenceMatrixProps {
  contacts: IContact[];
  onEdit: (contact: IContact) => void;
  onTransfer: (contact: IContact) => void;
  onViewHistory: (contact: IContact) => void;
  onSetPrimary: (contactId: string, customerId: string) => void;
}

interface IRoleColumnConfig {
  role: ContactRoleType;
  title: string;
  subTitle: string;
  strategy: string;
  icon: React.ReactNode;
  headerModifier: string;
  color: string;
}

const COLUMNS: IRoleColumnConfig[] = [
  {
    role: 'decision_maker',
    title: 'Người quyết định',
    subTitle: 'Người chốt mua',
    strategy: 'Chiến lược Sale: Tập trung vào lợi tức đầu tư, thời gian thu hồi vốn, giá trị tổng thể & chốt điều khoản hợp đồng.',
    icon: <Crown size={16} color="#9333ea" />,
    headerModifier: styles['matrixColumn__header--decisionMaker'],
    color: '#9333ea',
  },
  {
    role: 'influencer',
    title: 'Người ảnh hưởng',
    subTitle: 'Tư vấn kỹ thuật',
    strategy: 'Chiến lược Sale: Cung cấp tài liệu kiến trúc, demo chuyên sâu, hỗ trợ kiểm thử thực tế & giải đáp kỹ thuật.',
    icon: <Sparkles size={16} color="#2563eb" />,
    headerModifier: styles['matrixColumn__header--influencer'],
    color: '#2563eb',
  },
  {
    role: 'end_user',
    title: 'Người dùng cuối',
    subTitle: 'Trực tiếp vận hành',
    strategy: 'Chiến lược Sale: Tối ưu tính dễ dùng, giảm thời gian thao tác hàng ngày & đào tạo chuyển giao suôn sẻ.',
    icon: <CheckCircle2 size={16} color="#059669" />,
    headerModifier: styles['matrixColumn__header--endUser'],
    color: '#059669',
  },
  {
    role: 'blocker',
    title: 'Người cản trở (Rào cản)',
    subTitle: 'Cần giải tỏa nghi ngại',
    strategy: 'CẢNH BÁO SALE: Chủ động gặp gỡ riêng, lắng nghe nỗi sợ về rủi ro bảo mật, chi phí, hoặc độ gián đoạn để hóa giải rào cản.',
    icon: <AlertCircle size={16} color="#e11d48" />,
    headerModifier: styles['matrixColumn__header--blocker'],
    color: '#e11d48',
  },
];

export const BuyingInfluenceMatrix: React.FC<IBuyingInfluenceMatrixProps> = ({
  contacts,
  onEdit,
  onTransfer,
  onViewHistory,
  onSetPrimary,
}) => {
  return (
    <div className={styles.matrixContainer}>
      <div className={styles.matrixOverview}>
        {COLUMNS.map((col) => {
          const roleContacts = contacts.filter((c) => c.roleInBuying === col.role);

          return (
            <div key={col.role} className={styles.matrixColumn}>
              <div className={`${styles.matrixColumn__header} ${col.headerModifier}`}>
                <div className={styles.matrixColumn__titleRow}>
                  <span className={styles.matrixColumn__title}>
                    {col.icon}
                    {col.title}
                  </span>
                  <span className={styles.matrixColumn__count}>{roleContacts.length}</span>
                </div>
                <div className={styles.matrixColumn__strategy}>{col.strategy}</div>
              </div>

              <div className={styles.matrixColumn__body}>
                {roleContacts.length === 0 ? (
                  <div className={styles.matrixColumn__empty}>
                    <span>Chưa có nhân sự</span>
                    <span style={{ fontSize: '0.75rem' }}>
                      (Chưa xác định {col.subTitle} cho tài khoản này)
                    </span>
                  </div>
                ) : (
                  roleContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`${styles.matrixItem} ${
                        contact.isPrimary ? styles['matrixItem--primary'] : ''
                      }`}
                    >
                      <div className={styles.matrixItem__top}>
                        <Avatar src={contact.avatarUrl} name={contact.fullName} size="sm" />
                        <div className={styles.matrixItem__info}>
                          <span className={styles.matrixItem__name}>
                            {contact.fullName}
                            {contact.isPrimary && ' ⭐'}
                          </span>
                          <span className={styles.matrixItem__title}>{contact.jobTitle}</span>
                          <span className={styles.matrixItem__company}>
                            {contact.companyName}
                          </span>
                        </div>
                      </div>

                      {contact.notes && (
                        <div className={styles.matrixItem__notes}>{contact.notes}</div>
                      )}

                      <div className={styles.matrixItem__actions}>
                        {(contact.transferHistory?.length || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => onViewHistory(contact)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#2563eb',
                              fontSize: '0.6875rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title="Xem lịch sử chuyển công ty"
                          >
                            <History size={11} /> Lịch sử
                          </button>
                        )}

                        {!contact.isPrimary && (
                          <button
                            type="button"
                            onClick={() => onSetPrimary(contact.id, contact.customerId)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#d97706',
                              fontSize: '0.6875rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title="Đặt làm đầu mối chính"
                          >
                            <Star size={11} /> Đầu mối
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onTransfer(contact)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#2563eb',
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                          title="Chuyển sang công ty khác"
                        >
                          <ArrowRightLeft size={11} /> Chuyển
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(contact)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#475569',
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={11} /> Sửa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
