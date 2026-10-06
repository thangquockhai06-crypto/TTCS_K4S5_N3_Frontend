import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ExcelUploadZone } from './ExcelUploadZone';
import { PreviewDataGrid } from './PreviewDataGrid';
import { IExcelImportUserRow, IExcelImportResult } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

interface IExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<IExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rows, setRows] = useState<IExcelImportUserRow[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<IExcelImportResult | null>(null);

  if (!isOpen) return null;

  const validRows = rows.filter((r) => {
    const cleanName = (r.name || '').trim();
    const cleanEmail = (r.email || '').trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    return cleanName && emailOk;
  });

  const handleImport = async () => {
    if (validRows.length === 0) {
      setErrorMsg('Không có dòng dữ liệu nào hợp lệ để nhập vào hệ thống.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await sprint2Service.importExcelUsers(validRows);
      setImportResult(result);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Lỗi khi nhập dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRows([]);
    setImportResult(null);
    setErrorMsg(null);
    setFilterType('all');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
          maxWidth: '750px',
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
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Nhập danh sách người dùng từ Excel / CSV (S2-01)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Tải lên tệp danh sách nhân sự để thêm hàng loạt tài khoản vào hệ thống CRM
            </p>
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
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          {importResult ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <CheckCircle size={48} color="#16a34a" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#15803d' }}>
                Đã nhập thành công {importResult.success_count} người dùng!
              </h3>
              {importResult.failed_count > 0 && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309' }}>
                  Có {importResult.failed_count} dòng bị bỏ qua do không hợp lệ hoặc đã tồn tại.
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Nhập thêm tệp khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : (
            <>
              <ExcelUploadZone onDataParsed={setRows} disabled={isSubmitting} />

              {rows.length > 0 && (
                <PreviewDataGrid
                  rows={rows}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isSubmitting || validRows.length === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: validRows.length > 0 ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: validRows.length > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="spin" /> Đang nhập dữ liệu...
                </>
              ) : (
                `Tiến hành nhập (${validRows.length} dòng hợp lệ)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
