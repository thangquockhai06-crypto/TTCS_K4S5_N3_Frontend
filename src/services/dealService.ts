import { axiosInstance } from '../utils/axiosInstance';
import {
  IDeal,
  ISalesForecast,
  ICloseDealPayload,
  IBulkReassignDealsPayload,
  ICreateDealItemPayload,
  IDealItem,
} from '../interfaces';

export interface IGetDealsParams {
  search?: string;
  stage?: string;
  customer_id?: string;
  owner_id?: string;
  min_value?: number;
  max_value?: number;
  close_date_from?: string;
  close_date_to?: string;
  product_id?: string;
  is_stalled?: boolean;
  stalled_only?: boolean;
}

export interface IMoveDealStageUpdates {
  value?: number;
  probability?: number;
}

class DealService {
  async getDeals(params?: IGetDealsParams): Promise<IDeal[]> {
    const response = await axiosInstance.get<IDeal[]>('/deals', { params });
    return response.data;
  }

  async exportDeals(params?: IGetDealsParams & { deal_ids?: string }): Promise<Blob> {
    const response = await axiosInstance.get('/deals/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async getDeal(id: string): Promise<IDeal> {
    const response = await axiosInstance.get<IDeal>(`/deals/${id}`);
    return response.data;
  }

  async createDeal(payload: {
    title: string;
    customerId: string;
    value?: number;
    stage?: string;
    probability?: number;
    expectedCloseDate?: string;
    campaignId?: string;
    items?: ICreateDealItemPayload[];
  }): Promise<IDeal> {
    const response = await axiosInstance.post<IDeal>('/deals', payload);
    return response.data;
  }

  async updateDeal(
    id: string,
    payload: {
      title?: string;
      value?: number;
      stage?: string;
      probability?: number;
      customerId?: string;
      expectedCloseDate?: string;
      campaignId?: string;
    }
  ): Promise<IDeal> {
    const response = await axiosInstance.patch<IDeal>(`/deals/${id}`, payload);
    return response.data;
  }

  async deleteDeal(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/deals/${id}`);
    return response.data;
  }

  async moveDealStage(
    id: string,
    stage: string,
    override: boolean = false,
    updates?: IMoveDealStageUpdates
  ): Promise<IDeal> {
    const response = await axiosInstance.patch<IDeal>(`/deals/${id}/stage`, {
      stage,
      override,
      ...updates,
    });
    return response.data;
  }

  async closeDeal(id: string, payload: ICloseDealPayload): Promise<IDeal> {
    const response = await axiosInstance.post<IDeal>(`/deals/${id}/close`, payload);
    return response.data;
  }

  async bulkReassign(payload: IBulkReassignDealsPayload): Promise<{
    message: string;
    reassignedCount: number;
    deals: IDeal[];
  }> {
    const response = await axiosInstance.post<{
      message: string;
      reassignedCount: number;
      deals: IDeal[];
    }>('/deals/bulk-reassign', payload);
    return response.data;
  }

  async getSalesForecast(): Promise<ISalesForecast> {
    const response = await axiosInstance.get<ISalesForecast>('/deals/forecast');
    return response.data;
  }

  async addDealItem(dealId: string, payload: ICreateDealItemPayload): Promise<IDealItem> {
    const response = await axiosInstance.post<IDealItem>(`/deals/${dealId}/items`, payload);
    return response.data;
  }

  async removeDealItem(dealId: string, itemId: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/deals/${dealId}/items/${itemId}`
    );
    return response.data;
  }

  async scanStalledDeals(): Promise<{ message: string; scannedCount: number; newlyStalled: number }> {
    const response = await axiosInstance.post<{
      message: string;
      scannedCount: number;
      newlyStalled: number;
    }>('/deals/scan-stalled');
    return response.data;
  }
}

export const dealService = new DealService();
