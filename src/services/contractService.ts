import { axiosInstance, API_BASE_URL } from '../utils/axiosInstance';
import { IContract, ICreateContractDTO, IContractRenewalDTO } from '../interfaces/contract.interface';
import { IDeal } from '../interfaces/deal.interface';

export interface IGetContractsParams {
  search?: string;
  status?: string;
  customerId?: string;
  expiringWithinDays?: number;
  skip?: number;
  limit?: number;
}

class ContractService {
  async getContracts(params?: IGetContractsParams): Promise<IContract[]> {
    try {
      const response = await axiosInstance.get<IContract[]>('/contracts', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return this.getLocalContracts();
    } catch (err: unknown) {
      console.warn('Backend /contracts unavailable, falling back to local contracts cache:', err);
      return this.getLocalContracts();
    }
  }

  async getContract(id: string): Promise<IContract> {
    const response = await axiosInstance.get<IContract>(`/contracts/${id}`);
    return response.data;
  }

  async createContract(payload: ICreateContractDTO): Promise<IContract> {
    const response = await axiosInstance.post<IContract>('/contracts', payload);
    const saved = response.data;
    this.saveLocalContract(saved);
    return saved;
  }

  async renewContract(id: string, payload: IContractRenewalDTO): Promise<IDeal> {
    const response = await axiosInstance.post<IDeal>(`/contracts/${id}/renew`, payload);
    return response.data;
  }

  getPdfUrl(contractId: string): string {
    return `${API_BASE_URL}/contracts/${contractId}/pdf`;
  }

  // Local caching fallback
  private getLocalContracts(): IContract[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('nexus_contracts_master_list');
      if (raw) {
        return JSON.parse(raw);
      }
      const initialContracts: IContract[] = [
        {
          id: 'ctr-2026-001',
          contractNumber: 'HD-2026-NEXUS-01',
          title: 'Hợp đồng Bản quyền Phần mềm NexusCRM Enterprise & Dịch vụ Cloud',
          quotationId: 'quote-demo-01',
          quotationNumber: 'BG-2026-0089',
          dealId: 'deal-01',
          dealTitle: 'Triển khai CRM cho Tập đoàn FPT Software',
          customerId: 'cust-01',
          customerName: 'Nguyễn Văn An',
          customerCompany: 'Tập đoàn FPT Software',
          customerTaxCode: '0101248141',
          ownerId: 'usr-01',
          ownerName: 'Trần Thị Thu Hà',
          totalValue: 245000000,
          totalInWords: 'Hai trăm bốn mươi lăm triệu đồng',
          signingDate: '2025-11-15',
          effectiveDate: '2025-11-20',
          expiryDate: '2026-11-20',
          remainingDays: 30,
          isExpiringSoon: true,
          isExpired: false,
          paymentTerms: 'Thanh toán 100% trong vòng 15 ngày kể từ ngày nghiệm thu.',
          status: 'expiring_soon',
          items: [
            {
              id: 'ci-1',
              productName: 'Gói NexusCRM Enterprise Bản quyền 50 Users',
              quantity: 1,
              unit: 'Gói',
              unitPrice: 180000000,
              discountAmount: 18000000,
              lineTotal: 162000000,
            },
            {
              id: 'ci-2',
              productName: 'Dịch vụ Đào tạo & Chuyển giao công nghệ Onsite (3 ngày)',
              quantity: 3,
              unit: 'Buổi',
              unitPrice: 20000000,
              discountAmount: 0,
              lineTotal: 60000000,
            },
          ],
          createdAt: '2025-11-15T09:00:00Z',
        },
        {
          id: 'ctr-2026-002',
          contractNumber: 'HD-2026-VIETTEL-02',
          title: 'Hợp đồng Nâng cấp Module Quản lý Báo giá & Phê duyệt Phân cấp',
          quotationId: 'quote-demo-02',
          quotationNumber: 'BG-2026-0102',
          dealId: 'deal-02',
          dealTitle: 'Gia hạn gói dịch vụ Viettel Telecom',
          customerId: 'cust-02',
          customerName: 'Lê Hoàng Nam',
          customerCompany: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
          customerTaxCode: '0100109106',
          ownerId: 'usr-admin-01',
          ownerName: 'Quản Trị Viên Hệ Thống',
          totalValue: 480000000,
          totalInWords: 'Bốn trăm tám mươi triệu đồng',
          signingDate: '2026-02-10',
          effectiveDate: '2026-02-15',
          expiryDate: '2027-02-15',
          remainingDays: 117,
          isExpiringSoon: false,
          isExpired: false,
          paymentTerms: 'Chia làm 2 đợt: 50% sau khi ký, 50% sau khi bàn giao.',
          status: 'active',
          items: [
            {
              id: 'ci-3',
              productName: 'Gói Mở rộng Tính năng Tự động hóa IF-THEN & Quote Portal',
              quantity: 1,
              unit: 'Gói',
              unitPrice: 480000000,
              discountAmount: 0,
              lineTotal: 480000000,
            },
          ],
          createdAt: '2026-02-10T14:30:00Z',
        },
      ];
      window.localStorage.setItem('nexus_contracts_master_list', JSON.stringify(initialContracts));
      return initialContracts;
    } catch {
      return [];
    }
  }

  private saveLocalContract(contract: IContract): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getLocalContracts();
      const idx = list.findIndex((c) => c.id === contract.id);
      if (idx >= 0) {
        list[idx] = contract;
      } else {
        list.unshift(contract);
      }
      window.localStorage.setItem('nexus_contracts_master_list', JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

export const contractService = new ContractService();
