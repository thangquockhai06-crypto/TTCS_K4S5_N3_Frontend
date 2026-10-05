import React from 'react';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, List, Upload } from 'lucide-react';
import { useBulkImport } from '../../hooks/useBulkImport';
import { Button } from '../common';
import { BulkImportPreviewTable } from './BulkImportPreviewTable';
import { BulkImportUploadZone } from './BulkImportUploadZone';
import styles from './BulkImportManager.module.css';

export const BulkImportManager: React.FC = () => {
  const {
    step,
    selectedFile,
    rows,
    stats,
    isParsing,
    isImporting,
    globalError,
    result,
    handleFileSelect,
    handleClearFile,
    handleDuplicateAction,
    handleDownloadTemplate,
    handleConfirmImport,
    handleReset,
  } = useBulkImport();

  const importableCount =
    stats.valid +
    rows.filter((r) => r.status === 'duplicate' && r.duplicateAction === 'update').length;

  return (
    <section
      className={styles.manager}
      aria-label="Phân hệ Nhập khách hàng hàng loạt từ Excel/CSV"
    >
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup ?? styles.header__titleGroup}>
          <h1 className={styles.header__title}>
            <FileSpreadsheet size={26} color="#2563eb" />
            Nhập Khách hàng Hàng loạt từ Excel
          </h1>
          <p className={styles.header__subtitle}>
            Tải file mẫu CSV → Điền dữ liệu → Tải lên → Xem trước & kiểm tra lỗi → Xác nhận nhập
          </p>
        </div>
      </header>

      {/* ── Wizard steps ── */}
      <nav className={styles.steps} aria-label="Các bước nhập liệu">
        <div
          className={`${styles.step} ${step === 'upload' ? styles['step--active'] : ''} ${step !== 'upload' ? styles['step--done'] : ''}`}
        >
          <span className={styles.step__num}>{step !== 'upload' ? '✓' : '1'}</span>
          <Upload size={14} />
          <span>Tải lên file</span>
        </div>
        <div className={styles.stepDivider} />
        <div
          className={`${styles.step} ${step === 'preview' ? styles['step--active'] : ''} ${step === 'result' ? styles['step--done'] : ''}`}
        >
          <span className={styles.step__num}>{step === 'result' ? '✓' : '2'}</span>
          <List size={14} />
          <span>Xem trước & xử lý</span>
        </div>
        <div className={styles.stepDivider} />
        <div
          className={`${styles.step} ${step === 'result' ? styles['step--active'] : ''}`}
        >
          <span className={styles.step__num}>3</span>
          <CheckCircle2 size={14} />
          <span>Kết quả nhập</span>
        </div>
      </nav>

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className={styles.card}>
          <div className={styles.card__header}>
            <h2 className={styles.card__title}>Bước 1 — Tải lên file dữ liệu</h2>
            <span className={styles.card__sub}>
              Tải file mẫu CSV, điền thông tin khách hàng rồi tải lên để hệ thống kiểm tra
            </span>
          </div>
          <BulkImportUploadZone
            isParsing={isParsing}
            selectedFile={selectedFile}
            globalError={globalError}
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
            onDownloadTemplate={handleDownloadTemplate}
          />
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && (
        <div className={styles.card}>
          <div className={styles.card__header}>
            <h2 className={styles.card__title}>Bước 2 — Xem trước & Xử lý trùng lặp</h2>
            <span className={styles.card__sub}>
              Kiểm tra từng dòng dữ liệu, xử lý bản ghi trùng lặp rồi xác nhận nhập
            </span>
          </div>

          <BulkImportPreviewTable
            rows={rows}
            stats={stats}
            onDuplicateAction={handleDuplicateAction}
          />

          <div className={styles.actions}>
            <div className={styles.actions__left}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
                onClick={handleClearFile}
              >
                Quay lại
              </Button>
            </div>
            <div className={styles.actions__right}>
              {stats.errors > 0 && (
                <span style={{ fontSize: '0.8125rem', color: '#92400e', fontWeight: 600 }}>
                  ⚠️ {stats.errors} dòng lỗi sẽ bị bỏ qua
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 size={15} />}
                onClick={handleConfirmImport}
                disabled={isImporting || importableCount === 0}
              >
                {isImporting
                  ? 'Đang nhập...'
                  : `Xác nhận Nhập ${importableCount} Khách hàng`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === 'result' && result && (
        <div className={styles.card}>
          <div className={styles.result}>
            <div className={styles.result__icon}>
              <CheckCircle2 size={36} />
            </div>
            <h2 className={styles.result__title}>Nhập dữ liệu hoàn tất!</h2>
            <p className={styles.result__sub}>
              Hệ thống đã xử lý{' '}
              <strong>{result.imported + result.updated + result.skipped}</strong> dòng từ file CSV
            </p>

            <div className={styles.result__grid} role="region" aria-label="Kết quả nhập liệu">
              <div className={`${styles.result__stat} ${styles['result__stat--imported']}`}>
                <span className={styles.result__stat__value}>{result.imported}</span>
                <span className={styles.result__stat__label}>Tạo mới</span>
              </div>
              <div className={`${styles.result__stat} ${styles['result__stat--updated']}`}>
                <span className={styles.result__stat__value}>{result.updated}</span>
                <span className={styles.result__stat__label}>Cập nhật</span>
              </div>
              <div className={`${styles.result__stat} ${styles['result__stat--skipped']}`}>
                <span className={styles.result__stat__value}>{result.skipped}</span>
                <span className={styles.result__stat__label}>Bỏ qua</span>
              </div>
            </div>

            <div className={styles.result__actions}>
              <Button variant="secondary" onClick={handleReset}>
                Nhập thêm file khác
              </Button>
              <Button
                variant="primary"
                onClick={() => { window.location.href = '/customers'; }}
              >
                Xem danh sách Khách hàng
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
