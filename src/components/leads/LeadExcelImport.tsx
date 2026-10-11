import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button, Modal, Badge, Input } from '../common';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';
import { useLeadCapture } from '../../hooks/useLeadCapture';
import { useToast } from '../../context/ToastContext';
import {
  ICreateManualLeadDTO,
  IExcelLeadRow,
  LeadInterestType,
  IWebFormItem,
} from '../../interfaces/lead-capture.interface';
import styles from './LeadExcelImport.module.css';

export interface ILeadExcelImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentFormId?: string;
  forms?: IWebFormItem[];
}

// 2 minimal sample template rows for CSV
const CSV_SAMPLE_HEADER = 'Họ và tên,Chức danh,Công ty,Email,Số điện thoại,Nguồn Lead,Nhu cầu quan tâm,Ghi chú';
const CSV_SAMPLE_ROWS = [
  'Đặng Tuấn Anh,Giám đốc Vận hành,Công ty TNHH Vận Tải An Nam,tuananh.dang@annamlogistics.vn,0934567890,Hội thảo Logistics Tech 2026,enterprise_pricing,Gặp tại sự kiện sáng 10/10',
  'Ngô Mỹ Duyên,Trưởng phòng Kinh doanh,Tập đoàn Bất động sản Địa Ốc Xanh,duyen.ngo@diaocxanh.vn,0987654321,Triển lãm VietBuild 2026,crm_consultation,Quan tâm quản lý giỏ hàng và khách hàng tiềm năng',
];

export const LeadExcelImport: React.FC<ILeadExcelImportProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentFormId,
  forms = [],
}) => {
  const { batchImportLeads } = useLeadCapture();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form selection & configuration state
  const [selectedTargetFormId, setSelectedTargetFormId] = useState<string>(
    currentFormId || (forms.length > 0 ? forms[0].id : 'form-web-01')
  );

  useEffect(() => {
    if (isOpen && currentFormId) {
      setSelectedTargetFormId(currentFormId);
    }
  }, [isOpen, currentFormId]);

  const [defaultSourceInput, setDefaultSourceInput] = useState<string>('Chiến Dịch Hội Thảo TechExpo 2026');

  // Rows & Upload state
  const [rows, setRows] = useState<IExcelLeadRow[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'error'>('all');

  // Form options
  const formOptions: ICustomSelectOption<string>[] = useMemo(() => {
    if (forms.length === 0) {
      return [
        { value: 'form-web-01', label: 'Thu thập khách hàng tiềm năng Q2' },
        { value: 'form-web-02', label: '[QA agent] map custom field' },
      ];
    }
    return forms.map((f) => ({
      value: f.id,
      label: `${f.title} (${f.type})`,
    }));
  }, [forms]);

  const activeTargetForm = useMemo(() => {
    return forms.find((f) => f.id === selectedTargetFormId) || null;
  }, [forms, selectedTargetFormId]);

  // Validate single row
  const validateRow = (
    fullName: string,
    company: string,
    email: string,
    phone: string,
    leadSource: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!leadSource || !leadSource.trim()) {
      errors.push('Thiếu nguồn Lead');
    }

    if (!fullName || !fullName.trim() || fullName.trim().length < 2) {
      errors.push('Thiếu họ và tên');
    }

    if (!company || !company.trim()) {
      errors.push('Thiếu tên công ty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      errors.push('Thiếu email');
    } else if (!emailRegex.test(email.trim())) {
      errors.push('Sai định dạng email');
    }

    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!phone || !phone.trim()) {
      errors.push('Thiếu số điện thoại');
    } else if (!phoneRegex.test(phone.trim())) {
      errors.push('Sai định dạng SĐT (9-15 số)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Download Sample CSV template
  const handleDownloadTemplate = (): void => {
    const csvContent = '\uFEFF' + [CSV_SAMPLE_HEADER, ...CSV_SAMPLE_ROWS].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'danh_sach_lead_mau.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống tệp mẫu danh_sach_lead_mau.csv thành công!', 'success');
  };

  // Quick load 2 sample leads for instant verification
  const handleQuickLoadSampleData = (): void => {
    const parsedRows: IExcelLeadRow[] = [
      {
        rowNumber: 1,
        fullName: 'Đặng Tuấn Anh',
        role: 'Giám đốc Vận hành',
        company: 'Công ty TNHH Vận Tải An Nam',
        email: 'tuananh.dang@annamlogistics.vn',
        phone: '0934567890',
        leadSource: defaultSourceInput.trim() || 'Hội thảo Logistics Tech 2026',
        interest: 'enterprise_pricing',
        notes: 'Gặp tại sự kiện sáng 10/10',
        isValid: true,
        errors: [],
      },
      {
        rowNumber: 2,
        fullName: 'Ngô Mỹ Duyên',
        role: 'Trưởng phòng Kinh doanh',
        company: 'Tập đoàn Bất động sản Địa Ốc Xanh',
        email: 'duyen.ngo@diaocxanh.vn',
        phone: '0987654321',
        leadSource: defaultSourceInput.trim() || 'Triển lãm VietBuild 2026',
        interest: 'crm_consultation',
        notes: 'Quan tâm quản lý giỏ hàng và khách hàng tiềm năng',
        isValid: true,
        errors: [],
      },
    ];
    setRows(parsedRows);
    setUploadedFileName('du_lieu_mau_kiem_thu.csv');
    showToast('Đã nạp 2 dòng lead mẫu kiểm thử vào bảng xem trước!', 'success');
  };

  // Parse CSV text
  const parseCSVContent = (content: string, fileName: string): void => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      showToast('Tệp CSV không chứa dòng dữ liệu nào ngoài dòng tiêu đề.', 'warning');
      return;
    }

    const dataLines = lines.slice(1);
    const parsedRows: IExcelLeadRow[] = [];

    dataLines.forEach((line, index) => {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      const fullName = parts[0] || '';
      const role = parts[1] || '';
      const company = parts[2] || '';
      const email = parts[3] || '';
      const phone = parts[4] || '';
      const leadSource = parts[5] || defaultSourceInput.trim();
      const interest = parts[6] || 'crm_consultation';
      const notes = parts[7] || '';

      const { isValid, errors } = validateRow(fullName, company, email, phone, leadSource);

      parsedRows.push({
        rowNumber: index + 1,
        fullName,
        role,
        company,
        email,
        phone,
        leadSource,
        interest: interest as LeadInterestType,
        notes,
        isValid,
        errors,
      });
    });

    setRows(parsedRows);
    setUploadedFileName(fileName);
    showToast(`Đã tải lên và phân tích ${parsedRows.length} dòng dữ liệu từ "${fileName}".`, 'info');
  };

  // Handle file input change
  const handleFileUpload = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        parseCSVContent(text, file.name);
      }
    };
    reader.onerror = () => {
      showToast('Không thể đọc tệp đã chọn. Vui lòng thử lại.', 'error');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Apply fallback source to invalid/missing source rows
  const handleApplyDefaultSource = (): void => {
    if (!defaultSourceInput.trim()) {
      showToast('Vui lòng nhập tên nguồn để áp dụng.', 'warning');
      return;
    }

    let updatedCount = 0;
    const updated = rows.map((r) => {
      if (!r.leadSource || !r.leadSource.trim() || r.errors.includes('Thiếu nguồn Lead')) {
        updatedCount++;
        const newSource = defaultSourceInput.trim();
        const { isValid, errors } = validateRow(r.fullName, r.company, r.email, r.phone, newSource);
        return {
          ...r,
          leadSource: newSource,
          isValid,
          errors,
        };
      }
      return r;
    });

    setRows(updated);
    if (updatedCount > 0) {
      showToast(`Đã tự động gán nguồn "${defaultSourceInput.trim()}" cho ${updatedCount} dòng!`, 'success');
    } else {
      showToast('Tất cả các dòng hiện tại đều đã có nguồn hợp lệ.', 'info');
    }
  };

  // Delete row
  const handleDeleteRow = (index: number): void => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    showToast('Đã xóa 1 dòng khỏi bảng xem trước.', 'info');
  };

  // Reset to Step 1
  const handleResetToUpload = (): void => {
    setRows([]);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm import
  const handleConfirmImport = (): void => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Không có dòng dữ liệu hợp lệ nào để nhập.', 'error');
      return;
    }

    const dtos: ICreateManualLeadDTO[] = validRows.map((r) => ({
      fullName: r.fullName,
      role: r.role || undefined,
      company: r.company,
      email: r.email,
      phone: r.phone,
      leadSource: r.leadSource,
      interest: (r.interest as LeadInterestType) || 'crm_consultation',
      notes: r.notes || undefined,
    }));

    const result = batchImportLeads(dtos, selectedTargetFormId);
    if (result.success) {
      handleResetToUpload();
      onClose();
      onSuccess?.();
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  const displayedRows = useMemo(() => {
    if (filterTab === 'valid') return rows.filter((r) => r.isValid);
    if (filterTab === 'error') return rows.filter((r) => !r.isValid);
    return rows;
  }, [rows, filterTab]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập Danh Sách Lead Hàng Loạt Từ Excel / CSV"
      subtitle="Quy trình 3 bước chuẩn hóa dữ liệu, kiểm tra hợp lệ và đồng bộ trực tiếp vào CRM"
      maxWidth="xl"
    >
      <div className={styles.container}>
        {/* Step Indicator Bar */}
        <div className={styles.stepperBar}>
          <div className={`${styles.stepItem} ${rows.length === 0 ? styles.stepItemActive : ''}`}>
            <span className={styles.stepBadge}>1</span>
            <span>Chọn Tệp &amp; Cấu Hình Biểu Mẫu</span>
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepItem} ${rows.length > 0 ? styles.stepItemActive : ''}`}>
            <span className={styles.stepBadge}>2</span>
            <span>
              Kiểm Tra Hợp Lệ {rows.length > 0 ? `(${validCount}/${rows.length})` : ''}
            </span>
          </div>
          <div className={styles.stepDivider} />
          <div className={styles.stepItem}>
            <span className={styles.stepBadge}>3</span>
            <span>Lưu Vào CRM</span>
          </div>
        </div>

        {/* STEP 1: Upload & Configuration View */}
        {rows.length === 0 ? (
          <div className={styles.uploadSplitGrid}>
            {/* Left Column: Form Target & Column Requirements */}
            <div className={styles.configCardCol}>
              <div className={styles.configCard}>
                <div className={styles.cardTitle}>
                  <Layers size={18} color="var(--color-primary, #2563EB)" />
                  Biểu Mẫu Web Tiếp Nhận Lead
                </div>
                <p className={styles.cardDesc}>
                  Chọn biểu mẫu để liên kết các lượt gửi nhập từ Excel, giúp quản lý dữ liệu theo từng chiến dịch riêng biệt.
                </p>

                <CustomSelect
                  label="Biểu mẫu web nhận dữ liệu"
                  options={formOptions}
                  value={selectedTargetFormId}
                  onChange={(val) => setSelectedTargetFormId(val)}
                />

                <Input
                  label="Nguồn Lead dự phòng (Nguồn mặc định)"
                  value={defaultSourceInput}
                  onChange={(e) => setDefaultSourceInput(e.target.value)}
                  placeholder="Ví dụ: Hội thảo TechExpo 2026..."
                  helperText="Tự động gán cho những dòng thiếu thông tin nguồn để tránh bị lỗi."
                />
              </div>

              <div className={styles.configCard}>
                <div className={styles.cardTitle}>
                  <Download size={18} color="#16A34A" />
                  Tải Tệp Mẫu Chuẩn UTF-8
                </div>
                <p className={styles.cardDesc}>
                  Tải tệp mẫu để chuẩn bị dữ liệu đúng định dạng cột trước khi tải lên hệ thống.
                </p>

                <div className={styles.columnSpecList}>
                  <div className={styles.columnSpecItem}>
                    <span style={{ fontWeight: 600 }}>Cột bắt buộc:</span>
                    <Badge tone="danger">Họ tên, Công ty, Email, SĐT, Nguồn Lead</Badge>
                  </div>
                  <div className={styles.columnSpecItem}>
                    <span style={{ fontWeight: 600 }}>Cột tùy chọn:</span>
                    <Badge tone="neutral">Chức danh, Nhu cầu quan tâm, Ghi chú</Badge>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  leftIcon={<Download size={15} />}
                  onClick={handleDownloadTemplate}
                >
                  Tải Tệp Mẫu Excel (.csv)
                </Button>
              </div>
            </div>

            {/* Right Column: Modern Upload Dropzone & Quick Test Button */}
            <div className={styles.dropzoneCol}>
              <div
                className={`${styles.modernDropzone} ${isDragging ? styles.active : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".csv, .txt, .xlsx"
                  style={{ display: 'none' }}
                />
                <div className={styles.dropzoneIconBox}>
                  <FileSpreadsheet size={32} />
                </div>
                <h3 className={styles.dropzoneHeading}>
                  Kéo thả tệp CSV / Excel vào đây
                </h3>
                <p className={styles.dropzoneSubtext}>
                  Hỗ trợ định dạng .csv chuẩn UTF-8 hoặc tệp văn bản phân cách dấu phẩy, dung lượng tối đa 10MB.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Upload size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Chọn Tệp Từ Thiết Bị
                </Button>
              </div>

              {/* Quick Test Card for Instant Verification */}
              <div className={styles.quickTestCard}>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-main)' }}>
                    Chưa có sẵn tệp kiểm thử?
                  </strong>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                    Nạp ngay 2 dòng dữ liệu mẫu chuẩn để kiểm tra chức năng trực tiếp.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Sparkles size={14} color="#F59E0B" />}
                  onClick={handleQuickLoadSampleData}
                >
                  Nạp Thử 2 Lead Mẫu
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Validation Dashboard & Data Preview Table */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {uploadedFileName && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: '8px', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileSpreadsheet size={15} color="var(--color-primary)" />
                  Tệp dữ liệu đang xử lý: <strong style={{ color: 'var(--color-text-main)' }}>{uploadedFileName}</strong>
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  {rows.length} dòng dữ liệu trích xuất thành công
                </span>
              </div>
            )}

            {/* KPI Summary Strip */}
            <div className={styles.kpiSummaryGrid}>
              <div className={styles.kpiCard}>
                <div>
                  <div className={styles.kpiLabel}>TỔNG SỐ DÒNG</div>
                  <div className={styles.kpiValue}>{rows.length}</div>
                </div>
                <FileSpreadsheet size={22} color="var(--color-primary)" />
              </div>

              <div className={styles.kpiCard}>
                <div>
                  <div className={styles.kpiLabel}>HỢP LỆ (ĐẠT CHUẨN)</div>
                  <div className={styles.kpiValue} style={{ color: '#16A34A' }}>
                    {validCount}
                  </div>
                </div>
                <CheckCircle size={22} color="#16A34A" />
              </div>

              <div className={styles.kpiCard}>
                <div>
                  <div className={styles.kpiLabel}>CÓ LỖI CẦN SỬA</div>
                  <div className={styles.kpiValue} style={{ color: errorCount > 0 ? '#DC2626' : '#64748B' }}>
                    {errorCount}
                  </div>
                </div>
                <AlertTriangle size={22} color={errorCount > 0 ? '#DC2626' : '#64748B'} />
              </div>

              <div className={styles.kpiCard}>
                <div>
                  <div className={styles.kpiLabel}>BIỂU MẪU ĐÍCH</div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--color-text-main)',
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '140px',
                    }}
                    title={activeTargetForm?.title || 'Biểu mẫu web'}
                  >
                    {activeTargetForm?.title || 'Biểu mẫu web'}
                  </div>
                </div>
                <Layers size={22} color="#7C3AED" />
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className={styles.previewToolbar}>
              <div className={styles.filterTabsGroup}>
                <button
                  type="button"
                  className={`${styles.filterTabBtn} ${filterTab === 'all' ? styles.filterTabBtnActive : ''}`}
                  onClick={() => setFilterTab('all')}
                >
                  Tất cả ({rows.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterTabBtn} ${filterTab === 'valid' ? styles.filterTabBtnActive : ''}`}
                  onClick={() => setFilterTab('valid')}
                >
                  Hợp lệ ({validCount})
                </button>
                <button
                  type="button"
                  className={`${styles.filterTabBtn} ${filterTab === 'error' ? styles.filterTabBtnActive : ''}`}
                  onClick={() => setFilterTab('error')}
                >
                  Có lỗi ({errorCount})
                </button>
              </div>

              <div className={styles.previewActionGroup}>
                {errorCount > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCw size={13} />}
                    onClick={handleApplyDefaultSource}
                    title="Gán nguồn dự phòng cho những dòng bị thiếu nguồn"
                  >
                    Sửa Nhanh Nguồn Thiếu
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetToUpload}
                >
                  Tải Tệp Khác
                </Button>
              </div>
            </div>

            {/* Data Grid Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>STT</th>
                    <th style={{ width: '14%' }}>Trạng Thái</th>
                    <th style={{ width: '22%' }}>Khách Hàng &amp; Công Ty</th>
                    <th style={{ width: '22%' }}>Email &amp; SĐT</th>
                    <th style={{ width: '20%' }}>Nguồn Lead</th>
                    <th style={{ width: '14%' }}>Nhu Cầu</th>
                    <th style={{ width: '4%', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        Không có dòng dữ liệu nào theo bộ lọc đang chọn.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? styles.rowValid : styles.rowError}>
                        <td>{row.rowNumber}</td>
                        <td>
                          {row.isValid ? (
                            <Badge tone="success">✓ Hợp lệ</Badge>
                          ) : (
                            <div>
                              <Badge tone="danger">✕ Lỗi</Badge>
                              <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px' }}>
                                {row.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div>
                            <strong style={{ color: 'var(--color-text-main)' }}>{row.fullName || '—'}</strong>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                              {row.company || '—'}
                              {row.role ? ` • ${row.role}` : ''}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{row.email || '—'}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                              {row.phone || '—'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: row.leadSource ? 'rgba(37, 99, 235, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                              color: row.leadSource ? 'var(--color-primary)' : '#DC2626',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                            }}
                          >
                            {row.leadSource || 'Chưa có nguồn *'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                            {row.interest || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.deleteRowBtn}
                            onClick={() => handleDeleteRow(idx)}
                            title="Xóa dòng này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerStatus}>
            {rows.length > 0 ? (
              <span>
                Sẵn sàng nhập <strong>{validCount}</strong> lead đạt tiêu chuẩn vào biểu mẫu{' '}
                <strong>&quot;{activeTargetForm?.title || 'Biểu mẫu web'}&quot;</strong>.
              </span>
            ) : (
              <span>Chọn tệp hoặc nạp lead mẫu để bắt đầu quá trình nhập dữ liệu.</span>
            )}
          </div>

          <div className={styles.footerActions}>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={validCount === 0}
              onClick={handleConfirmImport}
            >
              Xác Nhận Nhập ({validCount}) Lead Vào CRM
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
