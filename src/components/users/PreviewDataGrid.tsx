import React, { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { IExcelImportUserRow } from '../../interfaces';

export interface IValidatedRow {
  index: number;
  row: IExcelImportUserRow;
  isValid: boolean;
  errors: string[];
}

interface IPreviewDataGridProps {
  rows: IExcelImportUserRow[];
  filterType: 'all' | 'valid' | 'invalid';
  onFilterChange: (type: 'all' | 'valid' | 'invalid') => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export const PreviewDataGrid: React.FC<IPreviewDataGridProps> = ({
  rows,
  filterType,
  onFilterChange,
}) => {
  // Validate rows client-side for immediate feedback
  const validatedRows = useMemo<IValidatedRow[]>(() => {
    const seenEmails = new Set<string>();

    return rows.map((row, idx) => {
      const errors: string[] = [];
      const cleanName = (row.name || '').trim();
      const cleanEmail = (row.email || '').trim().toLowerCase();
      const cleanPhone = (row.phone || '').trim().replace(/[\s-]/g, '');

      if (!cleanName) {
        errors.push('Họ và tên không được để trống.');
      }

      if (!cleanEmail) {
        errors.push('Email không được để trống.');
      } else if (!EMAIL_REGEX.test(cleanEmail)) {
        errors.push('Email sai định dạng (ví dụ: user@nexus.vn).');
      } else if (seenEmails.has(cleanEmail)) {
        errors.push('Email trùng lặp trong cùng tệp tải lên.');
      } else {
        seenEmails.add(cleanEmail);
      }

      if (cleanPhone && !VN_PHONE_REGEX.test(cleanPhone)) {
        errors.push('Số điện thoại không đúng định dạng di động Việt Nam (10 số, đầu 03/05/07/08/09).');
      }

      return {
        index: idx + 1,
        row,
        isValid: errors.length === 0,
        errors,
      };
    });
  }, [rows]);

  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 10;

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.filter((r) => !r.isValid).length;

  const displayedRows = useMemo(() => {
    if (filterType === 'valid') return validatedRows.filter((r) => r.isValid);
    if (filterType === 'invalid') return validatedRows.filter((r) => !r.isValid);
    return validatedRows;
  }, [validatedRows, filterType]);

  // Reset to page 1 on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, rows]);

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedRows.slice(start, start + pageSize);
  }, [displayedRows, currentPage]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Summary Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#f1f5f9',
          borderRadius: '6px',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            Tổng cộng: <strong>{rows.length}</strong> dòng
          </span>
          <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={15} /> <strong>{validCount}</strong> hợp lệ
          </span>
          <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={15} /> <strong>{invalidCount}</strong> không hợp lệ
          </span>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            style={{
              padding: '3px 8px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: filterType === 'all' ? '#2563eb' : '#ffffff',
              color: filterType === 'all' ? '#ffffff' : '#334155',
              cursor: 'pointer',
            }}
          >
            Tất cả ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('valid')}
            style={{
              padding: '3px 8px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: filterType === 'valid' ? '#16a34a' : '#ffffff',
              color: filterType === 'valid' ? '#ffffff' : '#334155',
              cursor: 'pointer',
            }}
          >
            Hợp lệ ({validCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('invalid')}
            style={{
              padding: '3px 8px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: filterType === 'invalid' ? '#dc2626' : '#ffffff',
              color: filterType === 'invalid' ? '#ffffff' : '#334155',
              cursor: 'pointer',
            }}
          >
            Lỗi ({invalidCount})
          </button>
        </div>
      </div>

      {invalidCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '6px',
            color: '#b45309',
            fontSize: '0.8rem',
          }}
        >
          <AlertTriangle size={15} />
          <span>
            Hệ thống chỉ lưu các dòng hợp lệ. Các dòng lỗi sẽ tự động bị loại trừ để bảo đảm an toàn dữ liệu.
          </span>
        </div>
      )}

      {/* Grid / Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '280px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ padding: '8px 10px', width: '40px', color: '#64748b' }}>#</th>
              <th style={{ padding: '8px 10px', color: '#64748b' }}>Họ và tên</th>
              <th style={{ padding: '8px 10px', color: '#64748b' }}>Email</th>
              <th style={{ padding: '8px 10px', color: '#64748b' }}>Vai trò</th>
              <th style={{ padding: '8px 10px', color: '#64748b' }}>Phòng ban / Nhóm</th>
              <th style={{ padding: '8px 10px', color: '#64748b' }}>Số điện thoại</th>
              <th style={{ padding: '8px 10px', color: '#64748b' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((item) => (
              <tr
                key={`preview-row-${item.index}`}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: item.isValid ? '#ffffff' : '#fff1f2',
                }}
              >
                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{item.index}</td>
                <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1e293b' }}>
                  {item.row.name || <span style={{ color: '#ef4444' }}>[Trống]</span>}
                </td>
                <td style={{ padding: '8px 10px', color: '#334155' }}>
                  {item.row.email || <span style={{ color: '#ef4444' }}>[Trống]</span>}
                </td>
                <td style={{ padding: '8px 10px', color: '#475569' }}>
                  {item.row.role || 'sales'}
                </td>
                <td style={{ padding: '8px 10px', color: '#475569' }}>
                  {item.row.group || 'Miền Bắc'}
                </td>
                <td style={{ padding: '8px 10px', color: '#475569' }}>
                  {item.row.phone || '-'}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  {item.isValid ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={12} /> Hợp lệ
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                      title={item.errors.join('; ')}
                    >
                      <XCircle size={12} /> {item.errors[0]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayedRows.length > pageSize && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#64748b',
            padding: '4px 8px',
          }}
        >
          <span>
            Hiển thị dòng {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, displayedRows.length)} / {displayedRows.length}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Trước
            </button>
            <span style={{ padding: '3px 6px' }}>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
