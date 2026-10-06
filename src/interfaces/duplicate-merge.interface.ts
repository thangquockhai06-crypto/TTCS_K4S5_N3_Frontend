export type DuplicateMatchType = 'tax_code_exact' | 'website_match' | 'name_similarity' | 'manual';

export type DuplicateMatchLevel = 'high' | 'medium' | 'potential';

export interface IDuplicateCandidate {
  id: string;
  companyName: string;
  taxCode: string;
  website: string;
  industry: string;
  address: string;
  scale: string;
  status: string;
  dealValue: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerTeam: string;
  contactCount: number;
  dealCount: number;
  activityCount: number;
  createdAt: string;
}

export interface IDuplicatePair {
  id: string;
  primaryRecord: IDuplicateCandidate;
  duplicateRecord: IDuplicateCandidate;
  matchType: DuplicateMatchType;
  matchConfidence: number; // e.g. 100, 95, 80
  matchReason: string;
  detectedAt: string;
  status: 'pending' | 'merged' | 'dismissed';
}

export interface IMergeFieldSelection {
  companyName: 'primary' | 'duplicate' | 'custom';
  customCompanyName?: string;
  taxCode: 'primary' | 'duplicate';
  website: 'primary' | 'duplicate';
  industry: 'primary' | 'duplicate';
  address: 'primary' | 'duplicate';
  scale: 'primary' | 'duplicate';
  status: 'primary' | 'duplicate';
  ownerId: 'primary' | 'duplicate';
  dealValue: 'sum' | 'primary' | 'duplicate' | 'max';
}

export interface IMergeCustomerDTO {
  pairId: string;
  primaryId: string;
  duplicateId: string;
  fieldSelections: IMergeFieldSelection;
  keepAllContacts: boolean;
  keepAllDeals: boolean;
  keepAllActivities: boolean;
  mergeNotes?: string;
  mergedBy: string;
  mergedByRole: string;
}

export interface IMergeHistoryRecord {
  id: string;
  pairId: string;
  mergedAt: string;
  primaryId: string;
  primaryName: string;
  duplicateId: string;
  duplicateName: string;
  mergedBy: string;
  mergedByRole: string;
  preservedContactsCount: number;
  preservedDealsCount: number;
  preservedActivitiesCount: number;
  summary: string;
  fieldSelections: IMergeFieldSelection;
}

export interface IDuplicateStats {
  totalPendingPairs: number;
  highConfidenceCount: number;
  mergedCount: number;
  dismissedCount: number;
  conflictingOwnersCount: number;
}
