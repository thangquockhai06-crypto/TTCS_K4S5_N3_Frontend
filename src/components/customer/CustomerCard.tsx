import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Building2, Globe, HeartPulse, Mail } from 'lucide-react';
import { CustomerStatusType, ICustomer } from '../../interfaces';
import { formatCurrency, formatCustomerTier } from '../../utils/formatters';
import { Avatar, Badge, BadgeToneType } from '../common';
import styles from './CustomerCard.module.css';

export interface ICustomerCardProps {
  customer: ICustomer;
  index?: number;
  onSelect: (customer: ICustomer) => void;
  onQuickInspect?: (customer: ICustomer) => void;
}

export function getCustomerStatusTone(status: CustomerStatusType): BadgeToneType {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Negotiation':
      return 'warning';
    case 'New Lead':
      return 'primary';
    case 'At Risk':
      return 'danger';
    case 'Churned':
      return 'neutral';
  }
}

export function getCustomerStatusLabel(status: CustomerStatusType): string {
  switch (status) {
    case 'Active':
      return 'Đang hợp tác';
    case 'Negotiation':
      return 'Đang đàm phán';
    case 'New Lead':
      return 'Tiềm năng mới';
    case 'At Risk':
      return 'Cần chú ý';
    case 'Churned':
      return 'Đã ngừng';
  }
}

export const CustomerCard: React.FC<ICustomerCardProps> = ({
  customer,
  index = 0,
  onSelect,
  onQuickInspect,
}) => {
  return (
    <motion.article
      className={styles.customerCard}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -3 }}
      onClick={() => onSelect(customer)}
      role="button"
      tabIndex={0}
      aria-label={`Xem khách hàng ${customer.fullName} từ ${customer.company}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(customer);
        }
      }}
    >
      <div className={styles.customerCard__top}>
        <div className={styles.customerCard__identity}>
          <Avatar src={customer.avatarUrl} name={customer.fullName} size="md" />
          <div className={styles.customerCard__titles}>
            <h3 className={styles.customerCard__name}>{customer.fullName}</h3>
            <p className={styles.customerCard__role}>{customer.role}</p>
          </div>
        </div>
        <Badge tone={getCustomerStatusTone(customer.status)} dot size="sm">
          {getCustomerStatusLabel(customer.status)}
        </Badge>
      </div>

      <div className={styles.customerCard__companyBox}>
        <div className={styles.customerCard__companyRow}>
          <Building2 size={14} className={styles.customerCard__mutedIcon} />
          <strong>{customer.company}</strong>
          <Badge tone="neutral" size="sm">
            {formatCustomerTier(customer.tier)}
          </Badge>
        </div>
        <div className={styles.customerCard__domainRow}>
          <Globe size={13} className={styles.customerCard__mutedIcon} />
          <span>{customer.companyDomain}</span>
          <span>·</span>
          <span>{customer.location}</span>
        </div>
      </div>

      <div className={styles.customerCard__metrics}>
        <div>
          <span className={styles.customerCard__metricLabel}>GIÁ TRỊ HỢP ĐỒNG NĂM</span>
          <strong className={`${styles.customerCard__dealValue} tabular-nums`}>
            {formatCurrency(customer.dealValue)}
          </strong>
        </div>

        <div className={styles.customerCard__health}>
          <span className={styles.customerCard__metricLabel}>ĐIỂM SỨC KHỎE</span>
          <span
            className={`${styles.customerCard__healthBadge} tabular-nums ${
              customer.healthScore >= 80
                ? styles['customerCard__healthBadge--good']
                : customer.healthScore >= 60
                ? styles['customerCard__healthBadge--warn']
                : styles['customerCard__healthBadge--low']
            }`}
          >
            <HeartPulse size={13} />
            {customer.healthScore}%
          </span>
        </div>
      </div>

      <div className={styles.customerCard__tags}>
        {customer.tags.map((tag) => (
          <span key={tag} className={styles.customerCard__tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className={styles.customerCard__footer}>
        <div className={styles.customerCard__owner}>
          <Avatar src={customer.owner.avatarUrl} name={customer.owner.name} size="xs" />
          <span>{customer.owner.name}</span>
        </div>

        <div className={styles.customerCard__actions}>
          {onQuickInspect && (
            <button
              type="button"
              className={styles.customerCard__inspectBtn}
              onClick={(e) => {
                e.stopPropagation();
                onQuickInspect(customer);
              }}
              aria-label={`Xem nhanh ${customer.fullName}`}
            >
              Xem nhanh
            </button>
          )}
          <span className={styles.customerCard__openIcon} aria-hidden="true">
            <Mail size={14} />
            <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </motion.article>
  );
};
