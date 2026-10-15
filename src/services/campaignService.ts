import { axiosInstance } from '../utils/axiosInstance';
import { ICampaign, ICampaignCreatePayload } from '../interfaces';

class CampaignService {
  async getCampaigns(params?: { search?: string; status?: string }): Promise<ICampaign[]> {
    const response = await axiosInstance.get<ICampaign[]>('/campaigns', { params });
    return response.data;
  }

  async getCampaign(id: string): Promise<ICampaign> {
    const response = await axiosInstance.get<ICampaign>(`/campaigns/${id}`);
    return response.data;
  }

  async createCampaign(payload: ICampaignCreatePayload): Promise<ICampaign> {
    const response = await axiosInstance.post<ICampaign>('/campaigns', payload);
    return response.data;
  }

  async updateCampaign(id: string, payload: Partial<ICampaignCreatePayload>): Promise<ICampaign> {
    const response = await axiosInstance.put<ICampaign>(`/campaigns/${id}`, payload);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/campaigns/${id}`);
    return response.data;
  }
}

export const campaignService = new CampaignService();
