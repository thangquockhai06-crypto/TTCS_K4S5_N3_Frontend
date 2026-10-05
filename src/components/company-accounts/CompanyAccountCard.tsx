import React from 'react';
import {
  Edit2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Globe,
  MapPin,
  Trash2,
  User,
} from 'lucide-react';
import { ICompanyAccount } from '../../interfaces/company-account.interface';
import { Badge } from '../common';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { formatCurrency } from '../../utils/formatters';
import styles from './CompanyAccountCard.module.css';

export interface ICompanyAccountCardProps {
  account: ICompanyAccount;
  onEdit: (account: ICompanyAccount) => void;
  onDelete: (id: string) => void;
  onViewDetail: (account: ICompanyAccount) => void;
}

const SCALE_LABEL_MAP: Record<string, string> = {
  startup: 'Startup (1-20)',
  sme: 'SME (21-100)',
  mid_market: 'Mid-Market (101-500)',
  enterprise: 'Enterprise (500+)',
};

export const CompanyAccountCard: React.FC<ICompanyAccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  return (
    <article className={styles.companyCard} aria-label={`Hồ sơ doanh nghiệp ${account.companyName}`}>
      <div>
        {/* Header: Name, Tax code, Status */}
        <div className={styles.companyCard__header}>
          <div className={styles.companyCard__titleGroup}>
            <h3 className={styles.companyCard__name}>{account.companyName}</h3>
            <span className={styles.companyCard__taxCode}>
              <FileSpreadsheet size={12} style={{ color: '#2563eb' }} /> MST: <strong>{account.taxCode}</strong>
            </span>
          </div>
          <CompanyStatusBadge status={account.status} size="sm" />
        </div>

        {/* Badges: Scale & Industry */}
        <div className={styles.companyCard__badgeRow} style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
          <Badge tone="neutral" size="sm">
            {SCALE_LABEL_MAP[account.scale] || account.scale}
          </Badge>
          <Badge tone="accent" size="sm">
            {account.industry}
          </Badge>
        </div>

        {/* Info Grid: Address, Website, Primary contact */}
        <div className={styles.companyCard__infoGrid}>
          <div className={styles.companyCard__infoRow} title={account.address}>
            <MapPin size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <span>{account.address}</span>
          </div>

          {account.website && (
            <div className={styles.companyCard__infoRow}>
              <Globe size={14} style={{ color: '#64748b', flexShrink: 0 }} />
              <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noreferrer">
                {account.website} <ExternalLink size={11} style={{ display: 'inline' }} />
              </a>
            </div>
          )}

          {account.primaryContactName && (
            <div className={styles.companyCard__infoRow}>
              <User size={14} style={{ color: '#64748b', flexShrink: 0 }} />
              <span>Đại diện: <strong>{account.primaryContactName}</strong></span>
              {account.primaryContactPhone && (
                <span style={{ color: '#64748b' }}>({account.primaryContactPhone})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Owner & Pipeline Value */}
      <div>
        <div className={styles.companyCard__ownerBox}>
          <div className={styles.companyCard__ownerInfo}>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Phụ trách bởi:</span>
            <span className={styles.companyCard__ownerName}>{account.ownerName}</span>
            <span className={styles.companyCard__ownerTeam}>{account.ownerTeam}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>Doanh số dự kiến:</span>
            <span className={styles.companyCard__dealValue}>{formatCurrency(account.dealValueEstimate || 0)}</span>
          </div>
        </div>

        {/* Footer actions */}
        <footer className={styles.companyCard__footer} style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onViewDetail(account)}
          >
            <Eye size={13} /> Chi tiết
          </button>

          <div className={styles.companyCard__actions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => onEdit(account)}
              title="Chỉnh sửa hồ sơ"
            >
              <Edit2 size={13} /> Sửa
            </button>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles['actionBtn--danger']}`}
              onClick={() => {
                if (window.confirm(`Xác nhận xóa hồ sơ khách hàng doanh nghiệp ${account.companyName}?`)) {
                  onDelete(account.id);
                }
              }}
              title="Xóa hồ sơ"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
};
