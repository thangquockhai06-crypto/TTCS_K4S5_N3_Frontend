export interface CustomerFilterCustomer {
  id: string;
  fullName: string;
  companyName: string;
  taxId?: string;
  phone: string;
  status: string;
  industry: string;
  companySize: string;
  region: string;
  ownerId: string;
  ownerName: string;
}

export interface CustomerFilterState {
  search: string;
  statuses: string[];
  industries: string[];
  companySizes: string[];
  regions: string[];
  ownerIds: string[];
}

export type CustomerFilterField =
  | 'statuses'
  | 'industries'
  | 'companySizes'
  | 'regions'
  | 'ownerIds';

export interface CustomerFilterOption {
  value: string;
  label: string;
}

export interface CustomerFilterOptions {
  statuses: CustomerFilterOption[];
  industries: CustomerFilterOption[];
  companySizes: CustomerFilterOption[];
  regions: CustomerFilterOption[];
  owners: CustomerFilterOption[];
}

export interface ActiveCustomerFilter {
  id: string;
  field: CustomerFilterField | 'search';
  value: string;
  label: string;
}

export interface SavedCustomerFilter {
  id: string;
  name: string;
  state: CustomerFilterState;
  createdAt: string;
  updatedAt: string;
}

export const EMPTY_CUSTOMER_FILTER_STATE: CustomerFilterState = {
  search: '',
  statuses: [],
  industries: [],
  companySizes: [],
  regions: [],
  ownerIds: [],
};
