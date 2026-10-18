export interface ITask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  isCompleted: boolean;
  dueDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  dealId?: string | null;
  dealTitle?: string | null;
  isOverdue: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ICreateTaskPayload {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  isCompleted?: boolean;
  dueDate?: string;
  assigneeId?: string;
  customerId?: string;
  dealId?: string;
}

export interface IUpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  isCompleted?: boolean;
  dueDate?: string;
  assigneeId?: string;
  customerId?: string;
  dealId?: string;
}

export interface IMemberWorkload {
  userId: string;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export interface ITeamTaskDashboard {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  dueTodayTasks: number;
  overdueTasks: number;
  completionRate: number;
  teamWorkload: IMemberWorkload[];
}

export interface IGetTasksParams {
  assignee_id?: string;
  status?: string;
  due_date_from?: string;
  due_date_to?: string;
  is_overdue?: boolean;
  search?: string;
  priority?: string;
  skip?: number;
  limit?: number;
}
