export type CompanyStatusType = 'lead' | 'negotiation' | 'customer' | 'churned';

export type CompanyScaleType = 'startup' | 'sme' | 'mid_market' | 'enterprise';

export interface ICompanyAccount {
  id: string;
  companyName: string;
  taxCode: string;
  industry: string;
  scale: CompanyScaleType;
  website: string;
  address: string;
  status: CompanyStatusType;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerTeam: string;
  dealValueEstimate: number;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyAccountDTO {
  companyName: string;
  taxCode: string;
  industry: string;
  scale: CompanyScaleType;
  website: string;
  address: string;
  status: CompanyStatusType;
  ownerId: string;
  dealValueEstimate?: number;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
}

export interface UpdateCompanyAccountDTO {
  companyName?: string;
  taxCode?: string;
  industry?: string;
  scale?: CompanyScaleType;
  website?: string;
  address?: string;
  status?: CompanyStatusType;
  ownerId?: string;
  dealValueEstimate?: number;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
}

export type CompanySortFieldType = 'companyName' | 'taxCode' | 'createdAt' | 'dealValueEstimate' | 'status';

export interface ICompanyFilterState {
  searchQuery: string;
  status: CompanyStatusType | 'all';
  scale: CompanyScaleType | 'all';
  industry: string | 'all';
  ownerTeam: string | 'all';
  scope: 'my_accounts' | 'team_accounts' | 'all_accounts';
  sortField: CompanySortFieldType;
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'table';
}

export interface ICompanyStats {
  totalCount: number;
  leadCount: number;
  negotiationCount: number;
  customerCount: number;
  churnedCount: number;
  totalPipelineValue: number;
}
