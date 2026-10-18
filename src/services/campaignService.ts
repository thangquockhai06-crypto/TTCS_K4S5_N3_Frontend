import { axiosInstance } from '../utils/axiosInstance';
import { ICampaign, ICampaignCreatePayload } from '../interfaces';

export function normalizeCampaign(c: any): ICampaign {
  if (!c) return {} as ICampaign;
  return {
    id: c.id,
    name: c.name || '',
    code: c.code || '',
    type: c.type || 'Web Form',
    status: c.status || 'Active',
    budget: Number(c.budget || 0),
    expected_revenue: Number(c.expected_revenue ?? c.expectedRevenue ?? 0),
    start_date: c.start_date || c.startDate || null,
    end_date: c.end_date || c.endDate || null,
    description: c.description || null,
    leads_count: Number(c.leads_count ?? c.total_leads ?? c.totalLeads ?? 0),
    deals_count: Number(c.deals_count ?? c.total_deals ?? c.totalDeals ?? 0),
    actual_revenue: Number(c.actual_revenue ?? c.actualRevenue ?? 0),
    created_at: c.created_at || c.createdAt || new Date().toISOString(),
    updated_at: c.updated_at || c.updatedAt || new Date().toISOString(),
  };
}

class CampaignService {
  async getCampaigns(params?: { search?: string; status?: string }): Promise<ICampaign[]> {
    const response = await axiosInstance.get<any[]>('/campaigns', { params });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizeCampaign);
  }

  async getCampaign(id: string): Promise<ICampaign> {
    const response = await axiosInstance.get<any>(`/campaigns/${id}`);
    return normalizeCampaign(response.data);
  }

  async createCampaign(payload: ICampaignCreatePayload): Promise<ICampaign> {
    const body = {
      ...payload,
      expectedRevenue: payload.expected_revenue ?? (payload as any).expectedRevenue ?? 0,
      startDate: payload.start_date ?? (payload as any).startDate,
      endDate: payload.end_date ?? (payload as any).endDate,
    };
    const response = await axiosInstance.post<any>('/campaigns', body);
    return normalizeCampaign(response.data);
  }

  async updateCampaign(id: string, payload: Partial<ICampaignCreatePayload>): Promise<ICampaign> {
    const body = {
      ...payload,
      expectedRevenue: payload.expected_revenue ?? (payload as any).expectedRevenue,
      startDate: payload.start_date ?? (payload as any).startDate,
      endDate: payload.end_date ?? (payload as any).endDate,
    };
    const response = await axiosInstance.put<any>(`/campaigns/${id}`, body);
    return normalizeCampaign(response.data);
  }

  async deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/campaigns/${id}`);
    return response.data;
  }
}

export const campaignService = new CampaignService();
