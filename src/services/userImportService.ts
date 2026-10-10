import { axiosInstance } from '../utils/axiosInstance';

export interface IUserImportPreviewRow {
  row_index: number;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  status: 'VALID' | 'INVALID';
  classification?: 'NEW' | 'EXISTING' | 'DUPLICATE_FILE' | 'INVALID';
  errors: string[];
}

export interface IUserImportPreviewResponse {
  total_rows: number;
  valid_count: number;
  error_count: number;
  details: IUserImportPreviewRow[];
}

export interface IUserImportJob {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  batch_size: number;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  duplicate_rows: number;
  remaining_rows: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by_user_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  error_summary?: string;
}

class UserImportService {
  /**
   * Tải về tệp mẫu chuẩn (.xlsx hoặc .csv)
   */
  async downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
    const response = await axiosInstance.get('/users/import/template', {
      params: { format },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type:
        format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_import_template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Xem trước và kiểm tra tính hợp lệ của tệp Excel/CSV từ Server
   */
  async previewImport(file: File): Promise<IUserImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<IUserImportPreviewResponse>(
      '/users/import/preview',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  /**
   * Khởi tạo công việc nhập người dùng hàng loạt chạy nền từ file
   */
  async startImportJob(file: File, batchSize: number = 500): Promise<IUserImportJob> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<IUserImportJob>(
      '/users/import/jobs',
      formData,
      {
        params: { batch_size: batchSize },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  /**
   * Khởi tạo công việc nhập người dùng hàng loạt từ danh sách JSON
   */
  async startImportJobFromRows(rows: any[], batchSize: number = 500): Promise<IUserImportJob> {
    const response = await axiosInstance.post<IUserImportJob>(
      '/users/import/jobs',
      { rows, batch_size: batchSize },
      {
        params: { batch_size: batchSize },
      }
    );
    return response.data;
  }

  /**
   * Truy vấn tiến độ công việc theo Job ID
   */
  async getImportJob(jobId: string): Promise<IUserImportJob> {
    const response = await axiosInstance.get<IUserImportJob>(`/users/import/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Lấy danh sách các công việc nhập gần đây
   */
  async listImportJobs(limit: number = 10): Promise<IUserImportJob[]> {
    const response = await axiosInstance.get<IUserImportJob[]>('/users/import/jobs', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Tải về báo cáo lỗi dạng CSV
   */
  async downloadErrorReport(jobId: string): Promise<void> {
    const response = await axiosInstance.get(`/users/import/jobs/${jobId}/errors.csv`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_errors_${jobId.slice(0, 8)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const userImportService = new UserImportService();
