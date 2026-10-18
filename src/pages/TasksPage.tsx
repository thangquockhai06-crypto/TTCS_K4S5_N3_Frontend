import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  Users,
  Edit2,
  Trash2,
  CheckSquare,
  RotateCcw,
  Building2,
  Briefcase,
} from 'lucide-react';
import {
  ITask,
  ICreateTaskPayload,
  IUpdateTaskPayload,
  ITeamTaskDashboard,
} from '../interfaces';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { customerService } from '../services/customerService';
import { dealService } from '../services/dealService';
import { Badge, Button, Card, Modal, SearchBar } from '../components/common';
import { showGlobalToast } from '../context/ToastContext';
import styles from './TasksPage.module.css';

export const TasksPage: React.FC = () => {

  // Tasks & Dashboard state
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [dashboard, setDashboard] = useState<ITeamTaskDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state (S6-07)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueDateFrom, setDueDateFrom] = useState<string>('');
  const [dueDateTo, setDueDateTo] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Catalogs
  const [usersList, setUsersList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [dealsList, setDealsList] = useState<any[]>([]);

  // Modals (S6-06)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<ICreateTaskPayload>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    assigneeId: '',
    customerId: '',
    dealId: '',
  });

  const [editForm, setEditForm] = useState<IUpdateTaskPayload>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    isCompleted: false,
    dueDate: '',
    assigneeId: '',
    customerId: '',
    dealId: '',
  });

  // Load Catalogs
  useEffect(() => {
    userService.getUsers({ search: '', role: 'all', status: 'all', group: 'all', page: 1, limit: 100 }).then((res: any) => {
      setUsersList(res.data || res.items || res.users || res || []);
    }).catch(() => {});

    customerService.getCustomers({ limit: 100 }).then((res: any) => {
      setCustomersList(res.items || res.customers || res || []);
    }).catch(() => {});

    dealService.getDeals().then(setDealsList).catch(() => {});
  }, []);

  // Fetch Tasks and Dashboard
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, dashRes] = await Promise.all([
        taskService.getTasks({
          search: searchQuery.trim() || undefined,
          assignee_id: assigneeFilter !== 'all' ? assigneeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          due_date_from: dueDateFrom || undefined,
          due_date_to: dueDateTo || undefined,
          is_overdue: overdueOnly ? true : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        }),
        taskService.getDashboard(),
      ]);
      setTasks(tasksRes);
      setDashboard(dashRes);
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Không thể tải danh sách công việc.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, assigneeFilter, statusFilter, dueDateFrom, dueDateTo, overdueOnly, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Toggle Completion (S6-06)
  const handleToggle = async (taskId: string) => {
    try {
      const updated = await taskService.toggleCompletion(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showGlobalToast(
        updated.isCompleted ? 'Đã đánh dấu hoàn thành công việc!' : 'Đã mở lại công việc.',
        'success'
      );
      taskService.getDashboard().then(setDashboard).catch(() => {});
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  // Handle Create Task (S6-06)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      showGlobalToast('Vui lòng nhập tiêu đề công việc.', 'warning');
      return;
    }

    try {
      await taskService.createTask({
        ...createForm,
        assigneeId: createForm.assigneeId || undefined,
        customerId: createForm.customerId || undefined,
        dealId: createForm.dealId || undefined,
        dueDate: createForm.dueDate || undefined,
      });
      showGlobalToast('Đã tạo công việc mới thành công!', 'success');
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
        assigneeId: '',
        customerId: '',
        dealId: '',
      });
      fetchData();
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Lỗi tạo công việc', 'error');
    }
  };

  // Open Edit Modal (S6-06)
  const openEditModal = (task: ITask) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      isCompleted: task.isCompleted,
      dueDate: task.dueDate || '',
      assigneeId: task.assigneeId || '',
      customerId: task.customerId || '',
      dealId: task.dealId || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Update Task (S6-06)
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editForm.title?.trim()) return;

    try {
      await taskService.updateTask(selectedTask.id, {
        ...editForm,
        assigneeId: editForm.assigneeId || undefined,
        customerId: editForm.customerId || undefined,
        dealId: editForm.dealId || undefined,
        dueDate: editForm.dueDate || '',
      });
      showGlobalToast('Đã cập nhật công việc thành công!', 'success');
      setIsEditModalOpen(false);
      setSelectedTask(null);
      fetchData();
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Lỗi cập nhật công việc', 'error');
    }
  };

  // Handle Delete Task (S6-06)
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    try {
      await taskService.deleteTask(taskId);
      showGlobalToast('Đã xóa công việc thành công.', 'info');
      fetchData();
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Lỗi xóa công việc', 'error');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setAssigneeFilter('all');
    setStatusFilter('all');
    setDueDateFrom('');
    setDueDateTo('');
    setOverdueOnly(false);
    setPriorityFilter('all');
  };

  return (
    <div className={styles.tasksPage}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <Badge tone="primary" dot>
            SPRINT 6 · S6-06, S6-07, S6-09
          </Badge>
          <h1 className={styles.header__title}>Quản trị &amp; Tiến độ Công việc (Tasks Management)</h1>
          <p className={styles.header__subtitle}>
            Theo dõi, phân công và kiểm soát tiến độ công việc đội ngũ, tình trạng đến hạn/quá hạn và tải công việc nhóm.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} /> Tạo Công việc mới (S6-06)
        </Button>
      </header>

      {/* S6-09: Team Task Progress Dashboard */}
      {dashboard && (
        <section aria-label="Dashboard tiến độ công việc nhóm">
          <div className={styles.dashboardGrid}>
            {/* Total Tasks */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <CheckSquare size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <span className={styles.kpiLabel}>Tổng số Công việc</span>
                <div className={styles.kpiValue}>{dashboard.totalTasks}</div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đang quản lý trong nhóm</span>
              </div>
            </div>

            {/* Completed Tasks & Completion Rate */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className={styles.kpiLabel}>Đã Hoàn thành</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#059669' }}>
                    {dashboard.completionRate}%
                  </span>
                </div>
                <div className={styles.kpiValue}>
                  {dashboard.completedTasks} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/ {dashboard.totalTasks}</span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarFill} style={{ width: `${dashboard.completionRate}%` }} />
                </div>
              </div>
            </div>

            {/* Due Today Tasks */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
                <Clock size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <span className={styles.kpiLabel}>Đến hạn Hôm nay</span>
                <div className={styles.kpiValue}>{dashboard.dueTodayTasks}</div>
                <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Cần tập trung xử lý</span>
              </div>
            </div>

            {/* Overdue Tasks */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <AlertCircle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <span className={styles.kpiLabel}>Quá hạn (Overdue)</span>
                <div className={styles.kpiValue} style={{ color: dashboard.overdueTasks > 0 ? '#dc2626' : '#0f172a' }}>
                  {dashboard.overdueTasks}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                  {dashboard.overdueTasks > 0 ? 'Cần xử lý khẩn cấp!' : 'Không có việc trễ hạn'}
                </span>
              </div>
            </div>
          </div>

          {/* S6-09: Team Workload Breakdown */}
          {dashboard.teamWorkload && dashboard.teamWorkload.length > 0 && (
            <div className={styles.workloadSection} style={{ marginTop: 14 }}>
              <h3 className={styles.workloadTitle}>
                <Users size={18} style={{ color: '#2563eb' }} />
                Phân bổ Khối lượng Công việc Đội ngũ (Team Workload)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.workloadTable}>
                  <thead>
                    <tr>
                      <th>Thành viên phụ trách</th>
                      <th style={{ textAlign: 'center' }}>Tổng việc</th>
                      <th style={{ textAlign: 'center' }}>Đang chờ</th>
                      <th style={{ textAlign: 'center' }}>Đang thực hiện</th>
                      <th style={{ textAlign: 'center' }}>Đã hoàn thành</th>
                      <th style={{ textAlign: 'center' }}>Quá hạn</th>
                      <th style={{ textAlign: 'right' }}>Tiến độ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.teamWorkload.map((m) => {
                      const rate = m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
                      return (
                        <tr key={m.userId}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={14} style={{ color: '#64748b' }} />
                              {m.userName}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{m.totalTasks}</td>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{m.pendingTasks}</td>
                          <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 600 }}>{m.inProgressTasks}</td>
                          <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{m.completedTasks}</td>
                          <td style={{ textAlign: 'center' }}>
                            {m.overdueTasks > 0 ? (
                              <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
                                {m.overdueTasks}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>0</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{rate}%</span>
                              <div style={{ width: 60, height: 6, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${rate}%`, height: '100%', backgroundColor: '#10b981', borderRadius: 999 }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* S6-07: Filter Bar */}
      <section className={styles.filterBar} aria-label="Bộ lọc công việc">
        <div className={styles.filterRow}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm công việc theo tiêu đề hoặc mô tả..."
              shortcutHint=""
            />
          </div>

          {/* Filter by Assignee (S6-07) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={15} style={{ color: '#64748b' }} />
            <select
              className={styles.selectInput}
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              title="Lọc theo người được phân công (S6-07)"
            >
              <option value="all">👥 Tất cả người phụ trách</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status (S6-07) */}
          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Lọc theo trạng thái công việc (S6-07)"
          >
            <option value="all">⚡ Tất cả trạng thái</option>
            <option value="pending">⏳ Chờ xử lý</option>
            <option value="in_progress">🔄 Đang thực hiện</option>
            <option value="completed">✅ Đã hoàn thành</option>
          </select>

          {/* Filter by Priority */}
          <select
            className={styles.selectInput}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            title="Lọc theo mức ưu tiên"
          >
            <option value="all">🎯 Tất cả mức ưu tiên</option>
            <option value="urgent">🔴 Khẩn cấp</option>
            <option value="high">🟠 Cao</option>
            <option value="medium">🔵 Trung bình</option>
            <option value="low">⚪ Thấp</option>
          </select>
        </div>

        <div className={styles.filterRow} style={{ justifyContent: 'space-between' }}>
          {/* Due date range filter (S6-07) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Hạn xử lý từ:
            </span>
            <input
              type="date"
              className={styles.dateInput}
              value={dueDateFrom}
              onChange={(e) => setDueDateFrom(e.target.value)}
              title="Hạn xử lý từ ngày (S6-07)"
            />
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>đến:</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dueDateTo}
              onChange={(e) => setDueDateTo(e.target.value)}
              title="Hạn xử lý đến ngày (S6-07)"
            />

            {/* Overdue filter checkbox (S6-07) */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, color: '#dc2626', cursor: 'pointer', marginLeft: 8 }}>
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
              />
              Chỉ hiện công việc Quá hạn (S6-07)
            </label>
          </div>

          {(searchQuery || assigneeFilter !== 'all' || statusFilter !== 'all' || dueDateFrom || dueDateTo || overdueOnly || priorityFilter !== 'all') && (
            <Button variant="secondary" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw size={14} />}>
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      </section>

      {/* S6-06: Task List */}
      <section aria-label="Danh sách công việc">
        {isLoading ? (
          <Card padding="lg">
            <div style={{ textAlign: 'center', color: '#64748b' }}>Đang nạp danh sách công việc...</div>
          </Card>
        ) : tasks.length === 0 ? (
          <Card padding="lg">
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
              <CheckSquare size={44} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#475569', fontSize: '1rem' }}>
                Không tìm thấy công việc nào phù hợp với bộ lọc.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                Hãy thử nới lỏng bộ lọc hoặc bấm "+ Tạo Công việc mới" để thêm nhiệm vụ.
              </p>
            </div>
          </Card>
        ) : (
          <div className={styles.taskList}>
            {tasks.map((task) => {
              const priorityClass =
                task.priority === 'urgent'
                  ? styles.priorityUrgent
                  : task.priority === 'high'
                  ? styles.priorityHigh
                  : task.priority === 'medium'
                  ? styles.priorityMedium
                  : styles.priorityLow;

              const priorityLabel =
                task.priority === 'urgent'
                  ? 'Khẩn cấp'
                  : task.priority === 'high'
                  ? 'Cao'
                  : task.priority === 'medium'
                  ? 'Trung bình'
                  : 'Thấp';

              return (
                <div
                  key={task.id}
                  className={`${styles.taskCard} ${task.isCompleted ? styles.taskCardCompleted : ''}`}
                >
                  {/* Left: Checkbox + Title + Description + Tags */}
                  <div className={styles.taskLeft}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={task.isCompleted}
                      onChange={() => handleToggle(task.id)}
                      title={task.isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h4 className={`${styles.taskTitle} ${task.isCompleted ? styles.taskTitleCompleted : ''}`}>
                          {task.title}
                        </h4>
                        <span className={`${styles.priorityBadge} ${priorityClass}`}>{priorityLabel}</span>

                        {task.isOverdue && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <AlertCircle size={12} /> Quá hạn
                          </span>
                        )}
                      </div>

                      {task.description && <p className={styles.taskDesc}>{task.description}</p>}

                      {/* Associated Customer or Deal */}
                      {(task.customerName || task.dealTitle) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: '0.75rem' }}>
                          {task.customerName && (
                            <span style={{ color: '#1e40af', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Building2 size={12} /> {task.customerName}
                            </span>
                          )}
                          {task.dealTitle && (
                            <span style={{ color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Briefcase size={12} /> {task.dealTitle}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Assignee, Due Date, Actions */}
                  <div className={styles.taskMeta}>
                    {/* Assignee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontWeight: 600 }}>{task.assigneeName || 'Chưa gán'}</span>
                    </div>

                    {/* Due Date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: task.isOverdue ? '#dc2626' : '#64748b',
                        fontWeight: task.isOverdue ? 700 : 500,
                      }}
                    >
                      <Calendar size={14} />
                      <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                    </div>

                    {/* Status badge */}
                    <Badge
                      tone={task.isCompleted ? 'success' : task.status === 'in_progress' ? 'primary' : 'neutral'}
                      size="sm"
                    >
                      {task.isCompleted ? 'Hoàn thành' : task.status === 'in_progress' ? 'Đang thực hiện' : 'Chờ xử lý'}
                    </Badge>

                    {/* Edit and Delete buttons */}
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                      title="Sửa công việc (S6-06)"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                      title="Xóa công việc (S6-06)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: Create Task (S6-06) */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Tạo Công việc mới (S6-06)"
          maxWidth="md"
        >
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Tiêu đề công việc <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập tiêu đề nhiệm vụ..."
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả công việc cần thực hiện, tiêu chí bàn giao..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Mức độ ưu tiên
                </label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="urgent">🔴 Khẩn cấp</option>
                  <option value="high">🟠 Cao</option>
                  <option value="medium">🔵 Trung bình</option>
                  <option value="low">⚪ Thấp</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Người phụ trách
                </label>
                <select
                  value={createForm.assigneeId}
                  onChange={(e) => setCreateForm({ ...createForm, assigneeId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">— Gán cho tôi —</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.full_name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Hạn xử lý (Due Date)
              </label>
              <input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Khách hàng liên quan
                </label>
                <select
                  value={createForm.customerId}
                  onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">— Không chọn —</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.fullName || c.name || c.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Cơ hội bán hàng liên quan
                </label>
                <select
                  value={createForm.dealId}
                  onChange={(e) => setCreateForm({ ...createForm, dealId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">— Không chọn —</option>
                  {dealsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Lưu Công việc
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Edit Task (S6-06) */}
      {isEditModalOpen && selectedTask && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Cập nhật Thông tin Công việc (S6-06)"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Tiêu đề công việc <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Mức độ ưu tiên
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="urgent">🔴 Khẩn cấp</option>
                  <option value="high">🟠 Cao</option>
                  <option value="medium">🔵 Trung bình</option>
                  <option value="low">⚪ Thấp</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Trạng thái thực hiện
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="pending">⏳ Chờ xử lý</option>
                  <option value="in_progress">🔄 Đang thực hiện</option>
                  <option value="completed">✅ Đã hoàn thành</option>
                  <option value="cancelled">❌ Đã hủy</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Người phụ trách
                </label>
                <select
                  value={editForm.assigneeId}
                  onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">— Chưa phân công —</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.full_name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Hạn xử lý (Due Date)
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.isCompleted}
                  onChange={(e) => setEditForm({ ...editForm, isCompleted: e.target.checked })}
                />
                Đánh dấu đã hoàn thành (Completion Status)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Lưu Thay đổi
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
