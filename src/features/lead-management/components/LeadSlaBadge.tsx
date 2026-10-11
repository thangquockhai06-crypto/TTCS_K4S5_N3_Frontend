import React from 'react';
import { AlertCircle, CircleHelp, Clock3 } from 'lucide-react';
import { ILead } from '../types/Lead.types';
import { getLeadSlaState } from '../utils/leadFilters';
import styles from '../styles/LeadManagement.module.css';

export interface ILeadSlaBadgeProps {
  lead: ILead;
  now: Date;
}

function formatDueAt(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return '';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(timestamp);
}

export const LeadSlaBadge: React.FC<ILeadSlaBadgeProps> = ({ lead, now }) => {
  const state = getLeadSlaState(lead, now);
  const dueLabel = lead.slaDueAt ? formatDueAt(lead.slaDueAt) : '';

  if (state === 'overdue') {
    return (
      <span className={`${styles.slaBadge} ${styles['slaBadge--overdue']}`}>
        <AlertCircle size={14} aria-hidden="true" />
        <span>Quá SLA · {dueLabel}</span>
      </span>
    );
  }

  if (state === 'on-track') {
    return (
      <span className={`${styles.slaBadge} ${styles['slaBadge--onTrack']}`}>
        <Clock3 size={14} aria-hidden="true" />
        <span>Trong SLA · {dueLabel}</span>
      </span>
    );
  }

  return (
    <span className={`${styles.slaBadge} ${styles['slaBadge--unknown']}`}>
      <CircleHelp size={14} aria-hidden="true" />
      <span>Chưa có dữ liệu SLA</span>
    </span>
  );
};
