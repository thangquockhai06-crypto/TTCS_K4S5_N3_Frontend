export const MAX_OPPORTUNITY_DOCUMENT_BYTES = 20 * 1024 * 1024;

export const OPPORTUNITY_DOCUMENT_ALLOWED_EXTENSIONS: ReadonlyArray<string> = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
];

export type OpportunityDocumentsErrorCode =
  | 'VALIDATION'
  | 'NETWORK'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'API_UNAVAILABLE'
  | 'UNKNOWN';

export interface IOpportunityDocument {
  id: string;
  opportunityId: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
  uploadedByName: string;
  uploadedAt: string;
  canDownload: boolean;
}

export interface IOpportunityDocumentUploadRequest {
  opportunityId: string;
  file: File;
  uploadedByName: string;
}

export interface IOpportunityDocumentUploadSuccess {
  status: 'success';
  fileName: string;
  document: IOpportunityDocument;
}

export interface IOpportunityDocumentUploadFailure {
  status: 'failure';
  fileName: string;
  code: OpportunityDocumentsErrorCode;
  message: string;
}

export type IOpportunityDocumentUploadResult =
  | IOpportunityDocumentUploadSuccess
  | IOpportunityDocumentUploadFailure;

export interface IOpportunityDocumentsService {
  list(opportunityId: string): Promise<IOpportunityDocument[]>;
  upload(request: IOpportunityDocumentUploadRequest): Promise<IOpportunityDocument>;
  download(documentId: string): Promise<Blob>;
}

export class OpportunityDocumentsError extends Error {
  readonly code: OpportunityDocumentsErrorCode;

  constructor(code: OpportunityDocumentsErrorCode, message: string) {
    super(message);
    this.name = 'OpportunityDocumentsError';
    this.code = code;
  }
}
