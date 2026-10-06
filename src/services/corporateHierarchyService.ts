import {
  IAssignSubsidiaryDTO,
  ICorporateGroupSummary,
  ICorporateHierarchyStats,
  ICorporateNode,
} from '../interfaces/corporate-hierarchy.interface';
import { INITIAL_CORPORATE_COMPANIES } from '../mock/corporate-hierarchy.mock';

const HIERARCHY_STORAGE_KEY = 'nexus_crm_corporate_hierarchy_data_v1';

class CorporateHierarchyService {
  private companies: ICorporateNode[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(HIERARCHY_STORAGE_KEY);
      if (stored) {
        this.companies = JSON.parse(stored) as ICorporateNode[];
      } else {
        this.companies = JSON.parse(JSON.stringify(INITIAL_CORPORATE_COMPANIES)) as ICorporateNode[];
        this.saveToStorage();
      }
    } catch {
      this.companies = JSON.parse(JSON.stringify(INITIAL_CORPORATE_COMPANIES)) as ICorporateNode[];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(HIERARCHY_STORAGE_KEY, JSON.stringify(this.companies));
    } catch (err) {
      console.error('Failed to save corporate hierarchy:', err);
    }
  }

  public getAllCompanies(): ICorporateNode[] {
    return [...this.companies];
  }

  public getCompanyById(id: string): ICorporateNode | undefined {
    return this.companies.find((c) => c.id === id);
  }

  public getSubsidiaries(parentCompanyId: string): ICorporateNode[] {
    return this.companies.filter((c) => c.parentCompanyId === parentCompanyId);
  }

  public getGroupSummary(parentCompanyId: string): ICorporateGroupSummary | undefined {
    const parent = this.companies.find((c) => c.id === parentCompanyId);
    if (!parent) return undefined;

    const subsidiaries = this.getSubsidiaries(parentCompanyId);
    const parentOnlyDealValue = parent.dealValue || 0;
    const subsidiariesTotalDealValue = subsidiaries.reduce(
      (sum, s) => sum + (s.dealValue || 0),
      0
    );
    const totalGroupDealValue = parentOnlyDealValue + subsidiariesTotalDealValue;
    const totalGroupContactsCount =
      (parent.contactCount || 0) +
      subsidiaries.reduce((sum, s) => sum + (s.contactCount || 0), 0);

    return {
      parentCompany: {
        ...parent,
        children: subsidiaries,
      },
      subsidiaries,
      totalGroupDealValue,
      parentOnlyDealValue,
      subsidiariesTotalDealValue,
      totalGroupSubsidiariesCount: subsidiaries.length,
      totalGroupContactsCount,
    };
  }

  public getAllGroups(): ICorporateGroupSummary[] {
    // Parents are companies with corporateRole === 'parent_holding' or having subsidiaries
    const parentIds = Array.from(
      new Set([
        ...this.companies
          .filter((c) => c.corporateRole === 'parent_holding')
          .map((c) => c.id),
        ...this.companies
          .filter((c) => c.parentCompanyId)
          .map((c) => c.parentCompanyId as string),
      ])
    );

    const groups: ICorporateGroupSummary[] = [];
    for (const pId of parentIds) {
      const summary = this.getGroupSummary(pId);
      if (summary) {
        groups.push(summary);
      }
    }

    return groups;
  }

  public getAvailableCandidates(parentCompanyId: string): ICorporateNode[] {
    // Cannot assign self or company already in this group as parent
    return this.companies.filter(
      (c) => c.id !== parentCompanyId && c.parentCompanyId !== parentCompanyId && c.corporateRole !== 'parent_holding'
    );
  }

  public assignSubsidiary(dto: IAssignSubsidiaryDTO): ICorporateGroupSummary {
    if (dto.subsidiaryId === dto.parentCompanyId) {
      throw new Error('Một công ty không thể tự làm công ty con của chính mình.');
    }

    const parent = this.companies.find((c) => c.id === dto.parentCompanyId);
    if (!parent) {
      throw new Error(`Không tìm thấy công ty mẹ có ID ${dto.parentCompanyId}`);
    }

    const subIndex = this.companies.findIndex((c) => c.id === dto.subsidiaryId);
    if (subIndex === -1) {
      throw new Error(`Không tìm thấy công ty con có ID ${dto.subsidiaryId}`);
    }

    // Circular check: if target subsidiary is already the parent of current parent company
    if (parent.parentCompanyId === dto.subsidiaryId) {
      throw new Error('Phát hiện vòng lặp phân cấp! Công ty này đang là công ty mẹ của tập đoàn.');
    }

    const targetSub = this.companies[subIndex];

    // Update target subsidiary
    this.companies[subIndex] = {
      ...targetSub,
      parentCompanyId: parent.id,
      parentCompanyName: parent.companyName,
      corporateRole: dto.corporateRole || 'operating_subsidiary',
      ownershipPercentage: dto.ownershipPercentage || 100,
      notes: dto.notes || targetSub.notes,
    };

    // Ensure parent company has role parent_holding
    const parentIndex = this.companies.findIndex((c) => c.id === parent.id);
    if (parentIndex !== -1 && this.companies[parentIndex].corporateRole !== 'parent_holding') {
      this.companies[parentIndex] = {
        ...this.companies[parentIndex],
        corporateRole: 'parent_holding',
      };
    }

    this.saveToStorage();

    const summary = this.getGroupSummary(parent.id);
    if (!summary) {
      throw new Error('Lỗi khi tính toán tổng giá trị tập đoàn.');
    }
    return summary;
  }

  public removeSubsidiary(subsidiaryId: string): void {
    const index = this.companies.findIndex((c) => c.id === subsidiaryId);
    if (index !== -1) {
      this.companies[index] = {
        ...this.companies[index],
        parentCompanyId: null,
        parentCompanyName: null,
        corporateRole: 'standalone',
        ownershipPercentage: undefined,
      };
      this.saveToStorage();
    }
  }

  public getStats(): ICorporateHierarchyStats {
    const groups = this.getAllGroups();
    const totalSubsidiariesCount = groups.reduce(
      (sum, g) => sum + g.totalGroupSubsidiariesCount,
      0
    );
    const totalGroupPortfolioValue = groups.reduce(
      (sum, g) => sum + g.totalGroupDealValue,
      0
    );
    const avg =
      groups.length > 0 ? Number((totalSubsidiariesCount / groups.length).toFixed(1)) : 0;

    return {
      totalCorporateGroups: groups.length,
      totalSubsidiariesCount,
      totalGroupPortfolioValue,
      averageSubsidiariesPerGroup: avg,
    };
  }

  public resetToMock(): void {
    this.companies = JSON.parse(JSON.stringify(INITIAL_CORPORATE_COMPANIES)) as ICorporateNode[];
    this.saveToStorage();
  }
}

export const corporateHierarchyService = new CorporateHierarchyService();
