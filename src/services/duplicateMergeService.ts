import {
  IDuplicatePair,
  IDuplicateStats,
  IMergeCustomerDTO,
  IMergeHistoryRecord,
} from '../interfaces/duplicate-merge.interface';

const DUPLICATES_STORAGE_KEY = 'nexus_crm_duplicates_pairs_v1';
const MERGE_HISTORY_STORAGE_KEY = 'nexus_crm_merge_history_v1';

// Initial realistic duplicate pairs for immediate demonstration
const INITIAL_DUPLICATE_PAIRS: IDuplicatePair[] = [
  {
    id: 'dup-001',
    matchType: 'tax_code_exact',
    matchConfidence: 100,
    matchReason: 'Trùng khớp 100% Mã số thuế (0101234567) giữa 2 nhân viên phụ trách khác nhau.',
    detectedAt: '2026-03-15T09:30:00Z',
    status: 'pending',
    primaryRecord: {
      id: 'comp-001',
      companyName: 'Tập đoàn Công nghệ Viễn thông V-Tech',
      taxCode: '0101234567',
      website: 'https://vtech-group.vn',
      industry: 'Viễn thông & CNTT',
      address: 'Tầng 18, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội',
      scale: 'enterprise',
      status: 'customer',
      dealValue: 350000,
      ownerId: 'usr-002',
      ownerName: 'Trần Văn Hưng',
      ownerEmail: 'hung.tran@nexuscrm.vn',
      ownerTeam: 'Miền Bắc (Hà Nội)',
      contactCount: 4,
      dealCount: 2,
      activityCount: 15,
      createdAt: '2025-08-15T08:30:00Z',
    },
    duplicateRecord: {
      id: 'comp-001-dup',
      companyName: 'V-Tech Telecom Group Vietnam',
      taxCode: '0101234567',
      website: 'http://vtech.com.vn',
      industry: 'Công nghệ Thông tin',
      address: 'Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
      scale: 'enterprise',
      status: 'negotiation',
      dealValue: 180000,
      ownerId: 'usr-004',
      ownerName: 'Lê Quốc Khánh',
      ownerEmail: 'khanh.le@nexuscrm.vn',
      ownerTeam: 'Miền Trung (Đà Nẵng)',
      contactCount: 2,
      dealCount: 1,
      activityCount: 6,
      createdAt: '2026-02-10T14:20:00Z',
    },
  },
  {
    id: 'dup-002',
    matchType: 'website_match',
    matchConfidence: 95,
    matchReason: 'Trùng tên miền Website chính (linear.app) giữa 2 hồ sơ khách hàng.',
    detectedAt: '2026-03-16T08:15:00Z',
    status: 'pending',
    primaryRecord: {
      id: 'comp-009',
      companyName: 'Linear Systems Vietnam Ltd.',
      taxCode: '0108899001',
      website: 'https://linear.app',
      industry: 'Phần mềm & Xuất khẩu phần mềm',
      address: 'Tầng 25, Tòa nhà Lotte Center, Ba Đình, Hà Nội',
      scale: 'enterprise',
      status: 'customer',
      dealValue: 420000,
      ownerId: 'usr-005',
      ownerName: 'Hoàng Minh Tuấn',
      ownerEmail: 'tuan.hoang@nexuscrm.vn',
      ownerTeam: 'Doanh nghiệp FDI & Toàn cầu',
      contactCount: 5,
      dealCount: 3,
      activityCount: 22,
      createdAt: '2025-07-10T09:00:00Z',
    },
    duplicateRecord: {
      id: 'comp-009-dup',
      companyName: 'Công ty Linear App Technologies',
      taxCode: '',
      website: 'linear.app',
      industry: 'Phần mềm SaaS',
      address: '54 Liễu Giai, Hà Nội',
      scale: 'enterprise',
      status: 'lead',
      dealValue: 90000,
      ownerId: 'usr-002',
      ownerName: 'Trần Văn Hưng',
      ownerEmail: 'hung.tran@nexuscrm.vn',
      ownerTeam: 'Miền Bắc (Hà Nội)',
      contactCount: 1,
      dealCount: 1,
      activityCount: 3,
      createdAt: '2026-03-02T10:30:00Z',
    },
  },
  {
    id: 'dup-003',
    matchType: 'name_similarity',
    matchConfidence: 85,
    matchReason: 'Độ tương đồng tên công ty đạt 88% ("Dược phẩm Đông Á" vs "CTCP Dược Đông Á").',
    detectedAt: '2026-03-14T11:00:00Z',
    status: 'pending',
    primaryRecord: {
      id: 'comp-003',
      companyName: 'Công ty TNHH Dược phẩm Đông Á',
      taxCode: '0109876543',
      website: 'https://dongapharma.vn',
      industry: 'Y tế & Dược phẩm',
      address: 'Lô CN-08, KCN Thạch Thất, Quốc Oai, Hà Nội',
      scale: 'sme',
      status: 'lead',
      dealValue: 45000,
      ownerId: 'usr-002',
      ownerName: 'Trần Văn Hưng',
      ownerEmail: 'hung.tran@nexuscrm.vn',
      ownerTeam: 'Miền Bắc (Hà Nội)',
      contactCount: 2,
      dealCount: 1,
      activityCount: 5,
      createdAt: '2026-02-20T11:00:00Z',
    },
    duplicateRecord: {
      id: 'comp-003-dup',
      companyName: 'Công ty Cổ phần Dược phẩm Đông Á Group',
      taxCode: '0109876543-999',
      website: 'https://dongapharma.com',
      industry: 'Dược phẩm & Mỹ phẩm',
      address: 'KCN Thạch Thất, Hà Nội',
      scale: 'sme',
      status: 'negotiation',
      dealValue: 60000,
      ownerId: 'usr-003',
      ownerName: 'Nguyễn Thị Mai',
      ownerEmail: 'mai.nguyen@nexuscrm.vn',
      ownerTeam: 'Miền Nam (TP. Hồ Chí Minh)',
      contactCount: 1,
      dealCount: 1,
      activityCount: 4,
      createdAt: '2026-02-28T16:00:00Z',
    },
  },
];

class DuplicateMergeService {
  private pairs: IDuplicatePair[] = [];
  private mergeHistory: IMergeHistoryRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedPairs = localStorage.getItem(DUPLICATES_STORAGE_KEY);
      if (storedPairs) {
        this.pairs = JSON.parse(storedPairs) as IDuplicatePair[];
      } else {
        this.pairs = [...INITIAL_DUPLICATE_PAIRS];
        this.savePairs();
      }

      const storedHistory = localStorage.getItem(MERGE_HISTORY_STORAGE_KEY);
      if (storedHistory) {
        this.mergeHistory = JSON.parse(storedHistory) as IMergeHistoryRecord[];
      } else {
        this.mergeHistory = [];
      }
    } catch {
      this.pairs = [...INITIAL_DUPLICATE_PAIRS];
      this.mergeHistory = [];
    }
  }

  private savePairs(): void {
    try {
      localStorage.setItem(DUPLICATES_STORAGE_KEY, JSON.stringify(this.pairs));
    } catch (e) {
      console.error('Failed to save duplicate pairs:', e);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(MERGE_HISTORY_STORAGE_KEY, JSON.stringify(this.mergeHistory));
    } catch (e) {
      console.error('Failed to save merge history:', e);
    }
  }

  public getPendingPairs(): IDuplicatePair[] {
    return this.pairs.filter((p) => p.status === 'pending');
  }

  public getAllPairs(): IDuplicatePair[] {
    return [...this.pairs];
  }

  public getPairById(pairId: string): IDuplicatePair | undefined {
    return this.pairs.find((p) => p.id === pairId);
  }

  public getMergeHistory(): IMergeHistoryRecord[] {
    return [...this.mergeHistory];
  }

  public dismissPair(pairId: string): void {
    this.pairs = this.pairs.map((p) =>
      p.id === pairId ? { ...p, status: 'dismissed' } : p
    );
    this.savePairs();
  }

  public executeMerge(dto: IMergeCustomerDTO): IMergeHistoryRecord {
    const pair = this.pairs.find((p) => p.id === dto.pairId);
    if (!pair) {
      throw new Error(`Không tìm thấy cặp khách hàng trùng lặp có ID ${dto.pairId}`);
    }

    const totalPreservedContacts =
      (pair.primaryRecord.contactCount || 0) + (pair.duplicateRecord.contactCount || 0);
    const totalPreservedDeals =
      (pair.primaryRecord.dealCount || 0) + (pair.duplicateRecord.dealCount || 0);
    const totalPreservedActivities =
      (pair.primaryRecord.activityCount || 0) + (pair.duplicateRecord.activityCount || 0);

    const historyRecord: IMergeHistoryRecord = {
      id: `mrg-${Date.now()}`,
      pairId: pair.id,
      mergedAt: new Date().toISOString(),
      primaryId: pair.primaryRecord.id,
      primaryName: pair.primaryRecord.companyName,
      duplicateId: pair.duplicateRecord.id,
      duplicateName: pair.duplicateRecord.companyName,
      mergedBy: dto.mergedBy,
      mergedByRole: dto.mergedByRole,
      preservedContactsCount: totalPreservedContacts,
      preservedDealsCount: totalPreservedDeals,
      preservedActivitiesCount: totalPreservedActivities,
      summary: `Đã hợp nhất thành công bản ghi "${pair.duplicateRecord.companyName}" (phụ trách bởi ${pair.duplicateRecord.ownerName}) vào "${pair.primaryRecord.companyName}" (phụ trách bởi ${pair.primaryRecord.ownerName}). Đã giữ nguyên toàn bộ ${totalPreservedContacts} người liên hệ, ${totalPreservedDeals} cơ hội và ${totalPreservedActivities} lịch sử hoạt động.`,
      fieldSelections: dto.fieldSelections,
    };

    // Update pair status to merged
    this.pairs = this.pairs.map((p) =>
      p.id === dto.pairId ? { ...p, status: 'merged' } : p
    );
    this.savePairs();

    this.mergeHistory.unshift(historyRecord);
    this.saveHistory();

    return historyRecord;
  }

  public getStats(): IDuplicateStats {
    const pending = this.pairs.filter((p) => p.status === 'pending');
    return {
      totalPendingPairs: pending.length,
      highConfidenceCount: pending.filter((p) => p.matchConfidence >= 90).length,
      mergedCount: this.pairs.filter((p) => p.status === 'merged').length,
      dismissedCount: this.pairs.filter((p) => p.status === 'dismissed').length,
      conflictingOwnersCount: pending.filter(
        (p) => p.primaryRecord.ownerId !== p.duplicateRecord.ownerId
      ).length,
    };
  }

  public resetToMock(): void {
    this.pairs = [...INITIAL_DUPLICATE_PAIRS];
    this.mergeHistory = [];
    this.savePairs();
    this.saveHistory();
  }
}

export const duplicateMergeService = new DuplicateMergeService();
