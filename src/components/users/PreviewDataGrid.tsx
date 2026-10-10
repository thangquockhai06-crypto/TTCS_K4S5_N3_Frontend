import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { IExcelImportUserRow } from '../../interfaces';
import { IUserImportPreviewRow } from '../../services/userImportService';

export interface IValidatedRow {
  index: number;
  row: IExcelImportUserRow;
  isValid: boolean;
  classification: 'NEW' | 'EXISTING' | 'DUPLICATE_FILE' | 'INVALID';
  errors: string[];
}

export type ImportFilterType = 'all' | 'valid' | 'invalid' | 'duplicate';

interface IPreviewDataGridProps {
  rows: IExcelImportUserRow[];
  filterType: ImportFilterType;
  onFilterChange: (type: ImportFilterType) => void;
  serverDetails?: IUserImportPreviewRow[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export const PreviewDataGrid: React.FC<IPreviewDataGridProps> = ({
  rows,
  filterType,
  onFilterChange,
  serverDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Kết hợp thông tin xác thực từ server (nếu có) hoặc tự động validate client-side
  const validatedRows = useMemo<IValidatedRow[]>(() => {
    if (serverDetails && serverDetails.length === rows.length) {
      return serverDetails.map((sd, idx) => ({
        index: sd.row_index || idx + 1,
        row: rows[idx],
        isValid: sd.status === 'VALID',
        classification: (sd.classification as any) || (sd.status === 'VALID' ? 'NEW' : 'INVALID'),
        errors: sd.errors || [],
      }));
    }

    const seenEmails = new Set<string>();

    return rows.map((row, idx) => {
      const errors: string[] = [];
      let classification: 'NEW' | 'EXISTING' | 'DUPLICATE_FILE' | 'INVALID' = 'NEW';
      const cleanName = (row.name || '').trim();
      const cleanEmail = (row.email || '').trim().toLowerCase();
      const cleanPhone = (row.phone || '').trim().replace(/[\s-]/g, '');

      if (!cleanName) {
        errors.push('Họ và tên không được để trống.');
        classification = 'INVALID';
      }

      if (!cleanEmail) {
        errors.push('Email không được để trống.');
        classification = 'INVALID';
      } else if (!EMAIL_REGEX.test(cleanEmail)) {
        errors.push('Email sai định dạng (ví dụ: user@nexus.vn).');
        classification = 'INVALID';
      } else if (seenEmails.has(cleanEmail)) {
        errors.push('Email trùng lặp trong cùng tệp tải lên.');
        classification = 'DUPLICATE_FILE';
      } else {
        seenEmails.add(cleanEmail);
      }

      if (cleanPhone && !VN_PHONE_REGEX.test(cleanPhone)) {
        errors.push('Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số).');
        classification = 'INVALID';
      }

      return {
        index: idx + 1,
        row,
        isValid: errors.length === 0,
        classification: errors.length > 0 && classification === 'NEW' ? 'INVALID' : classification,
        errors,
      };
    });
  }, [rows, serverDetails]);

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const duplicateCount = validatedRows.filter(
    (r) => r.classification === 'EXISTING' || r.classification === 'DUPLICATE_FILE'
  ).length;
  const invalidCount = validatedRows.filter(
    (r) => !r.isValid && r.classification !== 'EXISTING' && r.classification !== 'DUPLICATE_FILE'
  ).length;

  // Lọc theo filterType và từ khóa tìm kiếm nội bộ
  const filteredRows = useMemo(() => {
    let result = validatedRows;

    if (filterType === 'valid') {
      result = result.filter((r) => r.isValid);
    } else if (filterType === 'duplicate') {
      result = result.filter(
        (r) => r.classification === 'EXISTING' || r.classification === 'DUPLICATE_FILE'
      );
    } else if (filterType === 'invalid') {
      result = result.filter(
        (r) => !r.isValid && r.classification !== 'EXISTING' && r.classification !== 'DUPLICATE_FILE'
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (r) =>
          (r.row.name || '').toLowerCase().includes(q) ||
          (r.row.email || '').toLowerCase().includes(q) ||
          (r.row.group || '').toLowerCase().includes(q) ||
          (r.row.role || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [validatedRows, filterType, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  // Reset trang khi đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm, rows]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  if (rows.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Thanh công cụ: Thống kê, Bộ lọc & Tìm kiếm nhanh */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
          borderRadius: 'var(--radius-sm, 8px)',
          border: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        {/* Bộ nút phân loại trạng thái */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            style={{
              padding: '5px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs, 6px)',
              border: filterType === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: filterType === 'all' ? '#2563eb' : '#ffffff',
              color: filterType === 'all' ? '#ffffff' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Tất cả ({rows.length})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('valid')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs, 6px)',
              border: filterType === 'valid' ? '1px solid #16a34a' : '1px solid #cbd5e1',
              backgroundColor: filterType === 'valid' ? '#16a34a' : '#ffffff',
              color: filterType === 'valid' ? '#ffffff' : '#15803d',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Hợp lệ / Mới ({validCount})</span>
          </button>

          {duplicateCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('duplicate')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs, 6px)',
                border: filterType === 'duplicate' ? '1px solid #d97706' : '1px solid #cbd5e1',
                backgroundColor: filterType === 'duplicate' ? '#d97706' : '#ffffff',
                color: filterType === 'duplicate' ? '#ffffff' : '#b45309',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Copy size={13} />
              <span>Trùng lặp ({duplicateCount})</span>
            </button>
          )}

          {invalidCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('invalid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs, 6px)',
                border: filterType === 'invalid' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                backgroundColor: filterType === 'invalid' ? '#dc2626' : '#ffffff',
                color: filterType === 'invalid' ? '#ffffff' : '#b91c1c',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <XCircle size={13} />
              <span>Lỗi định dạng ({invalidCount})</span>
            </button>
          )}
        </div>

        {/* Ô tìm kiếm nhanh trong bảng xem trước */}
        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Lọc trong bảng xem trước..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 30px 6px 32px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-xs, 6px)',
              border: '1px solid var(--color-border-strong, #cbd5e1)',
              backgroundColor: '#ffffff',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Thông báo hướng dẫn xử lý lỗi */}
      {(duplicateCount > 0 || invalidCount > 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: 'var(--radius-sm, 8px)',
            color: '#b45309',
            fontSize: '0.82rem',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            Quy tắc an toàn dữ liệu: Các dòng <strong>hợp lệ</strong> sẽ được nạp vào hệ thống.
            Các dòng trùng lặp email hoặc lỗi dữ liệu sẽ tự động <strong>bỏ qua</strong> và được xuất báo cáo lỗi chi tiết.
          </span>
        </div>
      )}

      {/* Bảng dữ liệu xem trước */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 'var(--radius-sm, 8px)',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead
            style={{
              backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
              borderBottom: '1px solid var(--color-border, #e2e8f0)',
            }}
          >
            <tr>
              <th style={{ padding: '10px 12px', width: '48px', color: '#64748b', fontWeight: 600 }}>#</th>
              <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Họ và tên</th>
              <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Email doanh nghiệp</th>
              <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Số điện thoại</th>
              <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Vai trò</th>
              <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Phòng ban / Nhóm</th>
              <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Trạng thái đối soát</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '36px 12px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontStyle: 'italic',
                  }}
                >
                  Không tìm thấy dòng dữ liệu nào khớp với bộ lọc hoặc từ khóa tìm kiếm.
                </td>
              </tr>
            ) : (
              paginatedRows.map((item) => {
                const isNew = item.classification === 'NEW';
                const isExisting = item.classification === 'EXISTING';
                const isDupFile = item.classification === 'DUPLICATE_FILE';

                return (
                  <tr
                    key={`preview-row-${item.index}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isNew
                        ? '#ffffff'
                        : isExisting || isDupFile
                        ? '#fffdf5'
                        : '#fef2f2',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 500 }}>
                      {item.index}
                    </td>

                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                      {item.row.name || (
                        <span style={{ color: '#ef4444', fontStyle: 'italic' }}>[Thiếu họ tên]</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      {item.row.email || (
                        <span style={{ color: '#ef4444', fontStyle: 'italic' }}>[Thiếu email]</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {item.row.phone || '-'}
                    </td>

                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {item.row.role || 'sales'}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {item.row.group || 'Miền Bắc (Hà Nội)'}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {isNew ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Người dùng mới</span>
                        </span>
                      ) : isExisting ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                          title={item.errors.join('; ')}
                        >
                          <AlertTriangle size={13} />
                          <span>Đã có trong CRM</span>
                        </span>
                      ) : isDupFile ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                          title={item.errors.join('; ')}
                        >
                          <Copy size={13} />
                          <span>Trùng trong file</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                          title={item.errors.join('; ')}
                        >
                          <XCircle size={13} />
                          <span>{item.errors[0] || 'Lỗi dữ liệu'}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang hoàn chỉnh */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 14px',
          backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 'var(--radius-sm, 8px)',
          fontSize: '0.82rem',
          color: 'var(--color-text-secondary, #475569)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs, 4px)',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.82rem',
                cursor: 'pointer',
                outline: 'none',
              }}
              aria-label="Số dòng mỗi trang"
            >
              <option value={5}>5 dòng</option>
              <option value={10}>10 dòng (chuẩn)</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>

          <span>
            Hiển thị dòng{' '}
            <strong style={{ color: '#0f172a' }}>
              {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            -{' '}
            <strong style={{ color: '#0f172a' }}>
              {Math.min(currentPage * pageSize, filteredRows.length)}
            </strong>{' '}
            / tổng số <strong style={{ color: '#0f172a' }}>{filteredRows.length}</strong> dòng
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            title="Trang đầu"
            aria-label="Trang đầu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs, 4px)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: currentPage <= 1 ? '#94a3b8' : '#334155',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.45 : 1,
            }}
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
            aria-label="Trang trước"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs, 4px)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: currentPage <= 1 ? '#94a3b8' : '#334155',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.45 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`preview-ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>
                ...
              </span>
            ) : (
              <button
                key={`preview-page-${p}`}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '28px',
                  height: '28px',
                  padding: '0 6px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: p === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: p === currentPage ? '#2563eb' : '#ffffff',
                  color: p === currentPage ? '#ffffff' : '#334155',
                  fontWeight: p === currentPage ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Trang sau"
            aria-label="Trang sau"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs, 4px)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: currentPage >= totalPages ? '#94a3b8' : '#334155',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.45 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Trang cuối"
            aria-label="Trang cuối"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs, 4px)',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: currentPage >= totalPages ? '#94a3b8' : '#334155',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.45 : 1,
            }}
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
