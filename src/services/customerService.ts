import { axiosInstance } from '../utils/axiosInstance';
import {
  ICustomer,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  ICustomerContact,
  ICreateContactDTO,
  ISupportTicket,
  ICreateSupportTicketDTO,
  ISavedFilterPreset,
  ICreateSavedFilterDTO,
  ICorporateHierarchyNode,
  IStagnantCustomer,
  ICustomer360,
  IExcelCustomerPreviewResult,
  IExcelCustomerImportResult,
} from '../interfaces';

class CustomerService {
  // S3-01: CRUD Khách hàng doanh nghiệp
  async getCustomers(params?: {
    search?: string;
    status?: string;
    industry?: string;
    tier?: string;
    owner_id?: string;
    risk_only?: boolean;
    min_value?: number;
    max_value?: number;
    skip?: number;
    limit?: number;
  }): Promise<ICustomer[]> {
    const response = await axiosInstance.get<ICustomer[]>('/customers', { params });
    return response.data;
  }

  async getCustomerById(id: string): Promise<ICustomer> {
    const response = await axiosInstance.get<ICustomer>(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(dto: CreateCustomerDTO): Promise<ICustomer> {
    const response = await axiosInstance.post<ICustomer>('/customers', dto);
    return response.data;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDTO): Promise<ICustomer> {
    const response = await axiosInstance.put<ICustomer>(`/customers/${id}`, dto);
    return response.data;
  }

  async deleteCustomer(id: string): Promise<void> {
    await axiosInstance.delete(`/customers/${id}`);
  }

  // S3-02: Quản lý Người liên hệ
  async getContacts(customerId: string): Promise<ICustomerContact[]> {
    const response = await axiosInstance.get<ICustomerContact[]>(`/customers/${customerId}/contacts`);
    return response.data;
  }

  async createContact(customerId: string, dto: ICreateContactDTO): Promise<ICustomerContact> {
    const response = await axiosInstance.post<ICustomerContact>(`/customers/${customerId}/contacts`, dto);
    return response.data;
  }

  async updateContact(contactId: string, dto: Partial<ICreateContactDTO>): Promise<ICustomerContact> {
    const response = await axiosInstance.put<ICustomerContact>(`/contacts/${contactId}`, dto);
    return response.data;
  }

  async deleteContact(contactId: string): Promise<void> {
    await axiosInstance.delete(`/contacts/${contactId}`);
  }

  async transferContact(contactId: string, newCustomerId: string, reason?: string): Promise<ICustomerContact> {
    const response = await axiosInstance.post<ICustomerContact>(`/contacts/${contactId}/transfer`, {
      newCustomerId,
      reason,
    });
    return response.data;
  }

  // S3-03: Khách hàng 360 View
  async getCustomer360(customerId: string): Promise<ICustomer360> {
    const response = await axiosInstance.get<ICustomer360>(`/customers/${customerId}/360`);
    return response.data;
  }

  // S3-04: Gộp khách hàng trùng lặp
  async getPotentialDuplicates(): Promise<Array<{ reason: string; customerA: ICustomer; customerB: ICustomer }>> {
    const response = await axiosInstance.get('/customers/duplicates');
    return response.data;
  }

  async mergeCustomers(
    masterId: string,
    duplicateId: string,
    fieldOverrides?: Record<string, any>
  ): Promise<ICustomer> {
    const response = await axiosInstance.post<ICustomer>('/customers/merge', {
      masterId,
      duplicateId,
      fieldOverrides,
    });
    return response.data;
  }

  // S3-05: Công ty Mẹ - Con
  async getCorporateHierarchy(customerId: string): Promise<ICorporateHierarchyNode> {
    const response = await axiosInstance.get<ICorporateHierarchyNode>(`/customers/${customerId}/hierarchy`);
    return response.data;
  }

  async setParentCustomer(customerId: string, parentId?: string): Promise<ICustomer> {
    const response = await axiosInstance.put<ICustomer>(
      `/customers/${customerId}/parent`,
      {},
      { params: { parent_id: parentId || '' } }
    );
    return response.data;
  }

  // S3-06: Nhập khách hàng từ Excel
  async previewExcelImport(file: File): Promise<IExcelCustomerPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<IExcelCustomerPreviewResult>(
      '/customers/import-preview',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  async executeExcelImport(file: File): Promise<IExcelCustomerImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<IExcelCustomerImportResult>(
      '/customers/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  // S3-07: Bộ lọc nâng cao & Lưu cấu hình bộ lọc
  async getSavedFilters(): Promise<ISavedFilterPreset[]> {
    const response = await axiosInstance.get<ISavedFilterPreset[]>('/customer-filters');
    return response.data;
  }

  async createSavedFilter(dto: ICreateSavedFilterDTO): Promise<ISavedFilterPreset> {
    const response = await axiosInstance.post<ISavedFilterPreset>('/customer-filters', dto);
    return response.data;
  }

  async deleteSavedFilter(presetId: string): Promise<void> {
    await axiosInstance.delete(`/customer-filters/${presetId}`);
  }

  // S3-08: Yêu cầu hỗ trợ & Cờ rủi ro
  async getSupportTickets(customerId: string): Promise<ISupportTicket[]> {
    const response = await axiosInstance.get<ISupportTicket[]>(`/customers/${customerId}/tickets`);
    return response.data;
  }

  async createSupportTicket(customerId: string, dto: ICreateSupportTicketDTO): Promise<ISupportTicket> {
    const response = await axiosInstance.post<ISupportTicket>(`/customers/${customerId}/tickets`, dto);
    return response.data;
  }

  async updateSupportTicket(ticketId: string, dto: Partial<ICreateSupportTicketDTO>): Promise<ISupportTicket> {
    const response = await axiosInstance.put<ISupportTicket>(`/tickets/${ticketId}`, dto);
    return response.data;
  }

  async deleteSupportTicket(ticketId: string): Promise<void> {
    await axiosInstance.delete(`/tickets/${ticketId}`);
  }

  async getCustomerRisk(customerId: string): Promise<{ customerId: string; riskFlag: boolean; riskReason?: string }> {
    const response = await axiosInstance.get(`/customers/${customerId}/risk`);
    return response.data;
  }

  async scanRisks(threshold: number = 2): Promise<any> {
    const response = await axiosInstance.post('/customers/scan-risks', {}, { params: { threshold } });
    return response.data;
  }

  // S3-09: Khách hàng cần chăm sóc định kỳ
  async getStagnantCustomers(days: number = 30): Promise<IStagnantCustomer[]> {
    const response = await axiosInstance.get<IStagnantCustomer[]>('/customers/stagnant', {
      params: { days },
    });
    return response.data;
  }

  async quickTouchCustomer(customerId: string): Promise<ICustomer> {
    const response = await axiosInstance.post<ICustomer>(`/customers/${customerId}/quick-touch`);
    return response.data;
  }
}

export const customerService = new CustomerService();
