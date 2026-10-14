import {
  ILeadAssignmentLead,
  LeadAssignmentWorkflowStatus,
  LeadSlaStateType,
} from '../types/LeadAssignmentResponseSla.types';

export function getLeadAssignmentStatusLabel(status: LeadAssignmentWorkflowStatus): string {
  switch (status) {
    case 'assigned':
      return 'Assigned';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'contacted':
      return 'Contacted';
    default:
      return 'Unknown';
  }
}

export function parseOptionalDate(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatLocalDateTime(value?: string): string {
  if (!value) {
    return 'Not available';
  }

  const parsed = parseOptionalDate(value);
  if (parsed === null) {
    return 'Invalid timestamp';
  }

  return new Date(parsed).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getLeadSlaState(lead: ILeadAssignmentLead, now: Date): LeadSlaStateType {
  const deadline = parseOptionalDate(lead.slaDeadlineAt);
  if (deadline === null) {
    return 'unknown';
  }

  if (lead.status === 'contacted' || (lead.firstContactAt && parseOptionalDate(lead.firstContactAt)! <= deadline)) {
    return 'satisfied';
  }

  const remainingMs = deadline - now.getTime();
  if (remainingMs < 0) {
    return 'overdue';
  }

  if (remainingMs <= 60 * 60 * 1000) {
    return 'approaching';
  }

  return 'within';
}

function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function getLeadSlaText(lead: ILeadAssignmentLead, now: Date): string {
  const deadline = parseOptionalDate(lead.slaDeadlineAt);
  if (deadline === null) {
    return 'SLA unavailable';
  }

  const diffMs = deadline - now.getTime();
  const totalMinutes = Math.abs(Math.round(diffMs / 60_000));

  if (lead.status === 'contacted' || (lead.firstContactAt && parseOptionalDate(lead.firstContactAt)! <= deadline)) {
    return 'SLA satisfied';
  }

  if (diffMs < 0) {
    return `${formatDuration(totalMinutes)} overdue`;
  }

  if (diffMs <= 60 * 60 * 1000) {
    return `${formatDuration(totalMinutes)} left`;
  }

  return `${formatDuration(totalMinutes)} remaining`;
}

export function getLeadSlaLabel(lead: ILeadAssignmentLead, now: Date): string {
  switch (getLeadSlaState(lead, now)) {
    case 'overdue':
      return 'Overdue';
    case 'approaching':
      return 'Approaching deadline';
    case 'within':
      return 'Within SLA';
    case 'satisfied':
      return 'SLA satisfied';
    default:
      return 'SLA unavailable';
  }
}
