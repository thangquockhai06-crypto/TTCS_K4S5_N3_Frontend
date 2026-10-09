import { axiosInstance } from '../utils/axiosInstance';
import {
  IExcelImportUserRow,
  IExcelImportResult,
  IUserProfileUpdate,
  IAuditLogResponse,
  IProduct,
  IPriceList,
  IOrgNode,
  ICategory,
  ICustomField,
  IPipelineStage,
  IWinLossReason,
  ICompetitor,
} from '../interfaces';

class Sprint2Service {
  // S2-01: Excel User Import
  async importExcelUsers(rows: IExcelImportUserRow[]): Promise<IExcelImportResult> {
    const response = await axiosInstance.post<IExcelImportResult>('/users/import-excel', { rows });
    return response.data;
  }

  // S2-02 & S2-03: User Profile & Avatar
  async updateProfile(data: IUserProfileUpdate): Promise<any> {
    const response = await axiosInstance.put('/users/me/profile', data);
    return response.data;
  }

  async uploadAvatar(file: File): Promise<{ avatar_url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<{ avatar_url: string; message: string }>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    );
    return response.data;
  }

  // S2-04: Audit Logs
  async getAuditLogs(params?: {
    performed_by?: string;
    target_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<IAuditLogResponse> {
    const response = await axiosInstance.get<IAuditLogResponse>('/audit-logs', { params });
    return response.data;
  }

  // S2-05: Products & Price Lists
  async getProducts(params?: { search?: string; category?: string; isActive?: boolean }): Promise<IProduct[]> {
    const response = await axiosInstance.get<IProduct[]>('/products', { params });
    return response.data;
  }

  async createProduct(product: Partial<IProduct>): Promise<IProduct> {
    const response = await axiosInstance.post<IProduct>('/products', product);
    return response.data;
  }

  async updateProduct(id: string, product: Partial<IProduct>): Promise<IProduct> {
    const response = await axiosInstance.put<IProduct>(`/products/${id}`, product);
    return response.data;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/products/${id}`);
    return response.data;
  }

  async getPriceLists(): Promise<IPriceList[]> {
    const response = await axiosInstance.get<IPriceList[]>('/products/price-lists');
    return response.data;
  }

  async createPriceList(priceList: Partial<IPriceList>): Promise<IPriceList> {
    const response = await axiosInstance.post<IPriceList>('/products/price-lists', priceList);
    return response.data;
  }

  // S2-06: Organization Tree
  async getOrgTree(): Promise<IOrgNode[]> {
    const response = await axiosInstance.get<IOrgNode[]>('/org-tree');
    return response.data;
  }

  async createOrgNode(data: {
    name: string;
    parent_id?: string | null;
    region?: string;
    leader_name?: string;
    description?: string;
  }): Promise<IOrgNode> {
    const response = await axiosInstance.post<IOrgNode>('/org-tree', data);
    return response.data;
  }

  async updateOrgNode(id: string, data: { leader_id?: string; leader_name?: string; region?: string }): Promise<IOrgNode> {
    const response = await axiosInstance.put<IOrgNode>(`/org-tree/${id}`, data);
    return response.data;
  }

  // S2-07: Categories (Lead Source & Industry)
  async getCategories(type?: 'lead_source' | 'industry'): Promise<ICategory[]> {
    const response = await axiosInstance.get<ICategory[]>('/categories', { params: { type } });
    return response.data;
  }

  async createCategory(category: Partial<ICategory>): Promise<ICategory> {
    const response = await axiosInstance.post<ICategory>('/categories', category);
    return response.data;
  }

  async updateCategory(id: string, category: Partial<ICategory>): Promise<ICategory> {
    const response = await axiosInstance.put<ICategory>(`/categories/${id}`, category);
    return response.data;
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/categories/${id}`);
    return response.data;
  }

  async reorderCategories(orderedIds: string[]): Promise<{ message: string }> {
    const response = await axiosInstance.post<{ message: string }>('/categories/reorder', {
      ordered_ids: orderedIds,
    });
    return response.data;
  }

  // S2-08: Custom Fields
  async getCustomFields(entityType?: 'customer' | 'deal'): Promise<ICustomField[]> {
    const response = await axiosInstance.get<ICustomField[]>('/custom-fields', {
      params: { entity_type: entityType },
    });
    return response.data;
  }

  async createCustomField(field: Partial<ICustomField>): Promise<ICustomField> {
    const response = await axiosInstance.post<ICustomField>('/custom-fields', field);
    return response.data;
  }

  async updateCustomField(id: string, field: Partial<ICustomField>): Promise<ICustomField> {
    const response = await axiosInstance.put<ICustomField>(`/custom-fields/${id}`, field);
    return response.data;
  }

  async deleteCustomField(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/custom-fields/${id}`);
    return response.data;
  }

  async getCustomFieldValues(entityType: 'customer' | 'deal', entityId = 'sample'): Promise<{ values: Record<string, string> }> {
    const response = await axiosInstance.get<{ values: Record<string, string> }>('/custom-fields/values', {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return response.data;
  }

  async saveCustomFieldValues(payload: {
    entity_type: 'customer' | 'deal';
    entity_id?: string;
    values: Record<string, string>;
  }): Promise<{ message: string; values: Record<string, string> }> {
    const response = await axiosInstance.post<{ message: string; values: Record<string, string> }>(
      '/custom-fields/values',
      payload
    );
    return response.data;
  }

  // S2-09: Pipeline Configuration
  async getPipelineStages(): Promise<IPipelineStage[]> {
    const response = await axiosInstance.get<IPipelineStage[]>('/pipelines/stages');
    return response.data;
  }

  async createPipelineStage(stage: Partial<IPipelineStage>): Promise<IPipelineStage> {
    const response = await axiosInstance.post<IPipelineStage>('/pipelines/stages', stage);
    return response.data;
  }

  async updatePipelineStage(id: string, stage: Partial<IPipelineStage>): Promise<IPipelineStage> {
    const response = await axiosInstance.put<IPipelineStage>(`/pipelines/stages/${id}`, stage);
    return response.data;
  }

  async deletePipelineStage(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/pipelines/stages/${id}`);
    return response.data;
  }

  async reorderPipelineStages(orderedIds: string[]): Promise<{ message: string }> {
    const response = await axiosInstance.post<{ message: string }>('/pipelines/reorder', {
      ordered_stage_ids: orderedIds,
    });
    return response.data;
  }

  // S2-10: Win/Loss Reasons & Competitors
  async getWinLossReasons(resultType?: 'WON' | 'LOST'): Promise<IWinLossReason[]> {
    const response = await axiosInstance.get<IWinLossReason[]>('/win-loss-config/reasons', {
      params: { resultType },
    });
    return response.data;
  }

  async createWinLossReason(reason: Partial<IWinLossReason>): Promise<IWinLossReason> {
    const response = await axiosInstance.post<IWinLossReason>('/win-loss-config/reasons', reason);
    return response.data;
  }

  async updateWinLossReason(id: string, reason: Partial<IWinLossReason>): Promise<IWinLossReason> {
    const response = await axiosInstance.put<IWinLossReason>(`/win-loss-config/reasons/${id}`, reason);
    return response.data;
  }

  async deleteWinLossReason(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/win-loss-config/reasons/${id}`);
    return response.data;
  }

  async getCompetitors(): Promise<ICompetitor[]> {
    const response = await axiosInstance.get<ICompetitor[]>('/win-loss-config/competitors');
    return response.data;
  }

  async createCompetitor(competitor: Partial<ICompetitor>): Promise<ICompetitor> {
    const response = await axiosInstance.post<ICompetitor>('/win-loss-config/competitors', competitor);
    return response.data;
  }

  async updateCompetitor(id: string, competitor: Partial<ICompetitor>): Promise<ICompetitor> {
    const response = await axiosInstance.put<ICompetitor>(`/win-loss-config/competitors/${id}`, competitor);
    return response.data;
  }

  async deleteCompetitor(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/win-loss-config/competitors/${id}`);
    return response.data;
  }
}

export const sprint2Service = new Sprint2Service();
