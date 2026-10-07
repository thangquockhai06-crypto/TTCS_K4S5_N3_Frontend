export type CustomerStatusType = 'Active' | 'New Lead' | 'Negotiation' | 'At Risk' | 'Churned';

export type CustomerTierType = 'Enterprise' | 'Mid-Market' | 'Growth' | 'Startup';

export type ActivityType = 'call' | 'email' | 'meeting' | 'deal_update' | 'note' | 'contract' | 'status_change';

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

  // EP-03 Fields
  taxCode?: string;
  parentCustomerId?: string;
  totalContractValue?: number;
  lastInteractionAt?: string;
  riskFlag?: boolean;
  riskReason?: string;
  website?: string;
  notesSummary?: string;
  contactsCount?: number;
  dealsCount?: number;
  openTicketsCount?: number;
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
  ownerName?: string;
  tags: string[];
  summary?: string;
  taxCode?: string;
  parentCustomerId?: string;
  totalContractValue?: number;
  website?: string;
}

export interface UpdateCustomerDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  healthScore?: number;
  taxCode?: string;
  parentCustomerId?: string;
  totalContractValue?: number;
  riskFlag?: boolean;
  riskReason?: string;
  industry?: string;
  tier?: string;
  location?: string;
  website?: string;
  notesSummary?: string;
}

// ==========================================
// EP-03 SPRINT 3 INTERFACES
// ==========================================

export type PurchasingRoleType = 'Decider' | 'Influencer' | 'Buyer' | 'Gatekeeper' | 'User';

export interface ICustomerContact {
  id: string;
  customerId: string;
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  role: PurchasingRoleType | string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateContactDTO {
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  role?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface ITransferContactDTO {
  newCustomerId: string;
  reason?: string;
}

export interface ISupportTicket {
  id: string;
  customerId: string;
  ticketCode: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  dueDate?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  isOverdue: boolean;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateSupportTicketDTO {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  assignedUserId?: string;
}

export interface ISavedFilterPreset {
  id: string;
  userId: string;
  name: string;
  entityType: string;
  filterCriteria: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface ICreateSavedFilterDTO {
  name: string;
  entityType?: string;
  filterCriteria: string;
  isDefault?: boolean;
}

export interface ICorporateHierarchyNode {
  id: string;
  fullName: string;
  company: string;
  taxCode?: string;
  tier?: string;
  status: string;
  totalContractValue: number;
  groupContractValue: number;
  children: ICorporateHierarchyNode[];
}

export interface IStagnantCustomer {
  id: string;
  fullName: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  ownerName?: string;
  lastInteractionAt?: string;
  daysInactive: number;
  totalContractValue: number;
  riskFlag: boolean;
}

export interface ICustomer360 {
  customer: ICustomer;
  contacts: ICustomerContact[];
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    expectedCloseDate?: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    createdAt: string;
    userName?: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    authorName?: string;
    createdAt: string;
  }>;
  tickets: ISupportTicket[];
  documents: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  totalContractValue: number;
  groupContractValue: number;
  riskFlag: boolean;
  riskReason?: string;
}

export interface IExcelCustomerPreviewItem {
  rowNumber: number;
  fullName: string;
  company: string;
  phone: string;
  email: string;
  taxCode: string;
  industry: string;
  tier: string;
  totalContractValue: number;
  action: string;
  isValid: boolean;
  isDuplicateMST: boolean;
  errors: string[];
}

export interface IExcelCustomerPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  previewItems: IExcelCustomerPreviewItem[];
}

export interface IExcelCustomerImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: Array<{
    rowNumber: number;
    company: string;
    taxCode: string;
    reasons: string[];
  }>;
}
