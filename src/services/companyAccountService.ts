import {
  CreateCompanyAccountDTO,
  ICompanyAccount,
  ICompanyStats,
  UpdateCompanyAccountDTO,
} from '../interfaces/company-account.interface';
import { INITIAL_COMPANY_ACCOUNTS } from '../mock/company-accounts.mock';

const STORAGE_KEY = 'nexus_crm_company_accounts_data_v1';

class CompanyAccountService {
  private accounts: ICompanyAccount[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.accounts = JSON.parse(stored) as ICompanyAccount[];
      } else {
        this.accounts = [...INITIAL_COMPANY_ACCOUNTS];
        this.saveToStorage();
      }
    } catch {
      this.accounts = [...INITIAL_COMPANY_ACCOUNTS];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.accounts));
    } catch (err) {
      console.error('Failed to save company accounts to localStorage:', err);
    }
  }

  public getAll(): ICompanyAccount[] {
    return [...this.accounts];
  }

  public getById(id: string): ICompanyAccount | undefined {
    return this.accounts.find((a) => a.id === id);
  }

  public isTaxCodeTaken(taxCode: string, excludeId?: string): boolean {
    const trimmed = taxCode.trim();
    if (!trimmed) return false;
    return this.accounts.some(
      (a) => a.taxCode.trim().toLowerCase() === trimmed.toLowerCase() && a.id !== excludeId
    );
  }

  public create(
    dto: CreateCompanyAccountDTO,
    ownerName: string,
    ownerEmail: string,
    ownerTeam: string
  ): ICompanyAccount {
    const cleanTaxCode = dto.taxCode.trim();

    if (cleanTaxCode && this.isTaxCodeTaken(cleanTaxCode)) {
      throw new Error(`Mã số thuế "${cleanTaxCode}" đã tồn tại trên hệ thống. Mã số thuế phải là duy nhất.`);
    }

    const newId = `comp-${Date.now()}`;
    const now = new Date().toISOString();

    const newAccount: ICompanyAccount = {
      id: newId,
      companyName: dto.companyName.trim(),
      taxCode: cleanTaxCode,
      industry: dto.industry.trim(),
      scale: dto.scale,
      website: dto.website.trim(),
      address: dto.address.trim(),
      status: dto.status,
      ownerId: dto.ownerId,
      ownerName,
      ownerEmail,
      ownerTeam,
      dealValueEstimate: dto.dealValueEstimate || 0,
      primaryContactName: dto.primaryContactName?.trim(),
      primaryContactPhone: dto.primaryContactPhone?.trim(),
      primaryContactEmail: dto.primaryContactEmail?.trim(),
      notes: dto.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.accounts.unshift(newAccount);
    this.saveToStorage();
    return newAccount;
  }

  public update(id: string, dto: UpdateCompanyAccountDTO): ICompanyAccount {
    const index = this.accounts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy hồ sơ khách hàng doanh nghiệp có ID ${id}.`);
    }

    const existing = this.accounts[index];

    if (dto.taxCode && dto.taxCode.trim() !== existing.taxCode) {
      const cleanTaxCode = dto.taxCode.trim();
      if (this.isTaxCodeTaken(cleanTaxCode, id)) {
        throw new Error(`Mã số thuế "${cleanTaxCode}" đã được sử dụng bởi doanh nghiệp khác.`);
      }
    }

    const updated: ICompanyAccount = {
      ...existing,
      ...dto,
      companyName: dto.companyName !== undefined ? dto.companyName.trim() : existing.companyName,
      taxCode: dto.taxCode !== undefined ? dto.taxCode.trim() : existing.taxCode,
      updatedAt: new Date().toISOString(),
    };

    this.accounts[index] = updated;
    this.saveToStorage();
    return updated;
  }

  public delete(id: string): boolean {
    const prevLen = this.accounts.length;
    this.accounts = this.accounts.filter((a) => a.id !== id);
    const deleted = this.accounts.length < prevLen;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public getStats(list?: ICompanyAccount[]): ICompanyStats {
    const targetList = list || this.accounts;
    const totalPipelineValue = targetList.reduce(
      (sum, item) => sum + (item.dealValueEstimate || 0),
      0
    );

    return {
      totalCount: targetList.length,
      leadCount: targetList.filter((a) => a.status === 'lead').length,
      negotiationCount: targetList.filter((a) => a.status === 'negotiation').length,
      customerCount: targetList.filter((a) => a.status === 'customer').length,
      churnedCount: targetList.filter((a) => a.status === 'churned').length,
      totalPipelineValue,
    };
  }

  public exportToCsv(accounts: ICompanyAccount[]): void {
    const headers = [
      'Mã hồ sơ',
      'Tên doanh nghiệp',
      'Mã số thuế',
      'Ngành nghề',
      'Quy mô',
      'Trạng thái',
      'Người phụ trách',
      'Nhóm phụ trách',
      'Doanh số dự kiến (USD)',
      'Người liên hệ chính',
      'SĐT liên hệ',
      'Email liên hệ',
      'Website',
      'Địa chỉ',
      'Ngày tạo',
    ];

    const rows = accounts.map((a) => [
      `"${a.id}"`,
      `"${a.companyName.replace(/"/g, '""')}"`,
      `"${a.taxCode}"`,
      `"${a.industry.replace(/"/g, '""')}"`,
      `"${a.scale}"`,
      `"${a.status}"`,
      `"${a.ownerName}"`,
      `"${a.ownerTeam}"`,
      `"${a.dealValueEstimate}"`,
      `"${(a.primaryContactName || '').replace(/"/g, '""')}"`,
      `"${a.primaryContactPhone || ''}"`,
      `"${a.primaryContactEmail || ''}"`,
      `"${a.website}"`,
      `"${a.address.replace(/"/g, '""')}"`,
      `"${a.createdAt.slice(0, 10)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NexusCRM_DanhSach_KhachHangDoanhNghiep_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public resetToMock(): void {
    this.accounts = [...INITIAL_COMPANY_ACCOUNTS];
    this.saveToStorage();
  }
}

export const companyAccountService = new CompanyAccountService();
