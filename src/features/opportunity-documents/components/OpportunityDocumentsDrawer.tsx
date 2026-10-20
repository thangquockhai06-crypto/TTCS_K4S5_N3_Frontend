import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Download, FileText, RefreshCw, UploadCloud } from 'lucide-react';
import { Button, Drawer, EmptyState, LoadingSkeleton } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthorization } from '../../../hooks/useAuthorization';
import { useOpportunityDocuments } from '../hooks/useOpportunityDocuments';
import { MOCK_OPPORTUNITY_DOCUMENTS_WARNING } from '../mocks/opportunityDocuments.mock';
import { USE_MOCK_OPPORTUNITY_DOCUMENTS } from '../services/OpportunityDocumentsService';
import {
  MAX_OPPORTUNITY_DOCUMENT_BYTES,
  OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS,
} from '../types/OpportunityDocuments.types';
import {
  formatDocumentSize,
  formatDocumentTimestamp,
} from '../utils/opportunityDocuments';
import styles from '../styles/OpportunityDocumentsDrawer.module.css';

interface IOpportunityDocumentsDrawerProps {
  isOpen: boolean;
  opportunityId: string | null;
  opportunityTitle: string;
  onClose: () => void;
}

const ACCEPT_ATTRIBUTE = OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS.join(',');
const MAX_SIZE_LABEL = `${MAX_OPPORTUNITY_DOCUMENT_BYTES / (1024 * 1024)} MB`;

export const OpportunityDocumentsDrawer: React.FC<IOpportunityDocumentsDrawerProps> = ({
  isOpen,
  opportunityId,
  opportunityTitle,
  onClose,
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { user } = useAuth();
  const { hasPermission } = useAuthorization();
  const canManageDeals = hasPermission('manage_deals');

  const {
    documents,
    isLoading,
    isUploading,
    downloadingId,
    error,
    uploadResults,
    retry,
    uploadFiles,
    downloadDocument,
    clearUploadResults,
  } = useOpportunityDocuments(opportunityId, isOpen);

  useEffect(() => {
    if (isOpen) {
      clearUploadResults();
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [clearUploadResults, isOpen, opportunityId]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    await uploadFiles(files, user?.fullName?.trim() || 'Người dùng hiện tại');
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading && opportunityId) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading || !opportunityId) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    await uploadFiles(files, user?.fullName?.trim() || 'Người dùng hiện tại');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Tài liệu cơ hội"
      subtitle={opportunityTitle}
    >
      <div className={styles.documents}>
        {USE_MOCK_OPPORTUNITY_DOCUMENTS && (
          <p className={styles.documents__mockWarning} role="note">
            {MOCK_OPPORTUNITY_DOCUMENTS_WARNING}
          </p>
        )}

        <section
          className={`${styles.documents__uploader} ${
            isDragging ? styles['documents__uploader--dragging'] : ''
          }`}
          aria-labelledby={inputId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className={styles.documents__uploaderLabel} htmlFor={inputId}>
            <UploadCloud size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Chọn hoặc kéo thả nhiều tệp để đính kèm
          </label>
          <p className={styles.documents__uploaderHint}>
            Mỗi tệp tối đa {MAX_SIZE_LABEL}. Định dạng Frontend đang kiểm tra:{' '}
            {OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS.join(', ')}. Tệp hợp lệ vẫn được
            nhận khi một tệp khác lỗi.
          </p>
          <input
            ref={fileInputRef}
            id={inputId}
            className={styles.documents__fileInput}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            disabled={isUploading || !opportunityId}
            onChange={handleFileChange}
          />
          {isUploading && (
            <p className={styles.documents__uploaderHint} aria-live="polite">
              Đang mô phỏng tải lên trong phiên hiện tại…
            </p>
          )}
        </section>

        {uploadResults.length > 0 && (
          <ul className={styles.documents__results} aria-live="polite">
            {uploadResults.map((result, index) => (
              <li
                key={`${index}-${result.status}-${result.fileName}`}
                className={`${styles.documents__result} ${
                  result.status === 'success'
                    ? styles['documents__result--success']
                    : styles['documents__result--failure']
                }`}
              >
                {result.status === 'success'
                  ? `"${result.fileName}" đã được ghi nhận trong mock phiên này. Không lưu trên Backend.`
                  : result.message}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className={styles.documents__error} role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{error}</p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={15} />}
              onClick={retry}
            >
              Thử lại
            </Button>
          </div>
        )}

        {isLoading ? (
          <div aria-live="polite" aria-label="Đang tải danh sách tài liệu">
            <LoadingSkeleton rows={3} height={96} />
          </div>
        ) : documents.length === 0 && !error ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="Chưa có tài liệu"
            description="Hồ sơ thầu và biên bản họp của cơ hội này sẽ xuất hiện tại đây sau khi bạn chọn tệp."
          />
        ) : (
          <ul className={styles.documents__list} aria-label="Tài liệu của cơ hội">
            {documents.map((document) => {
              const uploadedAt = new Date(document.uploadedAt);
              const hasValidDate = !Number.isNaN(uploadedAt.getTime());

              return (
                <li className={styles.documents__item} key={document.id}>
                  <article className={styles.documents__itemBody}>
                    <h3 className={styles.documents__fileName}>{document.fileName}</h3>
                    <div className={styles.documents__meta}>
                      <span>{formatDocumentSize(document.sizeBytes)}</span>
                      <span>Người tải lên: {document.uploadedByName}</span>
                      {hasValidDate ? (
                        <time dateTime={document.uploadedAt}>
                          {formatDocumentTimestamp(document.uploadedAt)}
                        </time>
                      ) : (
                        <span>{formatDocumentTimestamp(document.uploadedAt)}</span>
                      )}
                    </div>
                  </article>
                  <div className={styles.documents__actions}>
                    {!canManageDeals ? (
                      <p className={styles.documents__restricted}>
                        Tài khoản thiếu quyền (manage_deals).
                      </p>
                    ) : document.canDownload ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download size={15} />}
                        isLoading={downloadingId === document.id}
                        aria-label={`Tải xuống ${document.fileName}`}
                        onClick={() => {
                          void downloadDocument(document);
                        }}
                      >
                        Tải xuống
                      </Button>
                    ) : (
                      <p className={styles.documents__restricted}>
                        Mock ẩn nút tải xuống. Không phải phân quyền Backend.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Drawer>
  );
};
