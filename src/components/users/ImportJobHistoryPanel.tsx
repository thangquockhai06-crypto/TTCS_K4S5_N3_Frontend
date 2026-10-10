import React, { useEffect, useState } from 'react';
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { userImportService, IUserImportJob } from '../../services/userImportService';

interface IImportJobHistoryPanelProps {
  onSelectJob?: (job: IUserImportJob) => void;
}

export const ImportJobHistoryPanel: React.FC<IImportJobHistoryPanelProps> = ({
  onSelectJob,
}) => {
  const [jobs, setJobs] = useState<IUserImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await userImportService.listImportJobs(15);
      setJobs(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải lịch sử các đợt nhập người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDownloadCsv = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await userImportService.downloadErrorReport(jobId);
    } catch (err: any) {
      alert('Không thể tải tệp báo cáo lỗi: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-md, 10px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} style={{ color: 'var(--color-primary, #2563eb)' }} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Lịch Sử Các Đợt Nhập Người Dùng Hàng Loạt
          </h3>
        </div>

        <button
          type="button"
          onClick={fetchJobs}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#334155',
            cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '0.82rem',
            marginBottom: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', color: '#2563eb' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Đang tải danh sách các tác vụ nhập...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
          Chưa có công việc nhập người dùng nào được ghi nhận trong hệ thống.
        </div>
      ) : (
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Tên tệp tải lên</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Thời gian</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Tổng dòng</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Thành công</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Trùng lặp</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Bị lỗi</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '9px 12px', color: '#64748b', fontWeight: 600 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const isCompleted = j.status === 'completed';
                const isRunning = j.status === 'processing' || j.status === 'pending';

                return (
                  <tr
                    key={`import-job-${j.id}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: onSelectJob ? 'pointer' : 'default',
                    }}
                    onClick={() => onSelectJob && onSelectJob(j)}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={16} style={{ color: '#16a34a' }} />
                        <span>{j.filename}</span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                      {j.created_at
                        ? new Date(j.created_at).toLocaleString('vi-VN')
                        : 'Vừa xong'}
                    </td>

                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>
                      {j.total_rows}
                    </td>

                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#16a34a' }}>
                      {j.successful_rows}
                    </td>

                    <td style={{ padding: '10px 12px', color: '#d97706' }}>
                      {j.duplicate_rows}
                    </td>

                    <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: j.failed_rows > 0 ? 600 : 400 }}>
                      {j.failed_rows}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: isCompleted
                            ? '#dcfce7'
                            : isRunning
                            ? '#dbeafe'
                            : '#fee2e2',
                          color: isCompleted
                            ? '#15803d'
                            : isRunning
                            ? '#1e40af'
                            : '#b91c1c',
                        }}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={12} /> Hoàn tất
                          </>
                        ) : isRunning ? (
                          <>
                            <Clock size={12} /> Đang chạy
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Thất bại
                          </>
                        )}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {j.failed_rows > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadCsv(j.id, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: '1px solid #fca5a5',
                            backgroundColor: '#fff1f2',
                            color: '#b91c1c',
                            cursor: 'pointer',
                          }}
                          title="Tải báo cáo tệp lỗi CSV"
                        >
                          <Download size={12} />
                          <span>Báo cáo lỗi</span>
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
