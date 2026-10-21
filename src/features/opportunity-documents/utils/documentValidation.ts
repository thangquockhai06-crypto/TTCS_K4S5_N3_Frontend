import { TDocumentFileValidationResult } from '../types/OpportunityDocument.types';

export const MAX_OPPORTUNITY_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

export function validateDocumentFile(file: unknown): TDocumentFileValidationResult {
  if (typeof file !== 'object' || file === null || !('name' in file) || !('size' in file)) {
    return { isValid: false, errorCode: 'invalid-file' };
  }

  const fileName = file.name;
  const fileSize = file.size;
  const mimeType = 'type' in file ? file.type : undefined;

  if (
    typeof fileName !== 'string' ||
    fileName.trim().length === 0 ||
    typeof fileSize !== 'number' ||
    !Number.isInteger(fileSize) ||
    fileSize < 0 ||
    (mimeType !== undefined && typeof mimeType !== 'string')
  ) {
    return { isValid: false, errorCode: 'invalid-file' };
  }

  if (fileSize === 0) {
    return { isValid: false, errorCode: 'empty-file' };
  }

  if (fileSize > MAX_OPPORTUNITY_DOCUMENT_SIZE_BYTES) {
    return { isValid: false, errorCode: 'file-too-large' };
  }

  return {
    isValid: true,
    fileName,
    fileSize,
    ...(typeof mimeType === 'string' ? { mimeType } : {}),
  };
}

export function validateDocumentFiles(
  files: ReadonlyArray<unknown>
): TDocumentFileValidationResult[] {
  return files.map(validateDocumentFile);
}
