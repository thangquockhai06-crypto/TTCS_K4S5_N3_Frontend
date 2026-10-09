import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { IAuditLogItem } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { DiffViewerModal } from './DiffViewerModal';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [performedBy, setPerformedBy] = useState('');
  const [targetType, setTargetType] = useState('all');

  // Selected for diff modal
  const [selectedLog, setSelectedLog] = useState<IAuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await sprint2Service.getAuditLogs({
        performed_by: performedBy || undefined,
        target_type: targetType !== 'all' ? targetType : undefined,
        page,
        limit,
      });
      const logList = data.items || (data as any).data || [];
      setLogs(Array.isArray(logList) ? logList : []);
      setTotal(data.total || (Array.isArray(logList) ? logList.length : 0));
      setTotalPages(data.pages || Math.ceil((data.total || 1) / limit) || 1);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Lỗi khi tải nhật ký kiểm toán.');
    } finally {
      setIsLoading(false);
    }
  }, [performedBy, targetType, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDateTime = (ts?: string) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return ts;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search performed by */}
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Người thực hiện / Email..."
              value={performedBy}
              onChange={(e) => {
                setPerformedBy(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <Search
              size={14}
              color="#94a3b8"
              style={{ position: 'absolute', left: '9px', top: '8px' }}
            />
          </div>

          {/* Target Type Filter */}
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              outline: 'none',
            }}
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="deal">Phễu Cơ hội (Deal)</option>
            <option value="customer">Khách hàng (Customer)</option>
            <option value="user">Người dùng / Phân quyền (User)</option>
            <option value="quota">Chỉ tiêu / Doanh số (Quota)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#b91c1c',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Thời gian</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Người thực hiện</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Hành động</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Đối tượng</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Trường sửa đổi</th>
              <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Giá trị cũ → mới</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải dữ liệu kiểm toán...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Không có bản ghi nhật ký kiểm toán nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.created_at || log.timestamp)}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1e293b' }}>
                    <div>{log.user_name || log.performed_by}</div>
                    {log.user_email && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{log.user_email}</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor:
                          log.action === 'CREATE'
                            ? '#dcfce7'
                            : log.action === 'DELETE'
                            ? '#fee2e2'
                            : '#e0f2fe',
                        color:
                          log.action === 'CREATE'
                            ? '#15803d'
                            : log.action === 'DELETE'
                            ? '#b91c1c'
                            : '#0369a1',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{log.target_type}</span>{' '}
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>#{log.target_id.slice(0, 8)}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                    {log.field_name ? (
                      <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '0.75rem' }}>
                        {log.field_name}
                      </code>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#334155', maxWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.old_value && (
                        <span style={{ color: '#dc2626', textDecoration: 'line-through', fontSize: '0.75rem' }}>
                          {log.old_value}
                        </span>
                      )}
                      {log.old_value && log.new_value && <span>→</span>}
                      {log.new_value && (
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
                          {log.new_value}
                        </span>
                      )}
                      {!log.old_value && !log.new_value && <span style={{ color: '#94a3b8' }}>-</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={12} />
                      So sánh Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <span>
            Hiển thị <strong>{logs.length}</strong> / <strong>{total}</strong> bản ghi kiểm toán
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Trước
            </button>
            <span style={{ padding: '4px 8px' }}>
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      <DiffViewerModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        logItem={selectedLog}
      />
    </div>
  );
};
