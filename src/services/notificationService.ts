import { axiosInstance } from '../utils/axiosInstance';
import { INotificationItem } from '../interfaces/dashboard.interface';

interface INotificationResponse {
  items: INotificationItem[];
  unreadCount: number;
  total: number;
}

class NotificationService {
  async getNotifications(unreadOnly: boolean = false): Promise<INotificationResponse> {
    try {
      const response = await axiosInstance.get<INotificationResponse>('/notifications', {
        params: { unreadOnly },
      });
      return response.data;
    } catch (err: unknown) {
      console.warn('Backend notifications endpoint unavailable:', err);
      return {
        items: [],
        unreadCount: 0,
        total: 0,
      };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await axiosInstance.get<{ unreadCount: number }>('/notifications/unread-count');
      return response.data.unreadCount;
    } catch {
      return 0;
    }
  }

  async markAsRead(id: string): Promise<INotificationItem> {
    const response = await axiosInstance.post<INotificationItem>(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllRead(): Promise<{ success: boolean; markedCount: number }> {
    const response = await axiosInstance.post<{ success: boolean; markedCount: number }>(
      '/notifications/mark-all-read'
    );
    return response.data;
  }
}

export const notificationService = new NotificationService();
