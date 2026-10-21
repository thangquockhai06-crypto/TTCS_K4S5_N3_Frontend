export interface IOpportunityDocumentAccess {
  canView: boolean;
  canDownload: boolean;
  canDelete: boolean;
}

export interface IOpportunityDocumentMetadata {
  id: string;
  opportunityId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: string;
  access: IOpportunityDocumentAccess;
}

export interface IOpportunityDocumentUploadRequest {
  opportunityId: string;
  files: ReadonlyArray<File>;
}

export type TOpportunityDocumentsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface IOpportunityDocumentsState {
  status: TOpportunityDocumentsStatus;
  documents: ReadonlyArray<IOpportunityDocumentMetadata>;
  errorMessage: string | null;
}

export type TDocumentValidationErrorCode =
  | 'invalid-file'
  | 'empty-file'
  | 'file-too-large';

export type TDocumentFileValidationResult =
  | {
      isValid: true;
      fileName: string;
      fileSize: number;
      mimeType?: string;
    }
  | {
      isValid: false;
      errorCode: TDocumentValidationErrorCode;
    };
