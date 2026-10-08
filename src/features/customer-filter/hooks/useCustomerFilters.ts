import { useCallback, useMemo, useState } from 'react';
import {
  ActiveCustomerFilter,
  CustomerFilterCustomer,
  CustomerFilterField,
  CustomerFilterOptions,
  CustomerFilterState,
  EMPTY_CUSTOMER_FILTER_STATE,
} from '../types/CustomerFilter.types';
import {
  filterCustomers,
  getCustomerFilterOptions,
} from '../services/CustomerFilterService';
import {
  cloneCustomerFilterState,
  toggleCustomerFilterValue,
} from '../utils/CustomerFilterUtils';

export interface UseCustomerFiltersResult {
  filterState: CustomerFilterState;
  options: CustomerFilterOptions;
  filteredCustomers: CustomerFilterCustomer[];
  activeFilters: ActiveCustomerFilter[];
  setSearch: (search: string) => void;
  toggleFilter: (field: CustomerFilterField, value: string) => void;
  removeFilter: (filter: ActiveCustomerFilter) => void;
  applyFilterState: (state: CustomerFilterState) => void;
  resetFilters: () => void;
}

const FILTER_LABELS: Record<CustomerFilterField, string> = {
  statuses: 'Trạng thái',
  industries: 'Ngành nghề',
  companySizes: 'Quy mô',
  regions: 'Khu vực',
  ownerIds: 'Người sở hữu',
};

const FILTER_FIELDS: CustomerFilterField[] = [
  'statuses',
  'industries',
  'companySizes',
  'regions',
  'ownerIds',
];

export const useCustomerFilters = (
  customers: readonly CustomerFilterCustomer[]
): UseCustomerFiltersResult => {
  const [filterState, setFilterState] = useState<CustomerFilterState>(() =>
    cloneCustomerFilterState(EMPTY_CUSTOMER_FILTER_STATE)
  );

  const options = useMemo(() => getCustomerFilterOptions(customers), [customers]);
  const filteredCustomers = useMemo(
    () => filterCustomers(customers, filterState),
    [customers, filterState]
  );

  const activeFilters = useMemo<ActiveCustomerFilter[]>(() => {
    const active: ActiveCustomerFilter[] = [];
    if (filterState.search.trim()) {
      active.push({
        id: 'search',
        field: 'search',
        value: filterState.search,
        label: `Từ khóa: ${filterState.search.trim()}`,
      });
    }

    FILTER_FIELDS.forEach((field) => {
      filterState[field].forEach((value) => {
        const option =
          field === 'ownerIds'
            ? options.owners.find((item) => item.value === value)
            : options[field].find((item) => item.value === value);
        active.push({
          id: `${field}:${value}`,
          field,
          value,
          label: `${FILTER_LABELS[field]}: ${option?.label ?? value}`,
        });
      });
    });
    return active;
  }, [filterState, options]);

  const setSearch = useCallback((search: string): void => {
    setFilterState((current) => ({ ...current, search }));
  }, []);

  const toggleFilter = useCallback(
    (field: CustomerFilterField, value: string): void => {
      setFilterState((current) => toggleCustomerFilterValue(current, field, value));
    },
    []
  );

  const removeFilter = useCallback((filter: ActiveCustomerFilter): void => {
    setFilterState((current) => {
      if (filter.field === 'search') {
        return { ...current, search: '' };
      }
      switch (filter.field) {
        case 'statuses':
          return {
            ...current,
            statuses: current.statuses.filter((value) => value !== filter.value),
          };
        case 'industries':
          return {
            ...current,
            industries: current.industries.filter((value) => value !== filter.value),
          };
        case 'companySizes':
          return {
            ...current,
            companySizes: current.companySizes.filter((value) => value !== filter.value),
          };
        case 'regions':
          return {
            ...current,
            regions: current.regions.filter((value) => value !== filter.value),
          };
        case 'ownerIds':
          return {
            ...current,
            ownerIds: current.ownerIds.filter((value) => value !== filter.value),
          };
      }
    });
  }, []);

  const applyFilterState = useCallback((state: CustomerFilterState): void => {
    setFilterState(cloneCustomerFilterState(state));
  }, []);

  const resetFilters = useCallback((): void => {
    setFilterState(cloneCustomerFilterState(EMPTY_CUSTOMER_FILTER_STATE));
  }, []);

  return {
    filterState,
    options,
    filteredCustomers,
    activeFilters,
    setSearch,
    toggleFilter,
    removeFilter,
    applyFilterState,
    resetFilters,
  };
};
