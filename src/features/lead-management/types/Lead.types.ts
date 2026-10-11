export const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'qualified', label: 'Đủ điều kiện' },
  { value: 'disqualified', label: 'Không phù hợp' },
] as const;

export const LEAD_SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Giới thiệu' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'social', label: 'Mạng xã hội' },
] as const;

export const LEAD_TEMPERATURE_OPTIONS = [
  { value: 'hot', label: 'Nóng' },
  { value: 'warm', label: 'Ấm' },
  { value: 'cold', label: 'Lạnh' },
] as const;

export type LeadStatusType = (typeof LEAD_STATUS_OPTIONS)[number]['value'];
export type LeadSourceType = (typeof LEAD_SOURCE_OPTIONS)[number]['value'];
export type LeadTemperatureType = (typeof LEAD_TEMPERATURE_OPTIONS)[number]['value'];

export interface ILeadOwner {
  id: string;
  name: string;
}

export interface ILead {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatusType;
  source: LeadSourceType;
  temperature: LeadTemperatureType;
  owner: ILeadOwner;
  createdAt: string;
  slaDueAt?: string;
}

export interface ILeadFilter {
  search: string;
  statuses: LeadStatusType[];
  sources: LeadSourceType[];
  temperatures: LeadTemperatureType[];
  ownerIds: string[];
  createdFrom: string;
  createdTo: string;
}

export interface ISavedLeadFilter {
  id: string;
  name: string;
  filters: ILeadFilter;
}
