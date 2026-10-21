import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileDown, FileText, RefreshCw, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card } from '../components/common';
import { IContract, IQuotation } from '../interfaces';
import { salesDocumentService } from '../services/salesDocumentService';
import styles from './DocumentExportsPage.module.css';

type DocumentTab = 'quotation' | 'contract';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const DocumentExportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('type') === 'contract' ? 'contract' : 'quotation';
  const selectedId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState<DocumentTab>(initialTab);
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [contracts, setContracts] = useState<IContract[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const [printableHtml, setPrintableHtml] = useState<string | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextQuotations, nextContracts] = await Promise.all([
        salesDocumentService.getQuotations(),
        salesDocumentService.getContracts(),
      ]);
      setQuotations(nextQuotations);
      setContracts(nextContracts);
    } catch (loadError) {
      console.error('Không thể tải danh sách báo giá và hợp đồng.', loadError);
      setError('Không thể tải danh sách tài liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const requestedTab: DocumentTab =
      searchParams.get('type') === 'contract' ? 'contract' : 'quotation';
    setActiveTab(requestedTab);
  }, [searchParams]);

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return quotations.filter((item) =>
      `${item.quoteNumber} ${item.title} ${item.customerCompany ?? ''} ${item.customerName ?? ''}`
        .toLocaleLowerCase('vi')
        .includes(query)
    );
  }, [quotations, search]);

  const filteredContracts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return contracts.filter((item) =>
      `${item.contractNumber} ${item.title} ${item.customerCompany ?? ''} ${item.customerName ?? ''}`
        .toLocaleLowerCase('vi')
        .includes(query)
    );
  }, [contracts, search]);

  const openPrintableDocument = async (
    type: DocumentTab,
    id: string,
    templateId: string | null
  ): Promise<void> => {
    setLoadingDocumentId(id);
    setError(null);

    try {
      const html = await salesDocumentService.getPrintableDocument(
        type,
        id,
        templateId ?? undefined
      );
      setPrintableHtml(html);
    } catch (exportError) {
      console.error('Không thể tạo bản in tài liệu.', exportError);
      setError('Không thể tạo bản in. Vui lòng thử lại hoặc kiểm tra kết nối máy chủ.');
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const changeTab = (tab: DocumentTab): void => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Báo giá & Hợp đồng</h1>
          <p className={styles.subtitle}>
            Mở bản in theo mẫu công ty đã cấu hình và lưu thành PDF từ hộp thoại in.
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw size={15} />}
          onClick={() => void loadDocuments()}
          isLoading={isLoading}
        >
          Tải lại
        </Button>
      </header>

      <Card padding="lg" className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Loại tài liệu">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'quotation'}
              className={activeTab === 'quotation' ? styles.tabActive : styles.tab}
              onClick={() => changeTab('quotation')}
            >
              Báo giá ({quotations.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'contract'}
              className={activeTab === 'contract' ? styles.tabActive : styles.tab}
              onClick={() => changeTab('contract')}
            >
              Hợp đồng ({contracts.length})
            </button>
          </div>
          <label className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Tìm tài liệu</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã, tiêu đề, khách hàng..."
            />
          </label>
        </div>

        {isLoading ? (
          <p className={styles.message}>Đang tải danh sách tài liệu...</p>
        ) : error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : activeTab === 'quotation' ? (
          filteredQuotations.length === 0 ? (
            <p className={styles.message}>Không tìm thấy báo giá nào.</p>
          ) : (
            <div className={styles.list}>
              {filteredQuotations.map((item) => (
                <article
                  key={item.id}
                  className={`${styles.row} ${selectedId === item.id ? styles.rowSelected : ''}`}
                >
                  <div className={styles.documentIcon}><FileText size={18} /></div>
                  <div className={styles.documentInfo}>
                    <strong>{item.quoteNumber} · {item.title}</strong>
                    <span>{item.customerCompany || item.customerName || 'Chưa có khách hàng'}</span>
                  </div>
                  <div className={styles.documentMeta}>
                    <strong>{formatCurrency(item.grandTotal)}</strong>
                    <span>{item.status}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileDown size={15} />}
                    isLoading={loadingDocumentId === item.id}
                    disabled={loadingDocumentId !== null}
                    onClick={() => void openPrintableDocument('quotation', item.id, item.templateId)}
                  >
                    In / PDF
                  </Button>
                </article>
              ))}
            </div>
          )
        ) : filteredContracts.length === 0 ? (
          <p className={styles.message}>Không tìm thấy hợp đồng nào.</p>
        ) : (
          <div className={styles.list}>
            {filteredContracts.map((item) => (
              <article
                key={item.id}
                className={`${styles.row} ${selectedId === item.id ? styles.rowSelected : ''}`}
              >
                <div className={styles.documentIcon}><FileText size={18} /></div>
                <div className={styles.documentInfo}>
                  <strong>{item.contractNumber} · {item.title}</strong>
                  <span>{item.customerCompany || item.customerName || 'Chưa có khách hàng'}</span>
                </div>
                <div className={styles.documentMeta}>
                  <strong>{formatCurrency(item.totalValue)}</strong>
                  <span>{item.status}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileDown size={15} />}
                  isLoading={loadingDocumentId === item.id}
                  disabled={loadingDocumentId !== null}
                  onClick={() => void openPrintableDocument('contract', item.id, item.templateId)}
                >
                  In / PDF
                </Button>
              </article>
            ))}
          </div>
        )}
      </Card>

      {printableHtml && (
        <div className={styles.previewBackdrop} role="presentation">
          <section
            className={styles.previewDialog}
            role="dialog"
            aria-modal="true"
            aria-label="Xem trước tài liệu in"
          >
            <header className={styles.previewHeader}>
              <p>Xem trước tài liệu · Chọn “Lưu dưới dạng PDF” trong hộp thoại in.</p>
              <div className={styles.previewActions}>
                <Button
                  leftIcon={<FileDown size={15} />}
                  onClick={() => printFrameRef.current?.contentWindow?.print()}
                >
                  In / Lưu PDF
                </Button>
                <button
                  type="button"
                  className={styles.closePreview}
                  onClick={() => setPrintableHtml(null)}
                  aria-label="Đóng bản xem trước"
                >
                  <X size={19} />
                </button>
              </div>
            </header>
            <iframe
              ref={printFrameRef}
              className={styles.previewFrame}
              title="Bản xem trước báo giá hoặc hợp đồng"
              sandbox="allow-same-origin allow-modals"
              srcDoc={printableHtml}
            />
          </section>
        </div>
      )}
    </section>
  );
};
