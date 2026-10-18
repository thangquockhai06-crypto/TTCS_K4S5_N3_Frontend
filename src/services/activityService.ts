import { axiosInstance } from '../utils/axiosInstance';

export interface IActivityDTO {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  dealId?: string | null;
  dealTitle?: string | null;
  userId: string;
  userName?: string | null;
  type: string;
  title: string;
  description: string;
  notes?: string | null;
  createdAt?: string | null;
}

export interface ICreateActivityPayload {
  customerId?: string;
  dealId?: string;
  type: string;
  title: string;
  description?: string;
  notes?: string;
}

export interface IGetActivitiesParams {
  search?: string;
  type?: string;
  customerId?: string;
  dealId?: string;
  personal?: boolean;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

class ActivityService {
  async getActivities(params?: IGetActivitiesParams): Promise<IActivityDTO[]> {
    const response = await axiosInstance.get<IActivityDTO[]>('/activities', { params });
    return response.data;
  }

  async getPersonalActivities(params?: Omit<IGetActivitiesParams, 'personal'>): Promise<IActivityDTO[]> {
    const response = await axiosInstance.get<IActivityDTO[]>('/activities/personal', { params });
    return response.data;
  }

  async createActivity(payload: ICreateActivityPayload): Promise<IActivityDTO> {
    const response = await axiosInstance.post<IActivityDTO>('/activities', payload);
    return response.data;
  }

  async exportActivities(params?: IGetActivitiesParams): Promise<Blob> {
    const response = await axiosInstance.get('/activities/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const activityService = new ActivityService();
