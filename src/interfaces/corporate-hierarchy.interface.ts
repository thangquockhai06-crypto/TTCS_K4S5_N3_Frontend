export type CorporateRoleType =
  | 'parent_holding'
  | 'operating_subsidiary'
  | 'regional_branch'
  | 'joint_venture'
  | 'standalone';

export interface ICorporateNode {
  id: string;
  companyName: string;
  taxCode: string;
  industry: string;
  scale: string;
  status: string;
  dealValue: number;
  parentCompanyId: string | null;
  parentCompanyName: string | null;
  corporateRole: CorporateRoleType;
  ownershipPercentage?: number; // e.g. 100%, 51%, 35%
  ownerName: string;
  ownerTeam: string;
  contactCount: number;
  children: ICorporateNode[];
  notes?: string;
  createdAt: string;
}

export interface ICorporateGroupSummary {
  parentCompany: ICorporateNode;
  subsidiaries: ICorporateNode[];
  totalGroupDealValue: number;
  parentOnlyDealValue: number;
  subsidiariesTotalDealValue: number;
  totalGroupSubsidiariesCount: number;
  totalGroupContactsCount: number;
}

export interface IAssignSubsidiaryDTO {
  subsidiaryId: string;
  parentCompanyId: string;
  corporateRole?: CorporateRoleType;
  ownershipPercentage?: number;
  notes?: string;
}

export interface IRemoveSubsidiaryDTO {
  subsidiaryId: string;
}

export interface ICorporateHierarchyStats {
  totalCorporateGroups: number;
  totalSubsidiariesCount: number;
  totalGroupPortfolioValue: number;
  averageSubsidiariesPerGroup: number;
}
