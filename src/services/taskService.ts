import { axiosInstance } from '../utils/axiosInstance';
import { ITask } from '../interfaces/documents.interface';

class TaskService {
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
}

export const taskService = new TaskService();
