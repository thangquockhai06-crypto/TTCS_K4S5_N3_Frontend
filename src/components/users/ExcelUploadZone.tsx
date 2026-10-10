import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  AlertCircle,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { IExcelImportUserRow } from '../../interfaces';
import { userImportService, IUserImportPreviewRow } from '../../services/userImportService';

interface IExcelUploadZoneProps {
  onDataParsed: (
    rows: IExcelImportUserRow[],
    rawFile?: File,
    serverDetails?: IUserImportPreviewRow[]
  ) => void;
  disabled?: boolean;
}

export const ExcelUploadZone: React.FC<IExcelUploadZoneProps> = ({
  onDataParsed,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'csv' | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState<'xlsx' | 'csv' | null>(null);

  const handleDownloadTemplate = async (format: 'xlsx' | 'csv', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingTemplate(format);
      await userImportService.downloadTemplate(format);
    } catch (err: any) {
      setParseError('Không thể tải tệp mẫu. Vui lòng thử lại sau.');
    } finally {
      setDownloadingTemplate(null);
    }
  };

  const handleFile = async (file: File) => {
    const extMatch = file.name.match(/\.(xlsx|xls|csv)$/i);
    if (!extMatch) {
      setParseError('Chỉ hỗ trợ tệp định dạng Excel (.xlsx, .xls) hoặc CSV (.csv).');
      return;
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    setFileType(isCsv ? 'csv' : 'excel');
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setParseError(null);
    setIsLoading(true);

    try {
      // Gửi file lên backend preview API để validate chính xác bằng quy tắc nghiệp vụ
      const res = await userImportService.previewImport(file);
      const details = res.details || [];

      if (details.length === 0) {
        setParseError('Tệp không có dòng dữ liệu nào.');
        setIsLoading(false);
        return;
      }

      const parsedRows: IExcelImportUserRow[] = details.map((d) => ({
        name: d.full_name || '',
        email: d.email || '',
        phone: d.phone || undefined,
        role: d.role || 'sales',
        group: d.department || 'Miền Bắc (Hà Nội)',
      }));

      setFileName(file.name);
      setParseError(null);
      onDataParsed(parsedRows, file, details);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Lỗi khi đọc và kiểm tra tính hợp lệ của tệp.';
      setParseError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isLoading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setFileSize(null);
    setFileType(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onDataParsed([], undefined, undefined);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Thanh tiện ích tải file mẫu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 'var(--radius-sm, 8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={18} style={{ color: 'var(--color-primary, #2563eb)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
            Chưa có tệp dữ liệu chuẩn? Tải file mẫu tại đây:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => handleDownloadTemplate('xlsx', e)}
            disabled={downloadingTemplate !== null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs, 6px)',
              border: '1px solid #16a34a',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              cursor: downloadingTemplate ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Tải tệp mẫu Microsoft Excel (.xlsx)"
          >
            {downloadingTemplate === 'xlsx' ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <Download size={13} />
            )}
            <span>Mẫu Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleDownloadTemplate('csv', e)}
            disabled={downloadingTemplate !== null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs, 6px)',
              border: '1px solid var(--color-primary, #2563eb)',
              backgroundColor: '#eff6ff',
              color: 'var(--color-primary, #2563eb)',
              cursor: downloadingTemplate ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Tải tệp mẫu CSV phân tách bằng dấu phẩy (.csv)"
          >
            {downloadingTemplate === 'csv' ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <Download size={13} />
            )}
            <span>Mẫu CSV (.csv)</span>
          </button>
        </div>
      </div>

      {/* Vùng kéo thả tệp tải lên */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !fileName && !isLoading && fileInputRef.current?.click()}
        style={{
          border: isDragging
            ? '2px dashed var(--color-primary, #2563eb)'
            : '2px dashed var(--color-border-strong, #cbd5e1)',
          borderRadius: 'var(--radius-md, 10px)',
          padding: '28px 20px',
          textAlign: 'center',
          backgroundColor: isDragging
            ? 'var(--color-bg-sidebar-active, #eff6ff)'
            : 'var(--color-bg-subtle, #f8fafc)',
          cursor: disabled || fileName || isLoading ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isDragging ? 'var(--shadow-glow-primary)' : 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          disabled={disabled || isLoading}
        />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Loader2 size={36} style={{ color: 'var(--color-primary, #2563eb)' }} className="spin" />
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
              Đang phân tích cú pháp và kiểm tra hợp lệ dữ liệu từ máy chủ...
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
              Hệ thống đang kiểm tra cấu trúc cột, email trùng lặp và vai trò hệ thống
            </span>
          </div>
        ) : !fileName ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-soft, #eff6ff)',
                color: 'var(--color-primary, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={30} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                Kéo thả tệp Excel hoặc CSV vào đây hoặc{' '}
                <span style={{ color: 'var(--color-primary, #2563eb)', textDecoration: 'underline' }}>
                  bấm để chọn từ máy tính
                </span>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                Hỗ trợ định dạng chuẩn: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> (Dung lượng tối đa 15MB)
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              backgroundColor: 'var(--color-bg-surface, #ffffff)',
              borderRadius: 'var(--radius-sm, 8px)',
              border: '1px solid var(--color-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-xs, 6px)',
                  backgroundColor: fileType === 'csv' ? '#eff6ff' : '#f0fdf4',
                  color: fileType === 'csv' ? '#2563eb' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {fileType === 'csv' ? <FileText size={22} /> : <FileSpreadsheet size={22} />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                  {fileName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
                    Kích thước: {fileSize}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: fileType === 'csv' ? '#dbeafe' : '#dcfce7',
                      color: fileType === 'csv' ? '#1d4ed8' : '#15803d',
                      fontWeight: 600,
                    }}
                  >
                    {fileType === 'csv' ? 'Tệp CSV' : 'Tệp Excel'}
                  </span>
                </div>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                style={{
                  backgroundColor: '#fee2e2',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-xs, 6px)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                title="Hủy chọn tệp này"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {parseError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-danger-soft, #fef2f2)',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm, 8px)',
            color: 'var(--color-danger, #dc2626)',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{parseError}</span>
        </div>
      )}
    </div>
  );
};
