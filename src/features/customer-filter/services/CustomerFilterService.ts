import {
  CustomerFilterCustomer,
  CustomerFilterOptions,
  CustomerFilterOption,
  CustomerFilterState,
  SavedCustomerFilter,
} from '../types/CustomerFilter.types';
import {
  cloneCustomerFilterState,
  matchesCustomerFilters,
} from '../utils/CustomerFilterUtils';

const STORAGE_KEY = 'nexuscrm.customer-filters.v1';

const STATUS_LABELS: Record<string, string> = {
  Active: 'Đang hợp tác',
  'New Lead': 'Tiềm năng mới',
  Negotiation: 'Đang đàm phán',
  'At Risk': 'Cần chú ý',
  Churned: 'Đã ngừng',
};

const toOptions = (values: string[]): CustomerFilterOption[] =>
  [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'vi'))
    .map((value) => ({ value, label: value }));

export const getCustomerFilterOptions = (
  customers: readonly CustomerFilterCustomer[]
): CustomerFilterOptions => {
  const owners = new Map<string, string>();
  customers.forEach((customer) => {
    if (customer.ownerId) {
      owners.set(customer.ownerId, customer.ownerName || customer.ownerId);
    }
  });

  return {
    statuses: toOptions(customers.map(({ status }) => status)).map((option) => ({
      ...option,
      label: STATUS_LABELS[option.value] ?? option.label,
    })),
    industries: toOptions(customers.map(({ industry }) => industry)),
    companySizes: toOptions(customers.map(({ companySize }) => companySize)),
    regions: toOptions(customers.map(({ region }) => region)),
    owners: [...owners.entries()]
      .sort((left, right) => left[1].localeCompare(right[1], 'vi'))
      .map(([value, label]) => ({ value, label })),
  };
};

export const filterCustomers = (
  customers: readonly CustomerFilterCustomer[],
  state: CustomerFilterState
): CustomerFilterCustomer[] =>
  customers.filter((customer) => matchesCustomerFilters(customer, state));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCustomerFilterState = (value: unknown): value is CustomerFilterState => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.search === 'string' &&
    isStringArray(value.statuses) &&
    isStringArray(value.industries) &&
    isStringArray(value.companySizes) &&
    isStringArray(value.regions) &&
    isStringArray(value.ownerIds)
  );
};

const isSavedCustomerFilter = (value: unknown): value is SavedCustomerFilter => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isCustomerFilterState(value.state) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
};

export const customerFilterService = {
  async listSavedFilters(): Promise<SavedCustomerFilter[]> {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue === null) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue) || !parsedValue.every(isSavedCustomerFilter)) {
      throw new Error('Danh sách bộ lọc đã lưu không hợp lệ. Hãy xóa dữ liệu lưu và thử lại.');
    }
    return parsedValue.map((filter) => ({
      ...filter,
      state: cloneCustomerFilterState(filter.state),
    }));
  },

  async saveFilter(name: string, state: CustomerFilterState): Promise<SavedCustomerFilter[]> {
    const filters = await this.listSavedFilters();
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error('Vui lòng nhập tên bộ lọc.');
    }
    if (filters.some((filter) => filter.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      throw new Error('Tên bộ lọc này đã được sử dụng.');
    }

    const timestamp = new Date().toISOString();
    const savedFilter: SavedCustomerFilter = {
      id: globalThis.crypto.randomUUID(),
      name: normalizedName,
      state: cloneCustomerFilterState(state),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const updatedFilters = [...filters, savedFilter];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
    return updatedFilters;
  },

  async deleteFilter(filterId: string): Promise<SavedCustomerFilter[]> {
    const filters = await this.listSavedFilters();
    const updatedFilters = filters.filter((filter) => filter.id !== filterId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
    return updatedFilters;
  },
};
