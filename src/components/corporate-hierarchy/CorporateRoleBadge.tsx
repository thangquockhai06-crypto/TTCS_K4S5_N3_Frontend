import React from 'react';
import { Building2, Crown, GitFork, MapPin, Sparkles } from 'lucide-react';
import { CorporateRoleType } from '../../interfaces/corporate-hierarchy.interface';
import styles from './CorporateRoleBadge.module.css';

export interface ICorporateRoleBadgeProps {
  role: CorporateRoleType;
  ownershipPercentage?: number;
}

export const CorporateRoleBadge: React.FC<ICorporateRoleBadgeProps> = ({
  role,
  ownershipPercentage,
}) => {
  let label = 'Công ty Độc lập';
  let modifierClass = styles['roleBadge--standalone'];
  let icon = <Building2 size={13} />;

  if (role === 'parent_holding') {
    label = 'Công ty Mẹ (Holding Tập đoàn)';
    modifierClass = styles['roleBadge--parent'];
    icon = <Crown size={13} />;
  } else if (role === 'operating_subsidiary') {
    label = 'Công ty Con Vận hành';
    modifierClass = styles['roleBadge--subsidiary'];
    icon = <GitFork size={13} />;
  } else if (role === 'regional_branch') {
    label = 'Chi nhánh Pháp nhân Vùng';
    modifierClass = styles['roleBadge--branch'];
    icon = <MapPin size={13} />;
  } else if (role === 'joint_venture') {
    label = 'Công ty Liên doanh';
    modifierClass = styles['roleBadge--jointVent'];
    icon = <Sparkles size={13} />;
  }

  return (
    <span className={`${styles.roleBadge} ${modifierClass}`}>
      {icon}
      <span>{label}</span>
      {ownershipPercentage !== undefined && role !== 'parent_holding' && (
        <span style={{ fontWeight: 800, opacity: 0.9 }}>({ownershipPercentage}% vốn)</span>
      )}
    </span>
  );
};
