import React from 'react';
import {
  Calendar,
  CreditCard,
  ExternalLink,
  Globe,
  MapPin,
  User,
  UserCheck,
} from 'lucide-react';
import { ICompanyAccount } from '../../interfaces/company-account.interface';
import { Button, Modal } from '../common';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { formatCurrency } from '../../utils/formatters';
import styles from './CompanyAccountDetailModal.module.css';

export interface ICompanyAccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: ICompanyAccount | null;
  onEdit: (account: ICompanyAccount) => void;
}

export const CompanyAccountDetailModal: React.FC<ICompanyAccountDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  onEdit,
}) => {
  if (!account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hồ sơ Chi tiết Khách hàng Doanh nghiệp"
      subtitle={`Mã hồ sơ: ${account.id} · Cập nhật gần nhất: ${new Date(account.updatedAt).toLocaleDateString('vi-VN')}`}
    >
      <div className={styles.detailModal}>
        <div className={styles.detailHero}>
          <div className={styles.detailHero__titleRow}>
            <h2 className={styles.detailHero__name}>{account.companyName}</h2>
            <CompanyStatusBadge status={account.status} size="md" />
          </div>
          <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>Mã số thuế: <strong>{account.taxCode}</strong></span>
            <span>Ngành nghề: <strong>{account.industry}</strong></span>
            <span>Quy mô: <strong>{account.scale.toUpperCase()}</strong></span>
          </div>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailItem__label}>
              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Địa chỉ trụ sở
            </span>
            <span className={styles.detailItem__value}>{account.address}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailItem__label}>
              <Globe size={12} style={{ display: 'inline', marginRight: '4px' }} /> Website
            </span>
            <span className={styles.detailItem__value}>
              {account.website ? (
                <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                  {account.website} <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
              ) : (
                'Chưa cập nhật'
              )}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailItem__label}>
              <UserCheck size={12} style={{ display: 'inline', marginRight: '4px' }} /> Nhân viên sở hữu / Phụ trách
            </span>
            <span className={styles.detailItem__value}>
              {account.ownerName} ({account.ownerEmail})
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Nhóm: {account.ownerTeam}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailItem__label}>
              <CreditCard size={12} style={{ display: 'inline', marginRight: '4px' }} /> Doanh số dự kiến (ARR)
            </span>
            <span className={styles.detailItem__value} style={{ color: '#059669', fontSize: '1.0625rem' }}>
              {formatCurrency(account.dealValueEstimate || 0)}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailItem__label}>
              <User size={12} style={{ display: 'inline', marginRight: '4px' }} /> Đại diện liên hệ chính
            </span>
            <span className={styles.detailItem__value}>
              {account.primaryContactName || 'Chưa có thông tin'}
            </span>
            {account.primaryContactPhone && (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SĐT: {account.primaryContactPhone}</span>
            )}
            {account.primaryContactEmail && (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Email: {account.primaryContactEmail}</span>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailItem__label}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> Thời gian khởi tạo
            </span>
            <span className={styles.detailItem__value}>
              {new Date(account.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {account.notes && (
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Ghi chú nội bộ
            </span>
            <div className={styles.notesBox}>{account.notes}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onEdit(account);
            }}
          >
            Chỉnh sửa Hồ sơ
          </Button>
        </div>
      </div>
    </Modal>
  );
};
