export type CustomerStatusType = 'Active' | 'New Lead' | 'Negotiation' | 'At Risk' | 'Churned';

export type CustomerTierType = 'Enterprise' | 'Mid-Market' | 'Growth' | 'Startup';

export type ActivityType = 'call' | 'email' | 'meeting' | 'deal_update' | 'note' | 'contract';

export interface ICustomerActivity {
  id: string;
  customerId: string;
  customerName?: string;
  companyName?: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  performedBy: {
    name: string;
    avatarUrl: string;
    role: string;
  };
  metadata?: {
    dealDelta?: string;
    duration?: string;
    attachmentName?: string;
  };
}

export interface ICustomerNote {
  id: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  content: string;
  isPinned: boolean;
}

export interface ICustomerFile {
  id: string;
  name: string;
  size: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'DECK';
  uploadedAt: string;
  uploadedBy: string;
}

export interface ICustomer {
  id: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  avatarUrl: string;
  company: string;
  companyDomain: string;
  industry: string;
  location: string;
  tier: CustomerTierType;
  status: CustomerStatusType;
  dealValue: number;
  arrProbability: number;
  healthScore: number;
  tags: string[];
  owner: {
    id: string;
    name: string;
    avatarUrl: string;
    email: string;
  };
  createdAt: string;
  lastContactedAt: string;
  nextFollowUp: string;
  summary: string;
  activities: ICustomerActivity[];
  notes: ICustomerNote[];
  files: ICustomerFile[];
}

export type CustomerSortFieldType = 'dealValue' | 'fullName' | 'company' | 'healthScore' | 'lastContactedAt';
export type SortDirectionType = 'asc' | 'desc';

export interface ICustomerFilterState {
  searchQuery: string;
  status: CustomerStatusType | 'All';
  tier: CustomerTierType | 'All';
  tag: string | 'All';
  sortField: CustomerSortFieldType;
  sortDirection: SortDirectionType;
  viewMode: 'table' | 'grid';
}

export interface CreateCustomerDTO {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  company: string;
  companyDomain: string;
  industry: string;
  location: string;
  tier: CustomerTierType;
  status: CustomerStatusType;
  dealValue: number;
  ownerName: string;
  tags: string[];
  summary: string;
}
