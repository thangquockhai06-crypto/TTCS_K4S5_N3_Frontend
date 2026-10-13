import {
  ILeadRoutingQueueItem,
  ILeadRoutingRuleDraft,
  LeadRoutingQueueFilterType,
} from '../types/LeadRouting.types';

export type LeadRoutingSlaStateType = 'on-track' | 'approaching' | 'overdue' | 'unknown';

export function getLeadRoutingSlaState(
  lead: ILeadRoutingQueueItem,
  now: Date
): LeadRoutingSlaStateType {
  const receivedAt = Date.parse(lead.receivedAt);
  if (Number.isNaN(receivedAt) || Number.isNaN(now.getTime())) {
    return 'unknown';
  }
  if (lead.status === 'assigned') {
    return 'on-track';
  }

  const elapsedMs = Math.max(0, now.getTime() - receivedAt);
  if (elapsedMs >= 5 * 60_000) {
    return 'overdue';
  }
  if (elapsedMs >= 4 * 60_000) {
    return 'approaching';
  }
  return 'on-track';
}

export function formatWaitingDuration(lead: ILeadRoutingQueueItem, now: Date): string {
  const receivedAt = Date.parse(lead.receivedAt);
  const endTime =
    lead.status === 'assigned' ? Date.parse(lead.assignedAt ?? '') : now.getTime();
  if (Number.isNaN(receivedAt) || Number.isNaN(endTime)) {
    return 'Chưa có dữ liệu';
  }
  const elapsedSeconds = Math.max(0, Math.floor((endTime - receivedAt) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes} phút ${String(seconds).padStart(2, '0')} giây`;
}

export function validateLeadRoutingRule(
  rule: ILeadRoutingRuleDraft,
  availableMemberIds: readonly string[]
): string | null {
  if (!rule.name.trim()) {
    return 'Nhập tên quy tắc.';
  }
  if (!rule.teamId) {
    return 'Chọn nhóm kinh doanh nhận Lead.';
  }
  if (rule.strategy === 'region' && !rule.conditionValue) {
    return 'Chọn khu vực áp dụng.';
  }
  if (rule.strategy === 'industry' && !rule.conditionValue) {
    return 'Chọn ngành hàng áp dụng.';
  }
  if (
    rule.strategy === 'round-robin' &&
    (rule.assigneeIds.length < 2 ||
      rule.assigneeIds.some((employeeId) => !availableMemberIds.includes(employeeId)))
  ) {
    return 'Chọn ít nhất hai nhân viên đang hoạt động thuộc nhóm đã chọn.';
  }
  return null;
}

export function matchesLeadRoutingQueueFilter(
  lead: ILeadRoutingQueueItem,
  filter: LeadRoutingQueueFilterType,
  now: Date
): boolean {
  const slaState = getLeadRoutingSlaState(lead, now);
  switch (filter) {
    case 'awaiting-manual-assignment':
      return lead.status === 'awaiting-manual-assignment';
    case 'failed':
      return lead.status === 'failed';
    case 'approaching-target':
      return slaState === 'approaching';
    case 'overdue':
      return slaState === 'overdue';
    default:
      return true;
  }
}
