export const LEAD_CONVERSION_REQUIRED_FIELDS = [
  'companyName',
  'contactName',
  'email',
  'phone',
] as const;

export type LeadConversionFieldName =
  | 'companyName'
  | 'industry'
  | 'companySize'
  | 'region'
  | 'contactName'
  | 'email'
  | 'phone'
  | 'leadSource'
  | 'leadOwner'
  | 'notes';

export interface ILeadConversionDraft {
  companyName: string;
  taxCode: string;
  industry: string;
  companySize: string;
  region: string;
  contactName: string;
  email: string;
  phone: string;
  leadSource: string;
  leadOwner: string;
  notes: string;
}

export interface ILeadConversionRequest {
  leadId: string;
  companyName: string;
  taxCode: string;
  industry: string;
  companySize: string;
  region: string;
  contactName: string;
  email: string;
  phone: string;
  leadSource: string;
  leadOwner: string;
  notes: string;
}

export interface ILeadConversionValidationErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  leadOwner?: string;
}

export interface ILeadConversionResponse {
  leadId: string;
  customerId: string;
  contactId: string;
  opportunityId: string;
  customerName: string;
  opportunityName: string;
  convertedAt: string;
  customerRoute: string;
  opportunityRoute: string;
  warning: string;
}
