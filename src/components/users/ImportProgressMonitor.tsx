import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { userImportService, IUserImportJob } from '../../services/userImportService';

interface IImportProgressMonitorProps {
  jobId: string;
  initialJob?: IUserImportJob;
  onReset?: () => void;
}

export const ImportProgressMonitor: React.FC<IImportProgressMonitorProps> = ({
  jobId,
  initialJob,
  onReset,
}) => {
  const navigate = useNavigate();
  const [job, setJob] = useState<IUserImportJob | null>(initialJob || null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const pollJob = async () => {
      try {
        const data = await userImportService.getImportJob(jobId);
        if (isMounted) {
          setJob(data);
        }
        // Tiếp tục poll nếu job chưa kết thúc
        if (data.status === 'pending' || data.status === 'processing') {
          setTimeout(pollJob, 1000);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Không thể cập nhật tiến độ công việc nhập.');
        }
      }
    };

    pollJob();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleDownloadErrors = async () => {
    if (!job) return;
    try {
      setIsDownloading(true);
      await userImportService.downloadErrorReport(job.id);
    } catch (err: any) {
      alert('Không thể tải báo cáo lỗi: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setIsDownloading(false);
    }
  };

  const total = job?.total_rows || 0;
  const processed = job?.processed_rows || 0;
  const success = job?.successful_rows || 0;
  const duplicates = job?.duplicate_rows || 0;
  const failed = job?.failed_rows || 0;
  const remaining = job?.remaining_rows || Math.max(0, total - processed);

  const percentage = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const isDone = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const isRunning = job?.status === 'processing' || job?.status === 'pending';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-md, 12px)',
        border: isDone
          ? '1px solid #bbf7d0'
          : isFailed
          ? '1px solid #fecaca'
          : '1px solid #bfdbfe',
        padding: '28px',
        boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Header trạng thái */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: isDone
                ? '#dcfce7'
                : isFailed
                ? '#fee2e2'
                : '#eff6ff',
              color: isDone ? '#16a34a' : isFailed ? '#dc2626' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDone ? (
              <CheckCircle2 size={28} />
            ) : isFailed ? (
              <XCircle size={28} />
            ) : (
              <RefreshCw size={24} className="spin" />
            )}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: isDone ? '#166534' : isFailed ? '#991b1b' : '#1e3a8a',
              }}
            >
              {isDone
                ? 'Nhập dữ liệu người dùng hoàn tất!'
                : isFailed
                ? 'Công việc nhập gặp lỗi gián đoạn'
                : 'Đang xử lý nhập dữ liệu hàng loạt theo lô...'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Tệp: <strong>{job?.filename || 'Danh sách người dùng'}</strong> &bull; Mã tác vụ:{' '}
              <code>{jobId.slice(0, 8)}</code>
            </p>
          </div>
        </div>

        {/* Trạng thái hiện tại */}
        <span
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            backgroundColor: isDone
              ? '#dcfce7'
              : isFailed
              ? '#fee2e2'
              : '#dbeafe',
            color: isDone ? '#15803d' : isFailed ? '#b91c1c' : '#1e40af',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isDone ? (
            <>
              <CheckCircle2 size={14} /> Hoàn tất
            </>
          ) : isFailed ? (
            <>
              <XCircle size={14} /> Thất bại
            </>
          ) : (
            <>
              <Clock size={14} /> Đang xử lý ({percentage}%)
            </>
          )}
        </span>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Thanh tiến độ (Progress bar) */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#334155',
          }}
        >
          <span>Tiến độ xử lý lô: {processed} / {total} dòng</span>
          <span>{percentage}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: isDone ? '#16a34a' : isFailed ? '#dc2626' : '#2563eb',
              borderRadius: '9999px',
              transition: 'width 0.3s ease-in-out',
            }}
          />
        </div>
      </div>

      {/* Grid thống kê chi tiết theo thời gian thực */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng số dòng</span>
          <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{total}</p>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>Thành công</span>
          <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>{success}</p>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>Trùng lặp</span>
          <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 700, color: '#d97706' }}>{duplicates}</p>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase' }}>Lỗi / Bỏ qua</span>
          <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>{failed}</p>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Còn lại</span>
          <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 700, color: '#64748b' }}>{remaining}</p>
        </div>
      </div>

      {/* Hành động */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          {failed > 0 && (
            <button
              type="button"
              onClick={handleDownloadErrors}
              disabled={isDownloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #fca5a5',
                backgroundColor: '#fff1f2',
                color: '#b91c1c',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: isDownloading ? 'wait' : 'pointer',
              }}
            >
              <Download size={15} />
              <span>{isDownloading ? 'Đang tạo báo cáo...' : 'Tải báo cáo dòng lỗi (CSV)'}</span>
            </button>
          )}

          {isRunning && (
            <span style={{ fontSize: '0.82rem', color: '#64748b', alignSelf: 'center' }}>
              Bạn có thể rời trang an toàn. Công việc sẽ tiếp tục thực thi ngầm trên máy chủ.
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>Nhập tệp khác</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/users')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            }}
          >
            <span>Về danh sách người dùng</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
