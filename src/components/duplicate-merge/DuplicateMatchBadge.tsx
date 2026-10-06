import React from 'react';
import { AlertTriangle, FileSpreadsheet, Globe, Sparkles } from 'lucide-react';
import { DuplicateMatchType } from '../../interfaces/duplicate-merge.interface';
import styles from './DuplicateMatchBadge.module.css';

export interface IDuplicateMatchBadgeProps {
  matchType: DuplicateMatchType;
  confidence: number;
}

export const DuplicateMatchBadge: React.FC<IDuplicateMatchBadgeProps> = ({
  matchType,
  confidence,
}) => {
  let label = 'Tương đồng';
  let modifierClass = styles['matchBadge--name'];
  let icon = <Sparkles size={13} />;

  if (matchType === 'tax_code_exact') {
    label = 'Trùng 100% Mã số thuế';
    modifierClass = styles['matchBadge--taxCode'];
    icon = <FileSpreadsheet size={13} />;
  } else if (matchType === 'website_match') {
    label = 'Trùng Website / Domain';
    modifierClass = styles['matchBadge--website'];
    icon = <Globe size={13} />;
  } else if (matchType === 'name_similarity') {
    label = 'Tên công ty gần giống';
    modifierClass = styles['matchBadge--name'];
    icon = <AlertTriangle size={13} />;
  }

  return (
    <span className={`${styles.matchBadge} ${modifierClass}`}>
      {icon}
      <span>{label}</span>
      <span className={styles.matchConfidenceMeter}>{confidence}%</span>
    </span>
  );
};
