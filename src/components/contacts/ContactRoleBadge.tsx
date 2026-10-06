import React from 'react';
import { AlertCircle, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { ContactRoleType } from '../../interfaces/contact.interface';
import styles from './ContactRoleBadge.module.css';

export interface IContactRoleBadgeProps {
  role: ContactRoleType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showSubtitle?: boolean;
}

const ROLE_CONFIG: Record<
  ContactRoleType,
  {
    label: string;
    shortDesc: string;
    description: string;
    modifierClass: string;
    icon: React.ReactNode;
  }
> = {
  decision_maker: {
    label: 'Người quyết định',
    shortDesc: 'Ký kết & duyệt ngân sách',
    description: 'Có quyền ký kết & duyệt ngân sách',
    modifierClass: styles['contactRoleBadge--decisionMaker'],
    icon: <Crown size={14} />,
  },
  influencer: {
    label: 'Người ảnh hưởng',
    shortDesc: 'Tư vấn & tham mưu kỹ thuật',
    description: 'Tư vấn kỹ thuật & tác động ý kiến',
    modifierClass: styles['contactRoleBadge--influencer'],
    icon: <Sparkles size={14} />,
  },
  end_user: {
    label: 'Người dùng cuối',
    shortDesc: 'Trực tiếp vận hành',
    description: 'Trực tiếp thao tác & hưởng lợi',
    modifierClass: styles['contactRoleBadge--endUser'],
    icon: <CheckCircle2 size={14} />,
  },
  blocker: {
    label: 'Người cản trở',
    shortDesc: 'Cần giải tỏa rào cản',
    description: 'Cần gỡ bỏ nghi ngại & giải tỏa rào cản',
    modifierClass: styles['contactRoleBadge--blocker'],
    icon: <AlertCircle size={14} />,
  },
};

export const ContactRoleBadge: React.FC<IContactRoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  showSubtitle = false,
}) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.influencer;
  const sizeClass = styles[`contactRoleBadge--${size}`];

  return (
    <span
      className={`${styles.contactRoleBadge} ${sizeClass} ${config.modifierClass}`}
      title={`${config.label}: ${config.description}`}
    >
      {showIcon && <span className={styles.contactRoleBadge__icon}>{config.icon}</span>}
      <span className={styles.contactRoleBadge__label}>{config.label}</span>
      {showSubtitle && (
        <span className={styles.contactRoleBadge__sub}>· {config.shortDesc}</span>
      )}
    </span>
  );
};
