import { useCallback, useState } from 'react';
import {
  BulkImportStep,
  DuplicateActionType,
  IBulkImportResult,
  IBulkImportRow,
  IBulkImportStats,
} from '../interfaces/bulk-import.interface';
import {
  computeStats,
  downloadTemplateCsv,
  executeImport,
  parseAndValidateFile,
} from '../services/bulkImportService';
import { useCRMData } from '../context/CRMDataContext';

export interface IUseBulkImportReturn {
  /** Bước wizard hiện tại */
  step: BulkImportStep;
  /** File người dùng đã chọn */
  selectedFile: File | null;
  /** Mảng dòng đã parse và validate */
  rows: IBulkImportRow[];
  /** Thống kê phân tích */
  stats: IBulkImportStats;
  /** Đang xử lý file (loading) */
  isParsing: boolean;
  /** Đang thực thi nhập */
  isImporting: boolean;
  /** Lỗi tổng thể (ví dụ: file không đúng định dạng) */
  globalError: string | null;
  /** Kết quả sau khi nhập xong */
  result: IBulkImportResult | null;
  /** Xử lý khi người dùng chọn file */
  handleFileSelect: (file: File) => Promise<void>;
  /** Xóa file đã chọn, quay lại bước upload */
  handleClearFile: () => void;
  /** Thay đổi hành động xử lý trùng lặp cho một dòng */
  handleDuplicateAction: (rowIndex: number, action: DuplicateActionType) => void;
  /** Tải file mẫu CSV */
  handleDownloadTemplate: () => void;
  /** Bắt đầu thực thi nhập */
  handleConfirmImport: () => void;
  /** Đặt lại toàn bộ flow (import thêm) */
  handleReset: () => void;
}

const EMPTY_STATS: IBulkImportStats = { total: 0, valid: 0, duplicates: 0, errors: 0 };
const ACCEPTED_MIME = ['text/csv', 'application/vnd.ms-excel', 'text/plain', ''];

export function useBulkImport(): IUseBulkImportReturn {
  const { customers, addCustomer } = useCRMData();

  const [step, setStep] = useState<BulkImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<IBulkImportRow[]>([]);
  const [stats, setStats] = useState<IBulkImportStats>(EMPTY_STATS);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [result, setResult] = useState<IBulkImportResult | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'txt'].includes(ext ?? '') && !ACCEPTED_MIME.includes(file.type)) {
        setGlobalError('Vui lòng chọn file định dạng CSV (.csv). Bạn có thể lưu file Excel dưới dạng CSV từ menu File → Lưu dưới dạng.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setGlobalError('File quá lớn (tối đa 5MB). Vui lòng chia nhỏ file và nhập nhiều lần.');
        return;
      }

      setGlobalError(null);
      setSelectedFile(file);
      setIsParsing(true);

      try {
        const parsed = await parseAndValidateFile(file, customers);
        if (parsed.length === 0) {
          setGlobalError('File không chứa dữ liệu nào. Vui lòng kiểm tra lại định dạng CSV và thử lại.');
          setSelectedFile(null);
          return;
        }
        setRows(parsed);
        setStats(computeStats(parsed));
        setStep('preview');
      } catch {
        setGlobalError('Không thể đọc file. Vui lòng kiểm tra định dạng và thử lại.');
        setSelectedFile(null);
      } finally {
        setIsParsing(false);
      }
    },
    [customers]
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setRows([]);
    setStats(EMPTY_STATS);
    setGlobalError(null);
    setStep('upload');
  }, []);

  const handleDuplicateAction = useCallback(
    (rowIndex: number, action: DuplicateActionType) => {
      setRows((prev) =>
        prev.map((r) => (r.rowIndex === rowIndex ? { ...r, duplicateAction: action } : r))
      );
    },
    []
  );

  const handleDownloadTemplate = useCallback(() => {
    downloadTemplateCsv();
  }, []);

  const handleConfirmImport = useCallback(() => {
    setIsImporting(true);
    try {
      const importResult = executeImport(rows, addCustomer);
      setResult(importResult);
      setStep('result');
    } finally {
      setIsImporting(false);
    }
  }, [rows, addCustomer]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setRows([]);
    setStats(EMPTY_STATS);
    setGlobalError(null);
    setResult(null);
  }, []);

  return {
    step,
    selectedFile,
    rows,
    stats,
    isParsing,
    isImporting,
    globalError,
    result,
    handleFileSelect,
    handleClearFile,
    handleDuplicateAction,
    handleDownloadTemplate,
    handleConfirmImport,
    handleReset,
  };
}
