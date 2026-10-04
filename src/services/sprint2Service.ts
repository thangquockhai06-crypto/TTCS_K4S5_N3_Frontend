import { axiosInstance } from '../utils/axiosInstance';
import {
  IExcelImportUserRow,
  IExcelImportResult,
  IUserProfileUpdate,
  IAuditLogResponse,
  IProduct,
  IProductFormData,
  IPriceList,
  IOrgNode,
  ICategory,
  ICustomField,
  IPipelineStage,
  IWinLossReason,
  ICompetitor,
} from '../interfaces';
import {
  getStoredProducts,
  getStoredPriceLists,
  mockCreateProduct,
  mockUpdateProduct,
  mockDeleteProduct,
  mockToggleProductActive,
  mockCreatePriceList,
  mockUpdatePriceList,
  mockDeletePriceList,
} from '../mock/products.mock';
import {
  getStoredCustomFields,
  mockCreateCustomField,
  mockUpdateCustomField,
  mockDeleteCustomField,
} from '../mock/customFields.mock';

class Sprint2Service {
  // S2-01: Excel User Import
  async importExcelUsers(rows: IExcelImportUserRow[]): Promise<IExcelImportResult> {
    const response = await axiosInstance.post<IExcelImportResult>('/users/import-excel', { rows });
    return response.data;
  }

  // S2-02 & S2-03: User Profile & Avatar
  async updateProfile(data: IUserProfileUpdate): Promise<unknown> {
    const response = await axiosInstance.put('/users/me/profile', data);
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

  // S2-05: Products & Price Lists (SCRUM-84)
  async getProducts(params?: {
    search?: string;
    category?: string;
    product_type?: string;
    isActive?: boolean;
  }): Promise<IProduct[]> {
    try {
      const response = await axiosInstance.get<IProduct[]>('/products', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Backend offline or endpoint not ready: fallback to local mock
    }

    let list = getStoredProducts();
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params?.category && params.category !== 'all') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params?.product_type && params.product_type !== 'all') {
      list = list.filter((p) => p.product_type === params.product_type);
    }
    if (params?.isActive !== undefined) {
      list = list.filter((p) => p.is_active === params.isActive);
    }
    return list;
  }

  async createProduct(product: IProductFormData): Promise<IProduct> {
    try {
      const response = await axiosInstance.post<IProduct>('/products', product);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return mockCreateProduct(product);
  }

  async updateProduct(id: string, product: Partial<IProduct>): Promise<IProduct> {
    try {
      const response = await axiosInstance.put<IProduct>(`/products/${id}`, product);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return mockUpdateProduct(id, product);
  }

  async toggleProductActive(id: string): Promise<IProduct> {
    try {
      const response = await axiosInstance.patch<IProduct>(`/products/${id}/toggle-active`);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return mockToggleProductActive(id);
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`/products/${id}`);
      if (response.data) return response.data;
    } catch {
      // Fallback: execute mock constraint check & delete
    }
    return mockDeleteProduct(id);
  }

  async getPriceLists(): Promise<IPriceList[]> {
    try {
      const response = await axiosInstance.get<IPriceList[]>('/products/price-lists');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Fallback
    }
    return getStoredPriceLists();
  }

  async createPriceList(priceList: Partial<IPriceList>): Promise<IPriceList> {
    try {
      const response = await axiosInstance.post<IPriceList>('/products/price-lists', priceList);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return mockCreatePriceList(priceList);
  }

  async updatePriceList(id: string, updates: Partial<IPriceList>): Promise<IPriceList> {
    try {
      const response = await axiosInstance.put<IPriceList>(`/products/price-lists/${id}`, updates);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return mockUpdatePriceList(id, updates);
  }

  async deletePriceList(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`/products/price-lists/${id}`);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return mockDeletePriceList(id);
  }

  // S2-06: Organization Tree
  async getOrgTree(): Promise<IOrgNode[]> {
    const response = await axiosInstance.get<IOrgNode[]>('/org-tree');
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
    try {
      const response = await axiosInstance.get<ICustomField[]>('/custom-fields', {
        params: { entity_type: entityType },
      });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback sang LocalStorage mock
    }
    return getStoredCustomFields(entityType);
  }

  async createCustomField(field: Partial<ICustomField>): Promise<ICustomField> {
    try {
      const response = await axiosInstance.post<ICustomField>('/custom-fields', field);
      if (response.data) return response.data;
    } catch {
      // Fallback sang LocalStorage mock
    }
    return mockCreateCustomField(field);
  }

  async updateCustomField(id: string, field: Partial<ICustomField>): Promise<ICustomField> {
    try {
      const response = await axiosInstance.put<ICustomField>(`/custom-fields/${id}`, field);
      if (response.data) return response.data;
    } catch {
      // Fallback sang LocalStorage mock
    }
    return mockUpdateCustomField(id, field);
  }

  async deleteCustomField(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`/custom-fields/${id}`);
      if (response.data) return response.data;
    } catch {
      // Fallback sang LocalStorage mock
    }
    return mockDeleteCustomField(id);
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
