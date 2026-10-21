import { axiosInstance } from '../utils/axiosInstance';
import {
  IContract,
  INotificationItem,
  INotificationListResponse,
  IPdfTemplate,
  IPdfTemplatePayload,
  IQuotation,
  ITask,
} from '../interfaces/documents.interface';

class DocumentService {
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

  async getPdfTemplates(templateType?: IPdfTemplate['templateType']): Promise<IPdfTemplate[]> {
    const response = await axiosInstance.get<IPdfTemplate[]>('/pdf-templates', {
      params: templateType ? { templateType } : undefined,
    });
    return response.data;
  }

  async createPdfTemplate(payload: IPdfTemplatePayload): Promise<IPdfTemplate> {
    const response = await axiosInstance.post<IPdfTemplate>('/pdf-templates', payload);
    return response.data;
  }

  async updatePdfTemplate(
    id: string,
    payload: Partial<IPdfTemplatePayload>
  ): Promise<IPdfTemplate> {
    const response = await axiosInstance.put<IPdfTemplate>(
      `/pdf-templates/${encodeURIComponent(id)}`,
      payload
    );
    return response.data;
  }

  async getQuotations(): Promise<IQuotation[]> {
    const response = await axiosInstance.get<IQuotation[]>('/quotations', {
      params: { limit: 200 },
    });
    return response.data;
  }

  async getContracts(): Promise<IContract[]> {
    const response = await axiosInstance.get<IContract[]>('/contracts', {
      params: { limit: 200 },
    });
    return response.data;
  }

  async getTasks(): Promise<ITask[]> {
    const response = await axiosInstance.get<ITask[]>('/tasks', {
      params: { limit: 200 },
    });
    return response.data;
  }

  async getTask(id: string): Promise<ITask> {
    const response = await axiosInstance.get<ITask>(`/tasks/${encodeURIComponent(id)}`);
    return response.data;
  }

  async getPrintableDocument(
    type: 'quotation' | 'contract',
    id: string,
    templateId?: string
  ): Promise<string> {
    const collection = type === 'quotation' ? 'quotations' : 'contracts';
    const response = await axiosInstance.get<string>(
      `/${collection}/${encodeURIComponent(id)}/pdf`,
      {
        params: templateId ? { templateId } : undefined,
        responseType: 'text',
      }
    );
    return response.data;
  }
}

export const documentService = new DocumentService();
