import { formatCurrency } from '../../../utils/formatters';
import {
  IOpportunityHistoryEntry,
  IOpportunityHistoryFilter,
  OpportunityHistoryField,
} from '../types/OpportunityHistory.types';

export const OPPORTUNITY_HISTORY_FIELD_LABELS: Record<
  OpportunityHistoryField,
  string
> = {
  stage: 'Giai đoạn bán hàng',
  value: 'Giá trị cơ hội',
  expectedCloseDate: 'Ngày chốt dự kiến',
  owner: 'Người sở hữu',
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Mới tiếp nhận',
  new: 'Mới tiếp nhận',
  contact: 'Đã liên hệ',
  contacted: 'Đã liên hệ',
  proposal: 'Đề xuất',
  negotiation: 'Đang đàm phán',
  won: 'Thành công',
  lost: 'Thất bại',
};

function parseHistoryDate(value: string): Date | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsedDate = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    : new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function sortHistoryNewestFirst(
  entries: readonly IOpportunityHistoryEntry[]
): IOpportunityHistoryEntry[] {
  return entries
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .sort((left, right) => {
      const leftDate = left.entry.changedAt
        ? parseHistoryDate(left.entry.changedAt)?.getTime()
        : undefined;
      const rightDate = right.entry.changedAt
        ? parseHistoryDate(right.entry.changedAt)?.getTime()
        : undefined;

      if (leftDate === undefined && rightDate === undefined) {
        return left.originalIndex - right.originalIndex;
      }
      if (leftDate === undefined) return 1;
      if (rightDate === undefined) return -1;
      return rightDate - leftDate || left.originalIndex - right.originalIndex;
    })
    .map(({ entry }) => entry);
}

export function filterOpportunityHistory(
  entries: readonly IOpportunityHistoryEntry[],
  filters: IOpportunityHistoryFilter
): IOpportunityHistoryEntry[] {
  const fromTime = filters.fromDate
    ? new Date(`${filters.fromDate}T00:00:00`).getTime()
    : null;
  const toTime = filters.toDate
    ? new Date(`${filters.toDate}T23:59:59.999`).getTime()
    : null;

  return entries.filter((entry) => {
    if (filters.field !== 'all' && entry.field !== filters.field) {
      return false;
    }
    if (fromTime === null && toTime === null) {
      return true;
    }

    const changedAt = entry.changedAt
      ? parseHistoryDate(entry.changedAt)?.getTime()
      : undefined;
    if (changedAt === undefined) {
      return false;
    }
    if (fromTime !== null && changedAt < fromTime) {
      return false;
    }
    if (toTime !== null && changedAt > toTime) {
      return false;
    }
    return true;
  });
}

export function formatHistoryValue(
  field: OpportunityHistoryField,
  value: string | number | null
): string {
  if (value === null || (typeof value === 'string' && !value.trim())) {
    return '—';
  }

  if (field === 'value') {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? formatCurrency(numericValue) : value;
  }

  if (field === 'stage') {
    return STAGE_LABELS[String(value).toLowerCase()] ?? String(value);
  }

  if (field === 'expectedCloseDate') {
    const parsedDate = parseHistoryDate(String(value));
    return parsedDate
      ? parsedDate.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : String(value);
  }

  return String(value);
}

export function formatHistoryTimestamp(value: string | null): string {
  if (!value) {
    return 'Không rõ thời điểm';
  }
  const parsedDate = parseHistoryDate(value);
  if (!parsedDate) {
    return 'Không rõ thời điểm';
  }
  return parsedDate.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
