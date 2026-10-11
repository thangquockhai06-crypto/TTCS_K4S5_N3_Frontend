import {
  ILead,
  ILeadFilter,
  LeadStatusType,
  LeadSourceType,
  LeadTemperatureType,
} from '../types/Lead.types';

export function createEmptyLeadFilter(): ILeadFilter {
  return {
    search: '',
    statuses: [],
    sources: [],
    temperatures: [],
    ownerIds: [],
    createdFrom: '',
    createdTo: '',
  };
}

export function cloneLeadFilter(filters: ILeadFilter): ILeadFilter {
  return {
    ...filters,
    statuses: [...filters.statuses],
    sources: [...filters.sources],
    temperatures: [...filters.temperatures],
    ownerIds: [...filters.ownerIds],
  };
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateLeadFilterDateRange(filters: ILeadFilter): string | null {
  if (filters.createdFrom && !isValidDateOnly(filters.createdFrom)) {
    return 'Ngày bắt đầu không hợp lệ.';
  }
  if (filters.createdTo && !isValidDateOnly(filters.createdTo)) {
    return 'Ngày kết thúc không hợp lệ.';
  }
  if (
    filters.createdFrom &&
    filters.createdTo &&
    filters.createdFrom > filters.createdTo
  ) {
    return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  }
  return null;
}

function matchesAny<T extends string>(selected: T[], value: T): boolean {
  return selected.length === 0 || selected.includes(value);
}

function getUtcDatePart(value: string): string | null {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function filterLeads(leads: readonly ILead[], filters: ILeadFilter): ILead[] {
  const normalizedSearch = filters.search.trim().toLocaleLowerCase();

  return leads.filter((lead) => {
    const textMatch =
      normalizedSearch.length === 0 ||
      [lead.fullName, lead.company, lead.email, lead.phone].some((value) =>
        value.toLocaleLowerCase().includes(normalizedSearch)
      );
    const statusMatch = matchesAny<LeadStatusType>(filters.statuses, lead.status);
    const sourceMatch = matchesAny<LeadSourceType>(filters.sources, lead.source);
    const temperatureMatch = matchesAny<LeadTemperatureType>(
      filters.temperatures,
      lead.temperature
    );
    const ownerMatch =
      filters.ownerIds.length === 0 || filters.ownerIds.includes(lead.owner.id);
    const createdDate = getUtcDatePart(lead.createdAt);
    const fromMatch =
      !filters.createdFrom || (createdDate !== null && createdDate >= filters.createdFrom);
    const toMatch =
      !filters.createdTo || (createdDate !== null && createdDate <= filters.createdTo);

    return (
      textMatch &&
      statusMatch &&
      sourceMatch &&
      temperatureMatch &&
      ownerMatch &&
      fromMatch &&
      toMatch
    );
  });
}

export type LeadSlaStateType = 'overdue' | 'on-track' | 'unknown';

export function getLeadSlaState(lead: ILead, now: Date): LeadSlaStateType {
  if (!lead.slaDueAt || Number.isNaN(now.getTime())) {
    return 'unknown';
  }

  const dueAt = Date.parse(lead.slaDueAt);
  if (Number.isNaN(dueAt)) {
    return 'unknown';
  }

  return dueAt < now.getTime() ? 'overdue' : 'on-track';
}
