import React, { useCallback, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import styles from './BulkImportUploadZone.module.css';

export interface IBulkImportUploadZoneProps {
  isParsing: boolean;
  selectedFile: File | null;
  globalError: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onDownloadTemplate: () => void;
}

export const BulkImportUploadZone: React.FC<IBulkImportUploadZoneProps> = ({
  isParsing,
  selectedFile,
  globalError,
  onFileSelect,
  onClear,
  onDownloadTemplate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      // Reset input để cho phép chọn lại cùng file
      e.target.value = '';
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isParsing) {
    return (
      <div className={styles.uploadZone}>
        <div className={styles.uploadZone__parsing}>
          <div className={styles.uploadZone__parsing__spinner} role="status" aria-label="Đang phân tích file" />
          <span className={styles.uploadZone__parsing__text}>Đang phân tích và kiểm tra dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.uploadZone}>
      {/* Template download strip */}
      <div className={styles.uploadZone__templateStrip}>
        <div className={styles.uploadZone__templateStrip__text}>
          <span className={styles.uploadZone__templateStrip__title}>
            📥 Tải file mẫu CSV
          </span>
          <span className={styles.uploadZone__templateStrip__sub}>
            Điền dữ liệu vào file mẫu, sau đó tải lên để nhập hàng loạt
          </span>
        </div>
        <button
          type="button"
          className={styles.uploadZone__templateStrip__btn}
          onClick={onDownloadTemplate}
        >
          <Download size={15} />
          Tải file mẫu
        </button>
      </div>

      {/* Drop area */}
      {!selectedFile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Kéo thả hoặc bấm để chọn file CSV"
          className={`${styles.uploadZone__dropArea} ${isDragOver ? styles['uploadZone__dropArea--dragOver'] : ''} ${globalError ? styles['uploadZone__dropArea--error'] : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        >
          <div className={styles.uploadZone__icon}>
            <Upload size={28} />
          </div>
          <span className={styles.uploadZone__title}>
            Kéo thả file vào đây hoặc&nbsp;
            <span className={styles.uploadZone__subLink}>bấm để chọn file</span>
          </span>
          <span className={styles.uploadZone__sub}>
            Hỗ trợ định dạng <strong>.CSV</strong> (lưu từ Excel: File → Lưu dưới dạng → CSV)
          </span>
          <span className={styles.uploadZone__formatBadge}>
            <FileSpreadsheet size={13} /> .csv · Tối đa 5MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className={styles.uploadZone__hiddenInput}
            onChange={handleInputChange}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Error banner */}
      {globalError && (
        <div className={styles.uploadZone__errorBanner} role="alert">
          <span>⚠️</span>
          <span>{globalError}</span>
        </div>
      )}

      {/* Selected file info */}
      {selectedFile && (
        <div className={styles.uploadZone__fileInfo}>
          <div className={styles.uploadZone__fileInfo__icon}>
            <FileSpreadsheet size={20} />
          </div>
          <div className={styles.uploadZone__fileInfo__meta}>
            <div className={styles.uploadZone__fileInfo__name} title={selectedFile.name}>
              {selectedFile.name}
            </div>
            <div className={styles.uploadZone__fileInfo__size}>
              {formatFileSize(selectedFile.size)} · Đang xử lý...
            </div>
          </div>
          <button
            type="button"
            className={styles.uploadZone__fileInfo__removeBtn}
            onClick={onClear}
            title="Xóa file đã chọn"
            aria-label="Xóa file đã chọn"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className={styles.uploadZone__instructions}>
        <div className={styles.uploadZone__instructions__title}>Hướng dẫn nhập liệu</div>
        <ul className={styles.uploadZone__instructions__list}>
          <li>Tải file mẫu CSV, mở bằng Excel và điền thông tin khách hàng vào từng dòng</li>
          <li>Lưu file dưới định dạng CSV (UTF-8) từ Excel: <strong>File → Lưu dưới dạng → CSV UTF-8</strong></li>
          <li>Tải lên file vừa lưu — hệ thống sẽ tự động kiểm tra lỗi và phát hiện trùng lặp</li>
          <li>Xem trước, xử lý trùng lặp rồi xác nhận nhập để hoàn tất</li>
        </ul>
      </div>
    </div>
  );
};
