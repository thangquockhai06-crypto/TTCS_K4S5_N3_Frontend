import {
  getMockDocumentRecord,
  listMockDocumentRecords,
  saveMockDocumentRecord,
} from '../mocks/opportunityDocuments.mock';
import {
  IOpportunityDocument,
  IOpportunityDocumentsService,
  IOpportunityDocumentUploadRequest,
  OpportunityDocumentsError,
} from '../types/OpportunityDocuments.types';

/**
 * Frontend chưa tìm thấy service/API tài liệu cơ hội.
 * true = mock bộ nhớ phiên làm việc; false = báo chưa có hợp đồng API (không bịa endpoint).
 */
export const USE_MOCK_OPPORTUNITY_DOCUMENTS = true;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createDocumentId(): string {
  return `mock-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class MockOpportunityDocumentsService implements IOpportunityDocumentsService {
  async list(opportunityId: string): Promise<IOpportunityDocument[]> {
    await wait(180);

    if (opportunityId.toLowerCase().includes('network-error')) {
      throw new OpportunityDocumentsError(
        'NETWORK',
        'Không thể tải danh sách tài liệu (mô phỏng lỗi mạng). Tệp không được đọc từ Backend.'
      );
    }

    return listMockDocumentRecords(opportunityId);
  }

  async upload(request: IOpportunityDocumentUploadRequest): Promise<IOpportunityDocument> {
    await wait(220);

    const fileName = request.file.name;
    const lowered = fileName.toLowerCase();

    if (lowered.includes('network-error')) {
      throw new OpportunityDocumentsError(
        'NETWORK',
        `"${fileName}" không tải lên được vì lỗi mạng mô phỏng. Các tệp khác không bị hủy.`
      );
    }

    if (lowered.includes('forbidden')) {
      throw new OpportunityDocumentsError(
        'FORBIDDEN',
        `"${fileName}" bị từ chối (mô phỏng phản hồi không đủ quyền). Đây không phải phân quyền Backend thật.`
      );
    }

    const document: IOpportunityDocument = {
      id: createDocumentId(),
      opportunityId: request.opportunityId,
      fileName,
      sizeBytes: request.file.size,
      contentType: request.file.type || 'application/octet-stream',
      uploadedByName: request.uploadedByName,
      uploadedAt: new Date().toISOString(),
      canDownload: !lowered.startsWith('restricted-'),
    };

    saveMockDocumentRecord({
      document,
      blob: request.file.slice(0, request.file.size, document.contentType),
    });

    return document;
  }

  async download(documentId: string): Promise<Blob> {
    await wait(120);

    const record = getMockDocumentRecord(documentId);
    if (!record) {
      throw new OpportunityDocumentsError(
        'NOT_FOUND',
        'Không tìm thấy tài liệu trong bộ nhớ mock của phiên này.'
      );
    }

    if (!record.document.canDownload) {
      throw new OpportunityDocumentsError(
        'FORBIDDEN',
        'Nút tải xuống được ẩn theo cờ minh họa từ mock. Đây không phải cơ chế bảo mật thật.'
      );
    }

    return record.blob;
  }
}

class UnconfiguredOpportunityDocumentsApiService implements IOpportunityDocumentsService {
  async list(): Promise<IOpportunityDocument[]> {
    throw new OpportunityDocumentsError(
      'API_UNAVAILABLE',
      'Chưa có hợp đồng API tài liệu cơ hội được xác nhận. Không gọi endpoint tự phát minh.'
    );
  }

  async upload(): Promise<IOpportunityDocument> {
    throw new OpportunityDocumentsError(
      'API_UNAVAILABLE',
      'Chưa có hợp đồng API tải lên tài liệu cơ hội. Không gửi tệp tới Backend.'
    );
  }

  async download(): Promise<Blob> {
    throw new OpportunityDocumentsError(
      'API_UNAVAILABLE',
      'Chưa có hợp đồng API tải xuống tài liệu cơ hội.'
    );
  }
}

export const opportunityDocumentsService: IOpportunityDocumentsService =
  USE_MOCK_OPPORTUNITY_DOCUMENTS
    ? new MockOpportunityDocumentsService()
    : new UnconfiguredOpportunityDocumentsApiService();
