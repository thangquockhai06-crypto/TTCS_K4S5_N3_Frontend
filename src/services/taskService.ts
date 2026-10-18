import { axiosInstance } from '../utils/axiosInstance';
import {
  ITask,
  ICreateTaskPayload,
  IUpdateTaskPayload,
  ITeamTaskDashboard,
  IGetTasksParams,
} from '../interfaces';

class TaskService {
  async getTasks(params?: IGetTasksParams): Promise<ITask[]> {
    const response = await axiosInstance.get<ITask[]>('/tasks', { params });
    return response.data;
  }

  async getTask(id: string): Promise<ITask> {
    const response = await axiosInstance.get<ITask>(`/tasks/${id}`);
    return response.data;
  }

  async createTask(payload: ICreateTaskPayload): Promise<ITask> {
    const response = await axiosInstance.post<ITask>('/tasks', payload);
    return response.data;
  }

  async updateTask(id: string, payload: IUpdateTaskPayload): Promise<ITask> {
    const response = await axiosInstance.put<ITask>(`/tasks/${id}`, payload);
    return response.data;
  }

  async toggleCompletion(id: string): Promise<ITask> {
    const response = await axiosInstance.patch<ITask>(`/tasks/${id}/toggle`);
    return response.data;
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  }

  async getDashboard(): Promise<ITeamTaskDashboard> {
    const response = await axiosInstance.get<ITeamTaskDashboard>('/tasks/dashboard');
    return response.data;
  }
}

export const taskService = new TaskService();
