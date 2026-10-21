import { axiosInstance } from '../utils/axiosInstance';
import {
  INotificationItem,
  INotificationListResponse,
} from '../interfaces/documents.interface';

class NotificationService {
  async getNotifications(): Promise<INotificationListResponse> {
    const response = await axiosInstance.get<INotificationListResponse>('/notifications', {
      params: { limit: 50 },
    });
    return response.data;
  }

  async markNotificationRead(id: string): Promise<INotificationItem> {
    const response = await axiosInstance.post<INotificationItem>(
      `/notifications/${encodeURIComponent(id)}/read`
    );
    return response.data;
  }

  async markAllNotificationsRead(): Promise<void> {
    await axiosInstance.post('/notifications/mark-all-read');
  }
}

export const notificationService = new NotificationService();
