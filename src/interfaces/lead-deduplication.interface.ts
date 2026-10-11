import { ICustomer } from './customer.interface';
import { ILeadSubmission, LeadInterestType } from './lead-capture.interface';

export type DuplicateMatchType = 'email' | 'phone' | 'company';

export interface IDuplicateMatchItem {
  matchType: DuplicateMatchType;
  matchValue: string;
  targetType: 'lead' | 'customer';
  matchedRecordId: string;
  matchedRecordName: string;
  matchedRecordCompany?: string;
  matchedRecordEmail?: string;
  matchedRecordPhone?: string;
  similarityScore: number;
}

export interface IDuplicateCheckResult {
  hasDuplicate: boolean;
  matches: IDuplicateMatchItem[];
  suggestedAction: 'merge_lead' | 'link_to_customer' | 'create_new';
  matchedCustomer?: ICustomer;
  matchedLead?: ILeadSubmission;
}

export interface IMergeLeadsDTO {
  masterLeadId: string;
  duplicateLeadId: string;
  mergedData: {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    leadSource: string;
    interest: LeadInterestType;
    notes?: string;
  };
  mergedHistoryNotes: string[];
}

export interface ILinkLeadToCustomerDTO {
  leadId: string;
  customerId: string;
  note?: string;
}

export interface IDuplicateLeadPair {
  leadA: ILeadSubmission;
  leadB: ILeadSubmission;
  matchType: DuplicateMatchType;
  matchDetail: string;
}
