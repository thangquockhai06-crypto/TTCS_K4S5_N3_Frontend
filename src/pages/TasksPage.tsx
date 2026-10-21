import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card } from '../components/common';
import { ITask } from '../interfaces';
import { taskService } from '../services/taskService';
import styles from './TasksPage.module.css';

function formatDate(value: string | null): string {
  if (!value) return 'Chưa có hạn xử lý';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Ngày đến hạn không hợp lệ'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export const TasksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskService.getTasks();
      setTasks(result);
      if (selectedId) {
        const detail = result.find((task) => task.id === selectedId);
        setSelectedTask(detail ?? (await taskService.getTask(selectedId)));
      } else {
        setSelectedTask(null);
      }
    } catch (loadError) {
      console.error('Không thể tải công việc.', loadError);
      setError('Không thể tải công việc. Vui lòng thử lại hoặc kiểm tra quyền truy cập.');
      setSelectedTask(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Công việc được giao</h1>
          <p>Theo dõi nhiệm vụ và mở trực tiếp công việc từ thông báo.</p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw size={15} />}
          onClick={() => void loadTasks()}
          isLoading={isLoading}
        >
          Tải lại
        </Button>
      </header>

      {selectedTask && (
        <Card padding="lg" className={styles.selected}>
          <span className={styles.eyebrow}>CHI TIẾT CÔNG VIỆC</span>
          <h2>{selectedTask.title}</h2>
          <p>{selectedTask.description || 'Không có mô tả.'}</p>
          <div className={styles.details}>
            <span>Trạng thái: {selectedTask.status}</span>
            <span>Ưu tiên: {selectedTask.priority}</span>
            <span>Hạn: {formatDate(selectedTask.dueDate)}</span>
            {selectedTask.customerName && <span>Khách hàng: {selectedTask.customerName}</span>}
            {selectedTask.dealTitle && <span>Cơ hội: {selectedTask.dealTitle}</span>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            Quay lại danh sách
          </Button>
        </Card>
      )}

      <Card padding="lg" className={styles.list}>
        <h2>Tất cả công việc ({tasks.length})</h2>
        {isLoading ? (
          <p className={styles.message}>Đang tải công việc...</p>
        ) : error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : tasks.length === 0 ? (
          <p className={styles.message}>Bạn chưa có công việc nào.</p>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className={`${styles.taskRow} ${selectedId === task.id ? styles.taskRowActive : ''}`}
              onClick={() => setSearchParams({ id: task.id })}
            >
              <span className={styles.taskIcon}><ClipboardCheck size={18} /></span>
              <span className={styles.taskText}>
                <strong>{task.title}</strong>
                <span>{task.customerName || task.dealTitle || task.description || 'Không có mô tả'}</span>
              </span>
              <span className={task.isOverdue ? styles.overdue : styles.taskDate}>
                {task.isOverdue ? 'Quá hạn' : formatDate(task.dueDate)}
              </span>
            </button>
          ))
        )}
      </Card>
    </section>
  );
};
