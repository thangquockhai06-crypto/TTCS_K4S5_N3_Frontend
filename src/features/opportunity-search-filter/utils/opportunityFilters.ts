import { IDeal } from '../../../interfaces';
import {
  IOpportunityFilterCriteria,
  IOpportunityProductsByDeal,
  OpportunityFilterKey,
} from '../types/OpportunitySearchFilter.types';

export const OPPORTUNITY_FILTER_KEYS: ReadonlyArray<OpportunityFilterKey> = [
  'stage',
  'minValue',
  'maxValue',
  'closeDateFrom',
  'closeDateTo',
  'productId',
  'ownerName',
];

export const EMPTY_OPPORTUNITY_FILTERS: IOpportunityFilterCriteria = {
  stage: '',
  minValue: '',
  maxValue: '',
  closeDateFrom: '',
  closeDateTo: '',
  productId: '',
  ownerName: '',
};

export function cloneOpportunityFilters(
  criteria: IOpportunityFilterCriteria
): IOpportunityFilterCriteria {
  return { ...criteria };
}

function parseDateToISO(value: string): string | null {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const localMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const year = isoMatch ? Number(isoMatch[1]) : Number(localMatch?.[3]);
  const month = isoMatch ? Number(isoMatch[2]) : Number(localMatch?.[2]);
  const day = isoMatch ? Number(isoMatch[3]) : Number(localMatch?.[1]);
  if (!isoMatch && !localMatch) return null;

  const date = new Date(year, month - 1, day);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function validateOpportunityFilters(
  criteria: IOpportunityFilterCriteria
): string | null {
  const minValue =
    criteria.minValue.trim() === '' ? null : Number(criteria.minValue);
  const maxValue =
    criteria.maxValue.trim() === '' ? null : Number(criteria.maxValue);

  if (minValue !== null && (!Number.isFinite(minValue) || minValue < 0)) {
    return 'Giá trị tối thiểu phải là số không âm hợp lệ.';
  }
  if (maxValue !== null && (!Number.isFinite(maxValue) || maxValue < 0)) {
    return 'Giá trị tối đa phải là số không âm hợp lệ.';
  }
  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    return 'Giá trị tối thiểu không được lớn hơn giá trị tối đa.';
  }

  const fromDate =
    criteria.closeDateFrom === '' ? null : parseDateToISO(criteria.closeDateFrom);
  const toDate =
    criteria.closeDateTo === '' ? null : parseDateToISO(criteria.closeDateTo);
  if (criteria.closeDateFrom !== '' && fromDate === null) {
    return 'Ngày chốt dự kiến bắt đầu không hợp lệ.';
  }
  if (criteria.closeDateTo !== '' && toDate === null) {
    return 'Ngày chốt dự kiến kết thúc không hợp lệ.';
  }
  if (fromDate && toDate && fromDate > toDate) {
    return 'Ngày bắt đầu không được sau ngày kết thúc.';
  }
  return null;
}

export function getActiveOpportunityFilterCount(
  criteria: IOpportunityFilterCriteria
): number {
  return Object.values(criteria).filter((value) => value !== '').length;
}

export function getOpportunityFilterLabel(
  key: OpportunityFilterKey,
  criteria: IOpportunityFilterCriteria,
  productNames: ReadonlyMap<string, string>
): string {
  switch (key) {
    case 'stage':
      return `Giai đoạn: ${criteria.stage}`;
    case 'minValue':
      return `Từ giá trị: ${Number(criteria.minValue).toLocaleString('vi-VN')}`;
    case 'maxValue':
      return `Đến giá trị: ${Number(criteria.maxValue).toLocaleString('vi-VN')}`;
    case 'closeDateFrom':
      return `Chốt từ: ${criteria.closeDateFrom}`;
    case 'closeDateTo':
      return `Chốt đến: ${criteria.closeDateTo}`;
    case 'productId':
      return `Sản phẩm: ${productNames.get(criteria.productId) ?? criteria.productId}`;
    case 'ownerName':
      return `Người sở hữu: ${criteria.ownerName}`;
  }
}

export function filterOpportunities(
  deals: ReadonlyArray<IDeal>,
  criteria: IOpportunityFilterCriteria,
  productsByDeal: IOpportunityProductsByDeal
): IDeal[] {
  const minValue =
    criteria.minValue.trim() === '' ? null : Number(criteria.minValue);
  const maxValue =
    criteria.maxValue.trim() === '' ? null : Number(criteria.maxValue);
  const fromDate =
    criteria.closeDateFrom === '' ? null : parseDateToISO(criteria.closeDateFrom);
  const toDate =
    criteria.closeDateTo === '' ? null : parseDateToISO(criteria.closeDateTo);

  return deals.filter((deal) => {
    if (criteria.stage && deal.stage !== criteria.stage) return false;
    if (minValue !== null && deal.value < minValue) return false;
    if (maxValue !== null && deal.value > maxValue) return false;
    if (criteria.ownerName && deal.ownerName !== criteria.ownerName) return false;
    if (criteria.productId && productsByDeal[deal.id] !== criteria.productId) {
      return false;
    }

    if (fromDate || toDate) {
      const closeDate = parseDateToISO(deal.expectedCloseDate);
      if (!closeDate) return false;
      if (fromDate && closeDate < fromDate) return false;
      if (toDate && closeDate > toDate) return false;
    }

    return true;
  });
}
