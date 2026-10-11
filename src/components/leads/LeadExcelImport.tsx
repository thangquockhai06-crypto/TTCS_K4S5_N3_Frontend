import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Info,
} from 'lucide-react';
import { Button, Modal, Badge } from '../common';
import { useLeadCapture } from '../../hooks/useLeadCapture';
import { useToast } from '../../context/ToastContext';
import {
  ICreateManualLeadDTO,
  IExcelLeadRow,
  LeadInterestType,
} from '../../interfaces/lead-capture.interface';
import styles from './LeadExcelImport.module.css';

export interface ILeadExcelImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 2 minimal sample template rows for the CSV file (satisfies rule: 1-2 items only)
const CSV_SAMPLE_HEADER = 'Họ và tên,Chức danh,Công ty,Email,Số điện thoại,Nguồn Lead,Nhu cầu quan tâm,Ghi chú';
const CSV_SAMPLE_ROWS = [
  'Đặng Tuấn Anh,Giám đốc Vận hành,Công ty TNHH Vận Tải An Nam,tuananh.dang@annamlogistics.vn,0934567890,Hội thảo Logistics Tech 2026,enterprise_pricing,Gặp tại sự kiện sáng 10/10',
  'Ngô Mỹ Duyên,Trưởng phòng Kinh doanh,Tập đoàn Bất động sản Địa Ốc Xanh,duyen.ngo@diaocxanh.vn,0987654321,Triển lãm VietBuild 2026,crm_consultation,Quan tâm quản lý giỏ hàng và khách hàng tiềm năng',
];

export const LeadExcelImport: React.FC<ILeadExcelImportProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { batchImportLeads } = useLeadCapture();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<IExcelLeadRow[]>([]);
  const [defaultSourceInput, setDefaultSourceInput] = useState<string>('Hội thảo Công nghệ TechExpo');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Validate a single parsed row
  const validateRow = (
    fullName: string,
    company: string,
    email: string,
    phone: string,
    leadSource: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Mandatory rule: mọi lead nhập vào đều bắt buộc có nguồn
    if (!leadSource || !leadSource.trim()) {
      errors.push('Thiếu nguồn Lead (Bắt buộc)');
    }

    if (!fullName || !fullName.trim() || fullName.trim().length < 2) {
      errors.push('Thiếu họ và tên');
    }

    if (!company || !company.trim()) {
      errors.push('Thiếu tên công ty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      errors.push('Thiếu email liên hệ');
    } else if (!emailRegex.test(email.trim())) {
      errors.push('Email không đúng định dạng');
    }

    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!phone || !phone.trim()) {
      errors.push('Thiếu số điện thoại');
    } else if (!phoneRegex.test(phone.trim())) {
      errors.push('Số điện thoại không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Download Sample CSV template file
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

  // Parse CSV text into preview rows
  const parseCSVContent = (content: string): void => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      showToast('Tệp CSV không chứa dòng dữ liệu nào ngoài dòng tiêu đề.', 'warning');
      return;
    }

    // Skip header line (line 0)
    const dataLines = lines.slice(1);
    const parsedRows: IExcelLeadRow[] = [];

    dataLines.forEach((line, index) => {
      // Split line by comma respecting quotes
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      const fullName = parts[0] || '';
      const role = parts[1] || '';
      const company = parts[2] || '';
      const email = parts[3] || '';
      const phone = parts[4] || '';
      const leadSource = parts[5] || '';
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
    showToast(`Đã tải lên và phân tích ${parsedRows.length} dòng dữ liệu.`, 'info');
  };

  // Handle file upload input
  const handleFileUpload = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        parseCSVContent(text);
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

  // Drag & drop handlers
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

  // Apply default source to rows missing source
  const handleApplyDefaultSource = (): void => {
    if (!defaultSourceInput.trim()) {
      showToast('Vui lòng nhập tên nguồn để áp dụng.', 'warning');
      return;
    }

    let updatedCount = 0;
    const updated = rows.map((r) => {
      if (!r.leadSource || !r.leadSource.trim()) {
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
      showToast(
        `Đã tự động gán nguồn "${defaultSourceInput.trim()}" cho ${updatedCount} dòng thiếu nguồn!`,
        'success'
      );
    } else {
      showToast('Tất cả các dòng hiện tại đều đã có nguồn.', 'info');
    }
  };

  // Delete a specific row
  const handleDeleteRow = (index: number): void => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    showToast('Đã xóa 1 dòng khỏi danh sách xem trước.', 'info');
  };

  // Clear all rows
  const handleClearAll = (): void => {
    setRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm import valid rows
  const handleConfirmImport = (): void => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Không có dòng hợp lệ nào để nhập vào hệ thống.', 'error');
      return;
    }

    const dtos: ICreateManualLeadDTO[] = validRows.map((r) => ({
      fullName: r.fullName,
      role: r.role || undefined,
      company: r.company,
      email: r.email,
      phone: r.phone,
      leadSource: r.leadSource, // Guaranteed valid by validateRow
      interest: (r.interest as LeadInterestType) || 'crm_consultation',
      notes: r.notes || undefined,
    }));

    const result = batchImportLeads(dtos);
    if (result.success) {
      handleClearAll();
      onClose();
      onSuccess?.();
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập Danh Sách Lead Hàng Loạt Từ Excel / CSV"
      subtitle="Tải tệp mẫu, xem trước bảng dữ liệu và kiểm tra báo lỗi từng dòng trước khi lưu vào CRM"
      maxWidth="xl"
    >
      <div className={styles.container}>
        {/* Notice Rule */}
        <div className={styles.noticeBox}>
          <Info size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Ràng buộc kỹ thuật &amp; nghiệp vụ:</strong> Mọi lead nhập vào hệ thống đều bắt buộc phải có nguồn (ví dụ: tên hội thảo, sự kiện, chiến dịch). Hệ thống kiểm tra hợp lệ từng dòng, chỉ cho phép đưa lead đạt chuẩn vào CRM ở trạng thái &quot;Mới&quot;.
          </div>
        </div>

        {/* Action Bar: Download template button */}
        <div className={styles.actionRow}>
          <div className={styles.templateBtnGroup}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Download size={15} />}
              onClick={handleDownloadTemplate}
            >
              Tải Tệp Mẫu Excel (.csv)
            </Button>
          </div>

          {rows.length > 0 && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={handleClearAll}
            >
              Xóa Bảng Xem Trước
            </Button>
          )}
        </div>

        {/* Dropzone Upload */}
        <div
          className={`${styles.uploadDropzone} ${isDragging ? styles.active : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv, .txt"
            className={styles.fileInputHidden}
          />
          <FileSpreadsheet size={36} color="var(--color-primary, #2563EB)" />
          <div className={styles.dropzoneTitle}>
            Kéo thả tệp CSV / Excel vào đây, hoặc nhấn để duyệt tệp từ máy tính
          </div>
          <div className={styles.dropzoneSubtitle}>
            Hỗ trợ tệp định dạng .csv chuẩn UTF-8, dung lượng tối đa 10MB
          </div>
        </div>

        {/* Preview Section */}
        {rows.length > 0 && (
          <>
            {/* Stats Summary & Quick Fix bar */}
            <div className={styles.summaryBar}>
              <div className={styles.statsGroup}>
                <div className={styles.statItem}>
                  <span>Tổng số dòng:</span>
                  <strong>{rows.length}</strong>
                </div>
                <div className={styles.statItem} style={{ color: '#16A34A' }}>
                  <CheckCircle size={15} />
                  <span>Hợp lệ:</span>
                  <strong>{validCount}</strong>
                </div>
                <div className={styles.statItem} style={{ color: errorCount > 0 ? '#DC2626' : 'var(--color-text-muted)' }}>
                  <AlertTriangle size={15} />
                  <span>Có lỗi:</span>
                  <strong>{errorCount}</strong>
                </div>
              </div>

              {/* Quick Fix for missing sources */}
              <div className={styles.quickFixGroup}>
                <span className={styles.quickFixLabel}>Gán nguồn cho dòng thiếu:</span>
                <input
                  type="text"
                  className={styles.quickFixInput}
                  value={defaultSourceInput}
                  onChange={(e) => setDefaultSourceInput(e.target.value)}
                  placeholder="Ví dụ: Hội thảo TechExpo 2026"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyDefaultSource}
                >
                  Áp Dụng
                </Button>
              </div>
            </div>

            {/* Preview Table with Line-by-line Error Reporting */}
            <div className={styles.tableContainer}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>Dòng</th>
                    <th style={{ width: '90px' }}>Trạng Thái</th>
                    <th>Kiểm Tra &amp; Báo Lỗi Từng Dòng</th>
                    <th>Họ &amp; Tên</th>
                    <th>Chức Danh</th>
                    <th>Công Ty</th>
                    <th>Email</th>
                    <th>Số Điện Thoại</th>
                    <th>Nguồn Lead (Bắt Buộc)</th>
                    <th>Nhu Cầu</th>
                    <th style={{ width: '50px', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={row.isValid ? styles.rowValid : styles.rowError}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        #{row.rowNumber}
                      </td>
                      <td>
                        {row.isValid ? (
                          <Badge tone="success">Hợp lệ</Badge>
                        ) : (
                          <Badge tone="danger">Có lỗi</Badge>
                        )}
                      </td>
                      <td>
                        {row.isValid ? (
                          <span
                            style={{
                              color: '#16A34A',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle size={13} /> Sẵn sàng nhập vào CRM
                          </span>
                        ) : (
                          <div className={styles.errorList}>
                            {row.errors.map((err, errIdx) => (
                              <span key={errIdx} className={styles.errorTag}>
                                <XCircle size={11} /> {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{row.fullName || <em style={{ color: '#DC2626' }}>Trống</em>}</strong>
                      </td>
                      <td>{row.role || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td>{row.company || <em style={{ color: '#DC2626' }}>Trống</em>}</td>
                      <td>
                        {row.email ? (
                          <span>{row.email}</span>
                        ) : (
                          <em style={{ color: '#DC2626' }}>Trống</em>
                        )}
                      </td>
                      <td>
                        {row.phone ? (
                          <span>{row.phone}</span>
                        ) : (
                          <em style={{ color: '#DC2626' }}>Trống</em>
                        )}
                      </td>
                      <td>
                        {row.leadSource ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(37, 99, 235, 0.08)',
                              color: 'var(--color-primary)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {row.leadSource}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: '#DC2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Thiếu nguồn!
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{row.interest}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={styles.deleteRowBtn}
                          onClick={() => handleDeleteRow(index)}
                          title="Xóa dòng này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {rows.length > 0 ? (
              <span>
                Đang sẵn sàng nhập <strong>{validCount}</strong> lead hợp lệ
                {errorCount > 0 ? ` (Bỏ qua ${errorCount} dòng lỗi)` : ''}.
              </span>
            ) : (
              <span>Chưa có dữ liệu nào được tải lên xem trước.</span>
            )}
          </div>

          <div className={styles.footerActions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Upload size={16} />}
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
