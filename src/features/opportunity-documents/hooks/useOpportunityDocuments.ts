import { useCallback, useEffect, useState } from 'react';
import { opportunityDocumentsService } from '../services/OpportunityDocumentsService';
import {
  IOpportunityDocument,
  IOpportunityDocumentUploadResult,
} from '../types/OpportunityDocuments.types';
import {
  getOpportunityDocumentsErrorCode,
  getOpportunityDocumentsErrorMessage,
  sortDocumentsNewestFirst,
  validateOpportunityDocumentFile,
} from '../utils/opportunityDocuments';

export interface IUseOpportunityDocumentsResult {
  documents: IOpportunityDocument[];
  isLoading: boolean;
  isUploading: boolean;
  downloadingId: string | null;
  error: string | null;
  uploadResults: IOpportunityDocumentUploadResult[];
  retry: () => void;
  uploadFiles: (files: FileList | File[], uploadedByName: string) => Promise<void>;
  downloadDocument: (document: IOpportunityDocument) => Promise<void>;
  clearUploadResults: () => void;
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.rel = 'noopener';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function useOpportunityDocuments(
  opportunityId: string | null,
  enabled: boolean
): IUseOpportunityDocumentsResult {
  const [documents, setDocuments] = useState<IOpportunityDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<IOpportunityDocumentUploadResult[]>([]);
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback((): void => {
    setRequestNumber((current) => current + 1);
  }, []);

  const clearUploadResults = useCallback((): void => {
    setUploadResults([]);
  }, []);

  useEffect(() => {
    if (!enabled || !opportunityId) {
      setDocuments([]);
      setIsLoading(false);
      setError(null);
      setUploadResults([]);
      return;
    }

    let isCurrentRequest = true;
    setDocuments([]);
    setIsLoading(true);
    setError(null);

    opportunityDocumentsService
      .list(opportunityId)
      .then((items) => {
        if (isCurrentRequest) {
          setDocuments(sortDocumentsNewestFirst(items));
        }
      })
      .catch((requestError: unknown) => {
        if (isCurrentRequest) {
          setError(getOpportunityDocumentsErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [enabled, opportunityId, requestNumber]);

  const uploadFiles = useCallback(
    async (files: FileList | File[], uploadedByName: string): Promise<void> => {
      if (!opportunityId) {
        return;
      }

      const selectedFiles = Array.from(files);
      if (selectedFiles.length === 0) {
        return;
      }

      setIsUploading(true);
      const results: IOpportunityDocumentUploadResult[] = [];

      for (const file of selectedFiles) {
        const validationError = validateOpportunityDocumentFile(file);
        if (validationError) {
          results.push({
            status: 'failure',
            fileName: file.name,
            code: validationError.code,
            message: validationError.message,
          });
          continue;
        }

        try {
          const document = await opportunityDocumentsService.upload({
            opportunityId,
            file,
            uploadedByName,
          });
          results.push({
            status: 'success',
            fileName: file.name,
            document,
          });
          setDocuments((current) => sortDocumentsNewestFirst([document, ...current]));
        } catch (uploadError: unknown) {
          results.push({
            status: 'failure',
            fileName: file.name,
            code: getOpportunityDocumentsErrorCode(uploadError),
            message: getOpportunityDocumentsErrorMessage(uploadError),
          });
        }
      }

      setUploadResults(results);
      setIsUploading(false);
    },
    [opportunityId]
  );

  const downloadDocument = useCallback(
    async (document: IOpportunityDocument): Promise<void> => {
      setDownloadingId(document.id);
      setError(null);

      try {
        const blob = await opportunityDocumentsService.download(document.id);
        triggerBrowserDownload(blob, document.fileName);
      } catch (downloadError: unknown) {
        setError(getOpportunityDocumentsErrorMessage(downloadError));
      } finally {
        setDownloadingId(null);
      }
    },
    []
  );

  return {
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
  };
}
