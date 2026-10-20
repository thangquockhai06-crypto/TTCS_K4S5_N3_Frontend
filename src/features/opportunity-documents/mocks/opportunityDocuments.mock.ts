import { IOpportunityDocument } from '../types/OpportunityDocuments.types';

export const MOCK_OPPORTUNITY_DOCUMENTS_WARNING =
  'MOCK MODE — dữ liệu giả, không đại diện cho dữ liệu thật của team. Tệp không được lưu trên Backend.';

interface IMockDocumentRecord {
  document: IOpportunityDocument;
  blob: Blob;
}

const mockRecords = new Map<string, IMockDocumentRecord>();

const SEED_DOCUMENTS: ReadonlyArray<{
  document: IOpportunityDocument;
  content: string;
}> = [
  {
    document: {
      id: 'mock-doc-seed-01',
      opportunityId: 'deal-101',
      fileName: 'Ho-so-thau-ky-thuat-Mistral-Enterprise.pdf',
      sizeBytes: 2450000,
      contentType: 'application/pdf',
      uploadedByName: 'Nguyễn Văn An (Account Executive)',
      uploadedAt: '2026-10-15T09:30:00.000Z',
      canDownload: true,
    },
    content: '%PDF-1.4 Mock technical bid document for Mistral Enterprise...',
  },
  {
    document: {
      id: 'mock-doc-seed-02',
      opportunityId: 'deal-101',
      fileName: 'Bien-ban-hop-thuong-thao-hop-dong.docx',
      sizeBytes: 462000,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedByName: 'Trần Thị Bích (Sales Manager)',
      uploadedAt: '2026-10-18T14:15:00.000Z',
      canDownload: true,
    },
    content: 'Mock meeting minutes for contract negotiation 2026...',
  },
  {
    document: {
      id: 'mock-doc-seed-03',
      opportunityId: 'deal-101',
      fileName: 'restricted-Phu-luc-dieu-khoan-bao-mat-NDA.pdf',
      sizeBytes: 1150000,
      contentType: 'application/pdf',
      uploadedByName: 'Lê Hoàng Long (Legal Counsel)',
      uploadedAt: '2026-10-19T10:00:00.000Z',
      canDownload: false,
    },
    content: '%PDF-1.4 Mock confidential NDA addendum...',
  },
];

for (const seed of SEED_DOCUMENTS) {
  mockRecords.set(seed.document.id, {
    document: seed.document,
    blob: new Blob([seed.content], { type: seed.document.contentType }),
  });
}

export function listMockDocumentRecords(
  opportunityId: string
): IOpportunityDocument[] {
  return Array.from(mockRecords.values())
    .map((record) => record.document)
    .filter((document) => document.opportunityId === opportunityId);
}

export function getMockDocumentRecord(documentId: string): IMockDocumentRecord | undefined {
  return mockRecords.get(documentId);
}

export function saveMockDocumentRecord(record: IMockDocumentRecord): void {
  mockRecords.set(record.document.id, record);
}

