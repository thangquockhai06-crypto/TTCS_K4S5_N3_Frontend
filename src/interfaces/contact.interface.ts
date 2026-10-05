export type ContactRoleType = 'decision_maker' | 'influencer' | 'end_user' | 'blocker';

export type InfluenceLevelType = 'high' | 'medium' | 'low';

export interface IContactTransferHistory {
  id: string;
  contactId: string;
  transferDate: string;
  fromCustomerId: string;
  fromCompanyName: string;
  toCustomerId: string;
  toCompanyName: string;
  oldJobTitle: string;
  newJobTitle: string;
  oldRole: ContactRoleType;
  newRole: ContactRoleType;
  reason: string;
  transferredBy: string;
}

export interface IContact {
  id: string;
  customerId: string;
  customerName: string;
  companyName: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  department: string;
  roleInBuying: ContactRoleType;
  influenceLevel: InfluenceLevelType;
  isPrimary: boolean;
  avatarUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  transferHistory: IContactTransferHistory[];
}

export interface CreateContactDTO {
  customerId: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  department?: string;
  roleInBuying: ContactRoleType;
  influenceLevel?: InfluenceLevelType;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateContactDTO {
  customerId?: string;
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  department?: string;
  roleInBuying?: ContactRoleType;
  influenceLevel?: InfluenceLevelType;
  isPrimary?: boolean;
  notes?: string;
}

export interface TransferContactDTO {
  contactId: string;
  newCustomerId: string;
  newJobTitle: string;
  newRoleInBuying: ContactRoleType;
  newDepartment?: string;
  isPrimaryInNewCompany?: boolean;
  reason: string;
  transferredBy: string;
}

export type ContactSortFieldType = 'fullName' | 'companyName' | 'jobTitle' | 'roleInBuying' | 'createdAt';

export interface IContactFilterState {
  searchQuery: string;
  customerId: string | 'all';
  roleInBuying: ContactRoleType | 'all';
  isPrimary: 'all' | 'primary' | 'secondary';
  influenceLevel: InfluenceLevelType | 'all';
  sortField: ContactSortFieldType;
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'table' | 'matrix';
}

export interface IContactStats {
  totalContacts: number;
  decisionMakersCount: number;
  influencersCount: number;
  endUsersCount: number;
  blockersCount: number;
  primaryContactsCount: number;
  transferredCount: number;
}
