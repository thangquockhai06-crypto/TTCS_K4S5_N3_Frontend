import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import {
  IExcelCustomerPreviewResult,
  IExcelCustomerImportResult,
} from '../../interfaces/customer.interface';
import { customerService } from '../../services/customerService';
import { Button, Modal } from '../common';

export interface ICustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CustomerImportModal: React.FC<ICustomerImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
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
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi nhập dữ liệu từ Excel';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title="Nhập Khách Hàng từ Excel"
      subtitle="Tải lên tệp Excel (.xlsx/.xls) hoặc CSV để nhập hàng loạt với kiểm tra MST duy nhất"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button
            variant="secondary"
            onClick={() => {
              resetState();
              onClose();
            }}
            disabled={isImporting}
          >
            {importResult ? 'Đóng' : 'Hủy bỏ'}
          </Button>

          {!importResult && previewData && (
            <Button
              variant="primary"
              leftIcon={isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              onClick={handleConfirmImport}
              disabled={isImporting || previewData.validRows === 0}
            >
              {isImporting ? 'Đang nhập...' : `Xác nhận nhập (${previewData.validRows} dòng hợp lệ)`}
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              color: '#B91C1C',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Dropzone */}
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
                borderRadius: 8,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#F8FAFC',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#3B82F6')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1')}
            >
              <UploadCloud size={40} style={{ color: '#64748B', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn tệp Excel hoặc CSV'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Hỗ trợ các định dạng .xlsx, .xls, .csv. Cột yêu cầu: Tên công ty / Họ tên, MST (Mã số thuế).
              </div>
              {selectedFile && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#2563EB', fontWeight: 500 }}>
                  Kích thước: {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Preview */}
        {isLoadingPreview && (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <div>Đang phân tích cấu trúc bảng tính và kiểm tra MST trùng khớp...</div>
          </div>
        )}

        {/* Preview Results */}
        {!importResult && previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Statistics Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Tổng số dòng</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                  {previewData.totalRows}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#ECFDF5',
                  borderRadius: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#059669' }}>Dòng hợp lệ</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                  {previewData.validRows}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#D97706' }}>Trùng MST (sẽ cập nhật)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D97706' }}>
                  {previewData.duplicateRows}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#DC2626' }}>Dòng lỗi / Thiếu thông tin</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#DC2626' }}>
                  {previewData.invalidRows}
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div
              style={{
                maxHeight: 280,
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                      Dòng
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                      Tên Doanh nghiệp
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                      MST
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                      Email / SĐT
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.previewItems.map((row) => (
                    <tr
                      key={row.rowNumber}
                      style={{
                        backgroundColor: !row.isValid
                          ? '#FEF2F2'
                          : row.isDuplicateMST
                          ? '#FFFBEB'
                          : '#FFFFFF',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.rowNumber}</td>
                      <td style={{ padding: '8px 12px' }}>{row.company || row.fullName || '(Trống)'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <code>{row.taxCode || '—'}</code>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {row.email || row.phone || '—'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {!row.isValid ? (
                          <span style={{ color: '#DC2626', fontWeight: 600 }}>
                            ✕ Lỗi: {row.errors?.join(', ')}
                          </span>
                        ) : row.isDuplicateMST ? (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>
                            ⚠ Đã có trong DB (Upsert)
                          </span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 600 }}>
                            ✓ Hợp lệ (Tạo mới)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Success Import Report */}
        {importResult && (
          <div
            style={{
              padding: 24,
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={48} style={{ color: '#16A34A', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534', marginBottom: 8 }}>
              Hoàn tất nhập dữ liệu từ Excel!
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#15803D', marginBottom: 16 }}>
              Hệ thống đã xử lý và đồng bộ danh sách khách hàng doanh nghiệp thành công.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                maxWidth: 500,
                margin: '0 auto',
                backgroundColor: '#FFFFFF',
                padding: 12,
                borderRadius: 6,
                border: '1px solid #DCFCE7',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Tổng dòng</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{importResult.totalRows}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#16A34A' }}>Tạo mới</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16A34A' }}>
                  {importResult.importedRows}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#2563EB' }}>Cập nhật</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2563EB' }}>
                  {importResult.updatedRows}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#DC2626' }}>Thất bại</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#DC2626' }}>
                  {importResult.invalidRows}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
