import React from 'react';
import { Ban, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { CompanyStatusType } from '../../interfaces/company-account.interface';
import styles from './CompanyStatusBadge.module.css';

export interface ICompanyStatusBadgeProps {
  status: CompanyStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  CompanyStatusType,
  {
    label: string;
    englishLabel: string;
    modifierClass: string;
    icon: React.ReactNode;
  }
> = {
  lead: {
    label: 'Tiềm năng',
    englishLabel: 'Prospect Lead',
    modifierClass: styles['statusBadge--lead'],
    icon: <Sparkles size={14} />,
  },
  negotiation: {
    label: 'Đang giao dịch',
    englishLabel: 'Transacting / Negotiation',
    modifierClass: styles['statusBadge--negotiation'],
    icon: <Clock size={14} />,
  },
  customer: {
    label: 'Khách hàng',
    englishLabel: 'Active Customer',
    modifierClass: styles['statusBadge--customer'],
    icon: <CheckCircle2 size={14} />,
  },
  churned: {
    label: 'Ngừng hợp tác',
    englishLabel: 'Churned / Inactive',
    modifierClass: styles['statusBadge--churned'],
    icon: <Ban size={14} />,
  },
};

export const CompanyStatusBadge: React.FC<ICompanyStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.lead;
  const sizeClass = styles[`statusBadge--${size}`];

  return (
    <span
      className={`${styles.statusBadge} ${sizeClass} ${config.modifierClass}`}
      title={`Trạng thái hồ sơ: ${config.label} (${config.englishLabel})`}
    >
      {showIcon && <span className={styles.statusBadge__icon}>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
