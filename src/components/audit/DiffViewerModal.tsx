import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { IAuditLogItem } from '../../interfaces';

interface IDiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  logItem: IAuditLogItem | null;
}

export const DiffViewerModal: React.FC<IDiffViewerModalProps> = ({
  isOpen,
  onClose,
  logItem,
}) => {
  if (!isOpen || !logItem) return null;

  let metadataObj: any = null;
  if (logItem.metadata) {
    try {
      metadataObj = JSON.parse(logItem.metadata);
    } catch {
      metadataObj = null;
    }
  }

  const formatDateTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#2563eb" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Chi tiết Biến động Dữ liệu (Audit Log Diff - S2-04)
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mã bản ghi: {logItem.id}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Hành động</span>
              <strong style={{ color: '#1e293b' }}>{logItem.action}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Đối tượng</span>
              <span style={{ textTransform: 'capitalize', color: '#1e293b', fontWeight: 600 }}>
                {logItem.target_type} (#{logItem.target_id.slice(0, 8)})
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Người thực hiện</span>
              <strong style={{ color: '#1e293b' }}>{logItem.user_name || logItem.performed_by}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Thời gian ghi</span>
              <span style={{ color: '#475569' }}>{formatDateTime(logItem.timestamp)}</span>
            </div>
          </div>

          {/* Diff View Box */}
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              Trường dữ liệu thay đổi: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#2563eb' }}>{logItem.field_name || 'Nội dung chung'}</code>
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {/* Old value */}
              <div
                style={{
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  padding: '12px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#991b1b',
                    marginBottom: '6px',
                  }}
                >
                  Giá trị cũ (Before)
                </span>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#7f1d1d',
                    fontFamily: 'monospace',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    minHeight: '40px',
                  }}
                >
                  {logItem.old_value !== null && logItem.old_value !== undefined && logItem.old_value !== '' ? (
                    logItem.old_value
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>[Trống / Chưa có]</span>
                  )}
                </div>
              </div>

              {/* New value */}
              <div
                style={{
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  backgroundColor: '#f0fdf4',
                  padding: '12px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#166534',
                    marginBottom: '6px',
                  }}
                >
                  Giá trị mới (After)
                </span>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#14532d',
                    fontFamily: 'monospace',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    minHeight: '40px',
                  }}
                >
                  {logItem.new_value !== null && logItem.new_value !== undefined && logItem.new_value !== '' ? (
                    logItem.new_value
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>[Trống / Đã xóa]</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata json if any */}
          {metadataObj && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Thông tin ngữ cảnh bổ sung (Context Metadata)
              </span>
              <pre
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  margin: 0,
                  color: '#334155',
                }}
              >
                {JSON.stringify(metadataObj, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
