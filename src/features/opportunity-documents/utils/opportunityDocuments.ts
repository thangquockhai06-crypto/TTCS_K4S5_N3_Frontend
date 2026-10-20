import {
  IOpportunityDocument,
  MAX_OPPORTUNITY_DOCUMENT_BYTES,
  OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS,
  OpportunityDocumentsError,
} from '../types/OpportunityDocuments.types';

export function formatDocumentSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDocumentTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Không rõ thời điểm';
  }

  return parsed.toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return '';
  }

  return fileName.slice(lastDot).toLowerCase();
}

export function isAllowedDocumentExtension(fileName: string): boolean {
  return OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS.includes(getFileExtension(fileName));
}

export function validateOpportunityDocumentFile(file: File): OpportunityDocumentsError | null {
  if (file.size <= 0) {
    return new OpportunityDocumentsError(
      'VALIDATION',
      `"${file.name}" không có nội dung.`
    );
  }

  if (file.size > MAX_OPPORTUNITY_DOCUMENT_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return new OpportunityDocumentsError(
      'VALIDATION',
      `"${file.name}" (${sizeMb} MB) vượt giới hạn 20 MB/tệp. Giả định Frontend: 20 × 1024 × 1024 byte.`
    );
  }

  if (!isAllowedDocumentExtension(file.name)) {
    const allowed = OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS.join(', ');
    return new OpportunityDocumentsError(
      'VALIDATION',
      `"${file.name}" không thuộc định dạng được phép (${allowed}).`
    );
  }

  return null;
}

export function sortDocumentsNewestFirst(
  documents: ReadonlyArray<IOpportunityDocument>
): IOpportunityDocument[] {
  return [...documents].sort((left, right) => {
    const leftTime = Date.parse(left.uploadedAt);
    const rightTime = Date.parse(right.uploadedAt);
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return safeRight - safeLeft;
  });
}

export function getOpportunityDocumentsErrorMessage(error: unknown): string {
  if (error instanceof OpportunityDocumentsError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Không thể hoàn tất thao tác tài liệu. Kiểm tra kết nối mạng và thử lại.';
}

export function getOpportunityDocumentsErrorCode(
  error: unknown
): OpportunityDocumentsError['code'] {
  if (error instanceof OpportunityDocumentsError) {
    return error.code;
  }

  return 'UNKNOWN';
}
