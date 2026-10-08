import {
  CustomerFilterCustomer,
  CustomerFilterField,
  CustomerFilterState,
} from '../types/CustomerFilter.types';

export const normalizeSearchValue = (value: string): string =>
  value.trim().toLocaleLowerCase();

const normalizePhone = (value: string): string => value.replace(/\D/g, '');

export const matchesCustomerFilters = (
  customer: CustomerFilterCustomer,
  filter: CustomerFilterState
): boolean => {
  const query = normalizeSearchValue(filter.search);
  const queryDigits = normalizePhone(filter.search);
  const matchesSearch =
    query.length === 0 ||
    customer.fullName.toLocaleLowerCase().includes(query) ||
    customer.companyName.toLocaleLowerCase().includes(query) ||
    (customer.taxId?.toLocaleLowerCase().includes(query) ?? false) ||
    customer.phone.toLocaleLowerCase().includes(query) ||
    (queryDigits.length > 0 && normalizePhone(customer.phone).includes(queryDigits));

  return (
    matchesSearch &&
    (filter.statuses.length === 0 || filter.statuses.includes(customer.status)) &&
    (filter.industries.length === 0 || filter.industries.includes(customer.industry)) &&
    (filter.companySizes.length === 0 ||
      filter.companySizes.includes(customer.companySize)) &&
    (filter.regions.length === 0 || filter.regions.includes(customer.region)) &&
    (filter.ownerIds.length === 0 || filter.ownerIds.includes(customer.ownerId))
  );
};

export const cloneCustomerFilterState = (
  state: CustomerFilterState
): CustomerFilterState => ({
  search: state.search,
  statuses: [...state.statuses],
  industries: [...state.industries],
  companySizes: [...state.companySizes],
  regions: [...state.regions],
  ownerIds: [...state.ownerIds],
});

export const toggleCustomerFilterValue = (
  state: CustomerFilterState,
  field: CustomerFilterField,
  value: string
): CustomerFilterState => {
  const currentValues = state[field];
  const values = currentValues.includes(value)
    ? currentValues.filter((currentValue) => currentValue !== value)
    : [...currentValues, value];

  return { ...state, [field]: values };
};
