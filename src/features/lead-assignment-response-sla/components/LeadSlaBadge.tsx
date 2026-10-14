import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, HelpCircle } from 'lucide-react';
import { ILeadAssignmentLead } from '../types/LeadAssignmentResponseSla.types';
import { getLeadSlaLabel, getLeadSlaState, getLeadSlaText } from '../utils/leadAssignmentResponseSla';

interface ILeadSlaBadgeProps {
  lead: ILeadAssignmentLead;
  now: Date;
}

export const LeadSlaBadge: React.FC<ILeadSlaBadgeProps> = ({ lead, now }) => {
  const state = getLeadSlaState(lead, now);
  const label = getLeadSlaLabel(lead, now);
  const detail = getLeadSlaText(lead, now);

  const statusStyles: Record<typeof state, { icon: React.ReactNode; tone: string }> = {
    within: {
      icon: <Clock3 size={14} />, 
      tone: 'var(--color-success-soft)',
    },
    approaching: {
      icon: <AlertTriangle size={14} />, 
      tone: 'var(--color-warning-soft)',
    },
    overdue: {
      icon: <AlertTriangle size={14} />, 
      tone: 'var(--color-danger-soft)',
    },
    satisfied: {
      icon: <CheckCircle2 size={14} />, 
      tone: 'var(--color-info-soft)',
    },
    unknown: {
      icon: <HelpCircle size={14} />, 
      tone: 'var(--color-bg-subtle)',
    },
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '999px',
        background: statusStyles[state].tone,
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
        fontSize: '12px',
        fontWeight: 600,
      }}
      title={`${label}: ${detail}`}
    >
      <span aria-hidden="true">{statusStyles[state].icon}</span>
      <span>{label}</span>
    </div>
  );
};
