import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  Search,
  History,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  Clock,
} from 'lucide-react';
import { ExcelUploadZone } from '../components/users/ExcelUploadZone';
import { PreviewDataGrid, ImportFilterType } from '../components/users/PreviewDataGrid';
import { ImportUserSearchPanel } from '../components/users/ImportUserSearchPanel';
import { ImportProgressMonitor } from '../components/users/ImportProgressMonitor';
import { ImportJobHistoryPanel } from '../components/users/ImportJobHistoryPanel';
import { IExcelImportUserRow } from '../interfaces';
import { userImportService, IUserImportPreviewRow, IUserImportJob } from '../services/userImportService';
import { showGlobalToast } from '../context/ToastContext';
import styles from './CustomerCreatePage.module.css';

export const UserImportPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation tab: 'import' | 'search' | 'history'
  const [activeTab, setActiveTab] = useState<'import' | 'search' | 'history'>('import');

  // Import state
  const [rows, setRows] = useState<IExcelImportUserRow[]>([]);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [serverDetails, setServerDetails] = useState<IUserImportPreviewRow[] | undefined>(undefined);
  const [filterType, setFilterType] = useState<ImportFilterType>('all');
  const [batchSize, setBatchSize] = useState<number>(500);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Job ID for progress monitor
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<IUserImportJob | null>(null);

  // Danh sách email trong file để đối soát nhanh với tab tra cứu
  const uploadedEmailSet = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.email) set.add(r.email.trim().toLowerCase());
    });
    return set;
  }, [rows]);

  // Lọc số dòng hợp lệ
  const validRows = useMemo(() => {
    if (serverDetails && serverDetails.length === rows.length) {
      return rows.filter((_, idx) => serverDetails[idx].status === 'VALID');
    }
    return rows.filter((r) => {
      const cleanName = (r.name || '').trim();
      const cleanEmail = (r.email || '').trim().toLowerCase();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
      return cleanName && emailOk;
    });
  }, [rows, serverDetails]);

  const handleDataParsed = (
    parsedRows: IExcelImportUserRow[],
    file?: File,
    details?: IUserImportPreviewRow[]
  ) => {
    setRows(parsedRows);
    setRawFile(file || null);
    setServerDetails(details);
    setErrorMsg(null);
    setFilterType('all');
  };

  const handleStartImport = async () => {
    if (validRows.length === 0) {
      setErrorMsg('Không có dòng dữ liệu nào hợp lệ để nhập vào hệ thống.');
      showGlobalToast('Không có dòng dữ liệu hợp lệ để nhập', 'warning');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let createdJob: IUserImportJob;
      if (rawFile) {
        createdJob = await userImportService.startImportJob(rawFile, batchSize);
      } else {
        createdJob = await userImportService.startImportJobFromRows(validRows, batchSize);
      }

      setActiveJobId(createdJob.id);
      setActiveJob(createdJob);
      showGlobalToast(
        `Đã khởi tạo tiến trình nhập ${createdJob.total_rows} người dùng theo lô!`,
        'success'
      );
    } catch (err: any) {
      const text =
        err.response?.data?.detail || err.message || 'Lỗi khi khởi tạo tiến trình nhập.';
      setErrorMsg(typeof text === 'string' ? text : JSON.stringify(text));
      showGlobalToast(typeof text === 'string' ? text : 'Lỗi khi khởi tạo tiến trình nhập', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRows([]);
    setRawFile(null);
    setServerDetails(undefined);
    setActiveJobId(null);
    setActiveJob(null);
    setErrorMsg(null);
    setFilterType('all');
  };

  return (
    <div className={styles.container}>
      {/* Nút quay lại danh sách người dùng */}
      <button
        type="button"
        onClick={() => navigate('/users')}
        className={styles.backBtn}
        aria-label="Quay lại quản lý người dùng"
      >
        <ArrowLeft size={16} />
        <span>Trở về danh sách người dùng</span>
      </button>

      {/* Header chuẩn hóa */}
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md, 12px)',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <h1 className={styles.title}>Nhập Danh Sách Người Dùng từ Excel / CSV</h1>
            <p className={styles.subtitle}>
              Khởi tạo và phân quyền hàng loạt tài khoản nhân sự với cơ chế xử lý theo lô an toàn (Batch Processing)
            </p>
          </div>
        </div>
      </header>

      {/* Banner thông báo tiến trình nền đang hoạt động nếu người dùng chuyển tab */}
      {activeJobId && activeTab !== 'import' && (
        <div
          onClick={() => setActiveTab('import')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-sm, 8px)',
            color: '#1e40af',
            fontSize: '0.88rem',
            marginBottom: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} className="spin" />
            <span>
              Một tiến trình nhập hàng loạt đang chạy ngầm trên máy chủ (Mã: <code>{activeJobId.slice(0, 8)}</code>). Bấm để xem tiến độ.
            </span>
          </div>
          <span style={{ fontWeight: 600, textDecoration: 'underline' }}>Xem tiến trình &rarr;</span>
        </div>
      )}

      {/* Tabs điều hướng phân hệ chức năng */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          paddingBottom: '10px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm, 8px)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'import' ? 'var(--color-primary, #2563eb)' : '#f1f5f9',
            color: activeTab === 'import' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          <FileSpreadsheet size={16} />
          <span>Tải lên &amp; Xem trước dữ liệu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm, 8px)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'search' ? 'var(--color-primary, #2563eb)' : '#f1f5f9',
            color: activeTab === 'search' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          <Search size={16} />
          <span>Tra cứu người dùng hiện có</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm, 8px)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'history' ? 'var(--color-primary, #2563eb)' : '#f1f5f9',
            color: activeTab === 'history' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          <History size={16} />
          <span>Lịch sử các đợt nhập</span>
        </button>
      </div>

      {/* Thông báo lỗi tổng quát */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm, 8px)',
            color: '#b91c1c',
            fontSize: '0.88rem',
            marginBottom: 20,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: NHẬP DỮ LIỆU & TIẾN TRÌNH */}
      {activeTab === 'import' && (
        <div>
          {activeJobId ? (
            <ImportProgressMonitor
              jobId={activeJobId}
              initialJob={activeJob || undefined}
              onReset={handleReset}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Vùng tải lên tệp */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md, 12px)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  padding: 24,
                  boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.05))',
                }}
              >
                <ExcelUploadZone onDataParsed={handleDataParsed} disabled={isSubmitting} />
              </div>

              {/* Vùng xem trước & Tùy chọn cấu hình lô (Batch size) */}
              {rows.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: '1px solid var(--color-border, #e2e8f0)',
                    padding: 24,
                    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.05))',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                        Xem trước &amp; Xác nhận danh sách ({rows.length} dòng dữ liệu)
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Kiểm tra phân loại người dùng mới, trùng lặp và lỗi trước khi khởi tạo tiến trình nhập
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {/* Chọn kích thước lô xử lý */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '0.82rem',
                        }}
                      >
                        <Sliders size={14} style={{ color: '#64748b' }} />
                        <span>Kích thước lô:</span>
                        <select
                          value={batchSize}
                          onChange={(e) => setBatchSize(Number(e.target.value))}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontWeight: 600,
                            color: '#0f172a',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                          aria-label="Kích thước lô xử lý"
                        >
                          <option value={100}>100 dòng / lô</option>
                          <option value={250}>250 dòng / lô</option>
                          <option value={500}>500 dòng / lô (khuyên dùng)</option>
                          <option value={1000}>1,000 dòng / lô</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Chọn tệp khác</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartImport}
                        disabled={isSubmitting || validRows.length === 0}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 22px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: validRows.length > 0 ? '#2563eb' : '#94a3b8',
                          color: '#ffffff',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: validRows.length > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        <Play size={15} />
                        <span>Tiến hành nhập ({validRows.length} dòng hợp lệ)</span>
                      </button>
                    </div>
                  </div>

                  <PreviewDataGrid
                    rows={rows}
                    filterType={filterType}
                    onFilterChange={setFilterType}
                    serverDetails={serverDetails}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRA CỨU NGƯỜI DÙNG TRONG HỆ THỐNG */}
      {activeTab === 'search' && (
        <ImportUserSearchPanel uploadedEmails={uploadedEmailSet} />
      )}

      {/* TAB 3: LỊCH SỬ CÁC ĐỢT NHẬP */}
      {activeTab === 'history' && (
        <ImportJobHistoryPanel
          onSelectJob={(j) => {
            setActiveJobId(j.id);
            setActiveJob(j);
            setActiveTab('import');
          }}
        />
      )}
    </div>
  );
};
