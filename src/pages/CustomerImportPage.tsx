import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import {
  IExcelCustomerPreviewResult,
  IExcelCustomerImportResult,
} from '../interfaces/customer.interface';
import { customerService } from '../services/customerService';
import { showGlobalToast } from '../context/ToastContext';
import styles from './CustomerCreatePage.module.css';

export const CustomerImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<IExcelCustomerPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<IExcelCustomerImportResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
    setPreviewData(null);
    setImportResult(null);
    setIsLoadingPreview(true);

    try {
      const preview = await customerService.previewExcelImport(file);
      setPreviewData(preview);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi đọc file Excel';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const result = await customerService.executeExcelImport(selectedFile);
      setImportResult(result);
      const msg = `Đã nhập thành công ${result.importedRows || 0} khách hàng từ Excel!`;
      showGlobalToast(msg, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi nhập dữ liệu từ Excel';
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      setErrorMessage(text);
      showGlobalToast(text, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => navigate('/customers')}
        className={styles.backBtn}
        aria-label="Quay lại danh sách khách hàng"
      >
        <ArrowLeft size={16} />
        <span>Trở về danh sách khách hàng</span>
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Nhập Khách Hàng từ Excel</h1>
        <p className={styles.subtitle}>
          Tải lên tệp Excel (.xlsx/.xls) hoặc CSV để nạp hàng loạt khách hàng doanh nghiệp vào hệ thống CRM
        </p>
      </header>

      <div className={styles.card}>
        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Zone */}
        {!importResult && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: 10,
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#F8FAFC',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#2563EB')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1')}
            >
              <UploadCloud size={44} style={{ color: '#64748B', margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '1rem', marginBottom: 4 }}>
                {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn tệp Excel hoặc CSV'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Hỗ trợ các định dạng .xlsx, .xls, .csv. Các cột chính: Tên công ty / Họ tên, Mã số thuế (MST).
              </div>
              {selectedFile && (
                <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
                  Kích thước: {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Preview */}
        {isLoadingPreview && (
          <div style={{ textAlign: 'center', padding: 36, color: '#64748B' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <div>Đang phân tích cấu trúc bảng tính và kiểm tra MST trùng khớp...</div>
          </div>
        )}

        {/* Preview Results */}
        {!importResult && previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            {/* Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div style={{ padding: '12px', backgroundColor: '#F1F5F9', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Tổng số dòng</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A' }}>{previewData.totalRows}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#ECFDF5', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#059669' }}>Dòng hợp lệ</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#059669' }}>{previewData.validRows}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#D97706' }}>Trùng MST (ghi đè)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#D97706' }}>{previewData.duplicateRows}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#DC2626' }}>Dòng lỗi</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#DC2626' }}>{previewData.invalidRows}</div>
              </div>
            </div>

            {/* Preview Table */}
            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Tên doanh nghiệp</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Mã số thuế (MST)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Người đại diện</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.previewItems?.slice(0, 100).map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: row.isValid ? '#FFFFFF' : '#FFF1F2',
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>{row.company || '—'}</td>
                      <td style={{ padding: '8px 12px' }}><code>{row.taxCode || '—'}</code></td>
                      <td style={{ padding: '8px 12px' }}>{row.fullName || '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{row.email || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {row.isValid ? (
                          <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Hợp lệ
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', fontWeight: 500 }} title={row.errors?.join('; ')}>
                            {row.errors?.[0] || 'Lỗi dữ liệu'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={resetState}
                disabled={isImporting}
              >
                Chọn tệp khác
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleConfirmImport}
                disabled={isImporting || previewData.validRows === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Đang tiến hành nhập...</span>
                  </>
                ) : (
                  <>
                    <FileUp size={16} />
                    <span>Xác nhận nhập ({previewData.validRows} dòng hợp lệ)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Import Results Success View */}
        {importResult && (
          <div style={{ textAlign: 'center', padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={54} color="#16A34A" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803D', margin: 0 }}>
              Nhập dữ liệu khách hàng thành công!
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
              Đã nhập thành công <strong>{importResult.importedRows || 0}</strong> khách hàng vào hệ thống CRM.
            </p>
            {((importResult.invalidRows || 0) + (importResult.skippedRows || 0) > 0) && (
              <p style={{ color: '#D97706', fontSize: '0.825rem', margin: 0 }}>
                Có {(importResult.invalidRows || 0) + (importResult.skippedRows || 0)} dòng bị bỏ qua do không đúng định dạng hoặc lỗi trùng lặp.
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={resetState}
              >
                Nhập thêm tệp khác
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={() => navigate('/customers')}
              >
                Trở về danh sách khách hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
