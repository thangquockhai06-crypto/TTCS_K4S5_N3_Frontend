import React, { useState, useMemo } from 'react';
import {
  Globe,
  FileText,
  Eye,
  Send,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Ban,
  Clock,
  Search,
} from 'lucide-react';
import {
  EmbedCodeGenerator,
  LeadCreateModal,
  LeadExcelImport,
} from '../components/leads';
import { useLeadCapture } from '../hooks/useLeadCapture';
import { Badge } from '../components/common/Badge';
import { Button, Input, Modal, ConfirmModal } from '../components/common';
import { CustomSelect, ICustomSelectOption } from '../components/common/CustomSelect';
import { useToast } from '../context/ToastContext';
import {
  ILeadSubmission,
  LeadInterestType,
  IWebFormItem,
} from '../interfaces/lead-capture.interface';
import styles from './LeadCapturePage.module.css';

type ActiveTabType = 'overview' | 'fields' | 'preview' | 'embed' | 'submissions';

const INTEREST_OPTIONS: ICustomSelectOption<LeadInterestType>[] = [
  { value: 'crm_consultation', label: 'Tư vấn CRM Doanh nghiệp' },
  { value: 'enterprise_pricing', label: 'Báo giá Gói Enterprise' },
  { value: 'system_integration', label: 'Tích hợp API Webhook' },
  { value: 'product_demo', label: 'Trải nghiệm Bản Demo' },
  { value: 'partnership', label: 'Hợp tác Đại lý & Đối tác' },
  { value: 'other', label: 'Yêu cầu tùy chỉnh khác' },
];

const LEAD_SOURCE_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'Website Landing Page', label: 'Website Landing Page (Trang chủ)' },
  { value: 'Blog Chuyên Ngành', label: 'Blog Kiến Thức & Bài Viết Chuyên Ngành' },
  { value: 'Chiến Dịch Facebook Ads', label: 'Chiến dịch Quảng cáo Facebook Ads' },
  { value: 'Chiến Dịch Google Ads', label: 'Chiến dịch Quảng cáo Google Search' },
  { value: 'Sự Kiện Hội Thảo Tech', label: 'Sự kiện Hội thảo Công nghệ & Triển lãm' },
];

export const LeadCapturePage: React.FC = () => {
  const { showToast } = useToast();
  const {
    forms,
    selectedForm,
    setSelectedFormId,
    config,
    submissions,
    stats,
    fields,
    updateSubmission,
    deleteSubmission,
    createWebForm,
    updateWebForm,
    deleteWebForm,
  } = useLeadCapture();

  // Search query for forms list
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active tab in right detail panel (matching Image 5: Tổng quan, Trường, Xem trước, Mã nhúng, Lượt gửi)
  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');

  // Modals state
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState<boolean>(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isCreateFormModalOpen, setIsCreateFormModalOpen] = useState<boolean>(false);
  const [isEditFormModalOpen, setIsEditFormModalOpen] = useState<boolean>(false);

  // New form state
  const [newFormTitle, setNewFormTitle] = useState<string>('');
  const [newFormDescription, setNewFormDescription] = useState<string>('');

  // Edit form state
  const [editFormTitle, setEditFormTitle] = useState<string>('');
  const [editFormDescription, setEditFormDescription] = useState<string>('');

  // State for Delete submission confirmation
  const [subToDelete, setSubToDelete] = useState<ILeadSubmission | null>(null);

  // State for Delete form confirmation
  const [formToDelete, setFormToDelete] = useState<IWebFormItem | null>(null);

  // State for Edit submission modal
  const [editingSub, setEditingSub] = useState<ILeadSubmission | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('');
  const [editInterest, setEditInterest] = useState<LeadInterestType>('crm_consultation');
  const [editLeadSource, setEditLeadSource] = useState<string>('Website Landing Page');

  // Real-time validation errors for Edit submission form
  const [editFullNameError, setEditFullNameError] = useState<string | null>(null);
  const [editEmailError, setEditEmailError] = useState<string | null>(null);
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [editCompanyError, setEditCompanyError] = useState<string | null>(null);

  const interestLabelMap: Record<string, string> = {
    crm_consultation: 'Tư vấn CRM Doanh nghiệp',
    enterprise_pricing: 'Báo giá Gói Enterprise',
    system_integration: 'Tích hợp API Webhook',
    product_demo: 'Trải nghiệm Bản Demo',
    partnership: 'Hợp tác Đại lý & Đối tác',
    other: 'Yêu cầu tùy chỉnh khác',
  };

  // Filtered forms list
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const q = searchQuery.toLowerCase().trim();
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [forms, searchQuery]);

  // Open Edit Submission Modal
  const handleOpenEditSubModal = (sub: ILeadSubmission): void => {
    setEditingSub(sub);
    setEditFullName(sub.fullName);
    setEditEmail(sub.email);
    setEditPhone(sub.phone);
    setEditCompany(sub.company);
    setEditInterest(sub.interest);
    setEditLeadSource(sub.leadSource);

    setEditFullNameError(null);
    setEditEmailError(null);
    setEditPhoneError(null);
    setEditCompanyError(null);
  };

  // Real-time validation handlers for Edit Lead
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setEditFullName(val);
    if (!val.trim()) {
      setEditFullNameError('Vui lòng nhập họ và tên của khách hàng.');
    } else if (val.trim().length < 2) {
      setEditFullNameError('Họ và tên phải có ít nhất 2 ký tự.');
    } else {
      setEditFullNameError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setEditEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEditEmailError('Vui lòng nhập email liên hệ.');
    } else if (!emailRegex.test(val.trim())) {
      setEditEmailError('Định dạng email không hợp lệ (ví dụ: contact@company.com).');
    } else {
      setEditEmailError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setEditPhone(val);
    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!val.trim()) {
      setEditPhoneError('Vui lòng nhập số điện thoại.');
    } else if (!phoneRegex.test(val.trim())) {
      setEditPhoneError('Số điện thoại không hợp lệ (từ 9 đến 15 chữ số).');
    } else {
      setEditPhoneError(null);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setEditCompany(val);
    if (!val.trim()) {
      setEditCompanyError('Vui lòng nhập tên công ty / doanh nghiệp.');
    } else {
      setEditCompanyError(null);
    }
  };

  // Save Edit Lead Handler
  const handleSaveEditSub = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!editingSub) return;

    let hasError = false;
    if (!editFullName.trim() || editFullName.trim().length < 2) {
      setEditFullNameError('Vui lòng nhập họ và tên hợp lệ.');
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editEmail.trim() || !emailRegex.test(editEmail.trim())) {
      setEditEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
      hasError = true;
    }
    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!editPhone.trim() || !phoneRegex.test(editPhone.trim())) {
      setEditPhoneError('Vui lòng nhập số điện thoại hợp lệ.');
      hasError = true;
    }
    if (!editCompany.trim()) {
      setEditCompanyError('Vui lòng nhập tên công ty.');
      hasError = true;
    }

    if (hasError) return;

    const success = updateSubmission(editingSub.id, {
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      company: editCompany.trim(),
      interest: editInterest,
      leadSource: editLeadSource,
    });

    if (success) {
      showToast(`Đã cập nhật thông tin lead "${editFullName.trim()}" thành công!`, 'success');
      setEditingSub(null);
    } else {
      showToast('Không thể cập nhật thông tin lead.', 'error');
    }
  };

  // Confirm Delete Lead Handler
  const handleConfirmDeleteSub = (): void => {
    if (!subToDelete) return;
    const name = subToDelete.fullName;
    const success = deleteSubmission(subToDelete.id);
    if (success) {
      showToast(`Đã xóa lead "${name}" khỏi danh sách thành công!`, 'success');
    } else {
      showToast('Không thể xóa lead này.', 'error');
    }
    setSubToDelete(null);
  };

  // Create Web Form Handler
  const handleCreateForm = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!newFormTitle.trim()) {
      showToast('Vui lòng nhập tên biểu mẫu.', 'warning');
      return;
    }
    createWebForm({
      title: newFormTitle.trim(),
      type: 'Thu thập khách hàng tiềm năng',
      status: 'active',
      embedKey: `nexus_${Date.now()}`,
      workflowConnection: 'Tự động phân bổ Salesteam Inbound Q4',
      description: newFormDescription.trim() || 'Biểu mẫu thu thập thông tin khách hàng tiềm năng qua website.',
    });
    setNewFormTitle('');
    setNewFormDescription('');
    setIsCreateFormModalOpen(false);
  };

  // Open Edit Form Modal
  const handleOpenEditFormModal = (): void => {
    if (!selectedForm) return;
    setEditFormTitle(selectedForm.title);
    setEditFormDescription(selectedForm.description);
    setIsEditFormModalOpen(true);
  };

  // Save Edit Form Handler
  const handleSaveEditForm = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!selectedForm) return;
    if (!editFormTitle.trim()) {
      showToast('Tên biểu mẫu không được để trống.', 'warning');
      return;
    }
    updateWebForm(selectedForm.id, {
      title: editFormTitle.trim(),
      description: editFormDescription.trim(),
    });
    setIsEditFormModalOpen(false);
  };

  // Confirm Delete Form Handler
  const handleConfirmDeleteForm = (): void => {
    if (!formToDelete) return;
    deleteWebForm(formToDelete.id);
    setFormToDelete(null);
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. Header Section matching Image 5 */}
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.pageTitle}>
              <Globe size={26} color="var(--color-primary, #2563EB)" />
              Biểu mẫu web
            </h1>
            <p className={styles.pageSubtitle}>
              Quản lý biểu mẫu thu thập khách hàng tiềm năng, mã nhúng và lịch sử gửi.
            </p>
          </div>

          <div className={styles.actionBtnGroup}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<BookOpen size={16} />}
              onClick={() => setIsGuideModalOpen(true)}
            >
              Hướng Dẫn Tích Hợp
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsCreateFormModalOpen(true)}
            >
              + Tạo Biểu Mẫu
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<FileSpreadsheet size={16} />}
              onClick={() => setIsExcelImportOpen(true)}
            >
              Nhập Lead Từ Excel / CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<CreditCard size={16} />}
              onClick={() => setIsCreateLeadModalOpen(true)}
            >
              + Tạo Lead Thủ Công (Card Visit)
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Overview Stat Cards matching Image 5 (Section 3) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>TỔNG SỐ BIỂU MẪU</div>
            <div className={styles.statValue}>{stats.totalForms}</div>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
            <Globe size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>BIỂU MẪU HOẠT ĐỘNG</div>
            <div className={styles.statValue}>{stats.activeFormsCount}</div>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}>
            <FileText size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>TỔNG LƯỢT XEM</div>
            <div className={styles.statValue}>{stats.totalViews}</div>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0284C7' }}>
            <Eye size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>TỔNG LƯỢT GỬI</div>
            <div className={styles.statValue}>{stats.totalLeads}</div>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
            <Send size={22} />
          </div>
        </div>
      </div>

      {/* 3. Search Bar matching Image 5 (Section 4) */}
      <div className={styles.searchBarWrapper}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className={styles.searchInput}
            style={{ paddingLeft: '44px' }}
            placeholder="Tìm theo tên biểu mẫu hoặc loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Master-Detail Layout matching Image 5 (Sections 5 & 6) */}
      <div className={styles.masterDetailLayout}>
        {/* Left Side: Forms List */}
        <div className={styles.leftPanel}>
          <div>
            <h2 className={styles.panelTitle}>Danh sách biểu mẫu web</h2>
            <p className={styles.panelSubtitle}>
              Theo dõi biểu mẫu nhúng, lượt xem, lượt gửi và trạng thái hoạt động.
            </p>
          </div>

          <div className={styles.formsList}>
            {filteredForms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                Không tìm thấy biểu mẫu phù hợp.
              </div>
            ) : (
              filteredForms.map((form) => {
                const isSelected = selectedForm?.id === form.id;
                return (
                  <div
                    key={form.id}
                    className={`${styles.formCardItem} ${isSelected ? styles.active : ''}`}
                    onClick={() => setSelectedFormId(form.id)}
                  >
                    <div className={styles.formCardHeader}>
                      <span className={styles.formItemTitle}>{form.title}</span>
                      <Badge tone={form.status === 'active' ? 'success' : 'neutral'}>
                        {form.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                      {form.type}
                    </div>

                    <div className={styles.formItemMetrics}>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Lượt xem</span>
                        <span className={styles.metricValue}>{form.viewsCount}</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Lượt gửi</span>
                        <span className={styles.metricValue}>{form.submissionsCount}</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Chuyển đổi</span>
                        <span className={styles.metricValue}>{form.conversionRate}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detail & Tabs (Sections 6, 7, 8) */}
        {selectedForm && (
          <div className={styles.rightPanel}>
            {/* Header of selected form */}
            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailTitle}>{selectedForm.title}</h2>
                <div className={styles.detailMeta}>
                  Tạo lúc {selectedForm.createdAt} • Cập nhật lúc {selectedForm.updatedAt}
                </div>
              </div>

              <div className={styles.detailActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit2 size={14} />}
                  onClick={handleOpenEditFormModal}
                >
                  Chỉnh Sửa
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setFormToDelete(selectedForm)}
                >
                  Xóa
                </Button>
              </div>
            </div>

            {/* 5 Tabs matching Image 5 (Section 7) */}
            <div className={styles.tabsNav}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Tổng Quan
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'fields' ? styles.active : ''}`}
                onClick={() => setActiveTab('fields')}
              >
                Trường
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.active : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Xem Trước
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'embed' ? styles.active : ''}`}
                onClick={() => setActiveTab('embed')}
              >
                Mã Nhúng
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'submissions' ? styles.active : ''}`}
                onClick={() => setActiveTab('submissions')}
              >
                Lượt Gửi ({submissions.length})
              </button>
            </div>

            {/* Sub-metrics row matching Image 5 (Section 8) */}
            <div className={styles.subMetricsGrid}>
              <div className={styles.subMetricCard}>
                <Eye size={20} color="#0284C7" />
                <div>
                  <div className={styles.subMetricLabel}>LƯỢT XEM</div>
                  <div className={styles.subMetricVal}>{selectedForm.viewsCount}</div>
                </div>
              </div>

              <div className={styles.subMetricCard}>
                <Send size={20} color="#7C3AED" />
                <div>
                  <div className={styles.subMetricLabel}>LƯỢT GỬI</div>
                  <div className={styles.subMetricVal}>{selectedForm.submissionsCount}</div>
                </div>
              </div>

              <div className={styles.subMetricCard}>
                <CheckCircle2 size={20} color="#16A34A" />
                <div>
                  <div className={styles.subMetricLabel}>CHUYỂN ĐỔI</div>
                  <div className={styles.subMetricVal}>{selectedForm.conversionRate}</div>
                </div>
              </div>

              <div className={styles.subMetricCard}>
                <Globe size={20} color="#2563EB" />
                <div>
                  <div className={styles.subMetricLabel}>KHÓA NHÚNG</div>
                  <div className={styles.subMetricVal} style={{ fontSize: '0.8rem' }}>
                    {selectedForm.embedKey}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab 1: Tổng quan */}
            {activeTab === 'overview' && (
              <div className={styles.tabContent}>
                <div className={styles.infoCard}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Loại biểu mẫu:</span>
                    <span className={styles.infoVal}>{selectedForm.type}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Liên kết Workflow:</span>
                    <span className={styles.infoVal}>
                      <Badge tone="primary">{selectedForm.workflowConnection}</Badge>
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nguồn Lead mặc định:</span>
                    <span className={styles.infoVal}>{config.leadSource}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Mô tả chi tiết:</span>
                    <span className={styles.infoVal} style={{ textAlign: 'left', maxWidth: '60%' }}>
                      {selectedForm.description}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    border: '1px dashed rgba(37, 99, 235, 0.25)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                      Mở rộng nguồn thu thập Lead
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Thêm nhanh khách hàng từ sự kiện hội thảo hoặc đưa danh sách Excel hàng loạt vào hệ thống.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<CreditCard size={14} />}
                      onClick={() => setIsCreateLeadModalOpen(true)}
                    >
                      + Tạo Card Visit
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => setIsExcelImportOpen(true)}
                    >
                      Nhập Excel / CSV
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Trường (Fields Configuration) */}
            {activeTab === 'fields' && (
              <div className={styles.tabContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Cấu hình các trường dữ liệu thu thập từ người dùng (Họ tên, Email, Điện thoại, Công ty, Nhu cầu).
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>Tên Trường Dữ Liệu</th>
                        <th>Loại Dữ Liệu</th>
                        <th>Bắt Buộc</th>
                        <th>Placeholder / Mô Tả</th>
                        <th>Vai Trò Nghiệp Vụ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <strong>{f.label}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              field: {f.name}
                            </div>
                          </td>
                          <td>
                            <Badge tone="neutral">{f.type.toUpperCase()}</Badge>
                          </td>
                          <td>
                            {f.required ? (
                              <Badge tone="danger">Bắt buộc</Badge>
                            ) : (
                              <Badge tone="neutral">Tùy chọn</Badge>
                            )}
                          </td>
                          <td>
                            <span>{f.placeholder || '—'}</span>
                            {f.description && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                                {f.description}
                              </div>
                            )}
                          </td>
                          <td>
                            {f.name === 'honeypotValue' ? (
                              <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '0.76rem' }}>
                                🛡️ Chống Spam Bot tự động
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem' }}>Đồng bộ vào Hồ sơ Khách hàng CRM</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Xem trước (Interactive Preview) */}
            {activeTab === 'preview' && (
              <div className={styles.tabContent}>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  Giao diện hiển thị trực quan của biểu mẫu khi được nhúng trên website đối tác:
                </div>

                <div
                  style={{
                    border: '1px solid var(--color-border-card)',
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border-card)',
                      borderRadius: '12px',
                      padding: '28px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', textAlign: 'center' }}>
                      {config.formTitle}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '0 0 20px 0' }}>
                      {config.formDescription}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <Input label="Họ và tên của bạn" placeholder="Ví dụ: Lê Hoàng Long" readOnly />
                      <Input label="Tên công ty / Doanh nghiệp" placeholder="Ví dụ: VietTech Solutions" readOnly />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <Input label="Email liên hệ" placeholder="long@company.com" readOnly />
                        <Input label="Số điện thoại" placeholder="0912 345 678" readOnly />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhu cầu quan tâm</label>
                        <CustomSelect options={INTEREST_OPTIONS} value="crm_consultation" onChange={() => {}} disabled />
                      </div>
                      <Button type="button" variant="primary" size="lg" fullWidth leftIcon={<Send size={16} />}>
                        {config.ctaText}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Mã nhúng (Embed Code Generator - S4-01) */}
            {activeTab === 'embed' && (
              <div className={styles.tabContent}>
                <EmbedCodeGenerator />
              </div>
            )}

            {/* Tab 5: Lượt gửi (Submissions History with Edit & Delete) */}
            {activeTab === 'submissions' && (
              <div className={styles.tabContent}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color="var(--color-primary)" />
                      Danh sách lead thu thập từ biểu mẫu nhúng, card visit &amp; Excel
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Mọi lead nhập vào đều được tự động gán nguồn &amp; chuyển vào CRM ở trạng thái &quot;Mới&quot;
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<CreditCard size={14} />}
                      onClick={() => setIsCreateLeadModalOpen(true)}
                    >
                      + Tạo Card Visit
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<FileSpreadsheet size={14} />}
                      onClick={() => setIsExcelImportOpen(true)}
                    >
                      Nhập Excel / CSV
                    </Button>
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>Họ &amp; Tên Khách Hàng</th>
                        <th>Công Ty</th>
                        <th>Email &amp; Điện Thoại</th>
                        <th>Nhu Cầu Quan Tâm</th>
                        <th>Nguồn Lead</th>
                        <th>Trạng Thái CRM</th>
                        <th>Hình Thức / Bảo Mật</th>
                        <th>Thời Gian Nhận</th>
                        <th style={{ textAlign: 'center' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                            Chưa có lead nào trong danh sách.
                          </td>
                        </tr>
                      ) : (
                        submissions.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <strong style={{ color: 'var(--color-text-main)' }}>{sub.fullName}</strong>
                            </td>
                            <td>{sub.company}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>{sub.email}</span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                                  {sub.phone}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem' }}>
                                {interestLabelMap[sub.interest] || sub.interest}
                              </span>
                            </td>
                            <td>
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
                                {sub.leadSource}
                              </span>
                            </td>
                            <td>
                              {sub.isSpamBlocked ? (
                                <Badge tone="danger">Từ chối</Badge>
                              ) : (
                                <Badge tone="primary">Mới (New Lead)</Badge>
                              )}
                            </td>
                            <td>
                              {sub.isSpamBlocked ? (
                                <span
                                  style={{
                                    color: '#DC2626',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Ban size={13} />
                                  {sub.blockReason || 'Đã chặn Spam'}
                                </span>
                              ) : sub.ipAddress.includes('Card Visit') ? (
                                <span
                                  style={{
                                    color: '#2563EB',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <CreditCard size={13} />
                                  Thủ công (Danh thiếp)
                                </span>
                              ) : sub.ipAddress.includes('Excel') ? (
                                <span
                                  style={{
                                    color: '#059669',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <FileSpreadsheet size={13} />
                                  Tệp Excel / CSV
                                </span>
                              ) : (
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
                                  <CheckCircle2 size={13} />
                                  Hợp lệ (IP: {sub.ipAddress})
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              {sub.submittedAt}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className={styles.tableActions} style={{ justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => handleOpenEditSubModal(sub)}
                                  title="Chỉnh sửa thông tin lead"
                                >
                                  <Edit2 size={13} /> Sửa
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                  onClick={() => setSubToDelete(sub)}
                                  title="Xóa lead khỏi danh sách"
                                >
                                  <Trash2 size={13} /> Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Card Visit Lead Create Modal (S4-02) */}
      <LeadCreateModal
        isOpen={isCreateLeadModalOpen}
        onClose={() => setIsCreateLeadModalOpen(false)}
      />

      {/* Batch Excel Import Modal (S4-02) */}
      <LeadExcelImport
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />

      {/* Edit Lead Modal */}
      {editingSub && (
        <Modal
          isOpen={editingSub !== null}
          onClose={() => setEditingSub(null)}
          title="Chỉnh Sửa Thông Tin Lead"
          subtitle={`Cập nhật thông tin chi tiết của lead "${editingSub.fullName}"`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEditSub} className={styles.modalForm}>
            <Input
              label="Họ và tên khách hàng"
              value={editFullName}
              onChange={handleFullNameChange}
              error={editFullNameError || undefined}
              placeholder="Ví dụ: Lê Hoàng Long"
              required
            />

            <Input
              label="Email liên hệ"
              type="email"
              value={editEmail}
              onChange={handleEmailChange}
              error={editEmailError || undefined}
              placeholder="Ví dụ: long.le@company.com"
              required
            />

            <Input
              label="Số điện thoại"
              type="tel"
              value={editPhone}
              onChange={handlePhoneChange}
              error={editPhoneError || undefined}
              placeholder="Ví dụ: 0912 345 678"
              required
            />

            <Input
              label="Công ty / Doanh nghiệp"
              value={editCompany}
              onChange={handleCompanyChange}
              error={editCompanyError || undefined}
              placeholder="Ví dụ: VietTech Solutions JSC"
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main, #0F172A)' }}>
                Nhu cầu quan tâm
              </label>
              <CustomSelect
                options={INTEREST_OPTIONS}
                value={editInterest}
                onChange={(val) => setEditInterest(val as LeadInterestType)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main, #0F172A)' }}>
                Nguồn lead
              </label>
              <CustomSelect
                options={LEAD_SOURCE_OPTIONS}
                value={editLeadSource}
                onChange={(val) => setEditLeadSource(val)}
              />
            </div>

            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setEditingSub(null)}
                type="button"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
              >
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Lead Confirmation Modal */}
      <ConfirmModal
        isOpen={subToDelete !== null}
        title="Xác nhận xóa Lead"
        message={`Bạn có chắc chắn muốn xóa lead "${subToDelete?.fullName}" (${subToDelete?.company})? Thao tác này sẽ xóa lead khỏi danh sách và cập nhật dữ liệu ngay lập tức.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy bỏ"
        isDanger={true}
        onConfirm={handleConfirmDeleteSub}
        onCancel={() => setSubToDelete(null)}
      />

      {/* Delete Form Confirmation Modal */}
      <ConfirmModal
        isOpen={formToDelete !== null}
        title="Xác nhận xóa Biểu mẫu web"
        message={`Bạn có chắc chắn muốn xóa biểu mẫu "${formToDelete?.title}"? Thao tác này sẽ xóa biểu mẫu khỏi danh sách và ngừng hỗ trợ mã nhúng tương ứng.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy bỏ"
        isDanger={true}
        onConfirm={handleConfirmDeleteForm}
        onCancel={() => setFormToDelete(null)}
      />

      {/* Create New Form Modal */}
      <Modal
        isOpen={isCreateFormModalOpen}
        onClose={() => setIsCreateFormModalOpen(false)}
        title="Tạo Biểu Mẫu Thu Thập Lead Mới"
        subtitle="Khởi tạo biểu mẫu thu thập thông tin khách hàng tiềm năng cho website"
        maxWidth="md"
      >
        <form onSubmit={handleCreateForm} className={styles.modalForm}>
          <Input
            label="Tên biểu mẫu"
            placeholder="Ví dụ: Đăng Ký Tư Vấn Triển Lãm Công Nghệ"
            value={newFormTitle}
            onChange={(e) => setNewFormTitle(e.target.value)}
            required
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main, #0F172A)' }}>
              Mô tả mục đích biểu mẫu
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #CBD5E1)',
                backgroundColor: 'var(--color-bg-card, #FFFFFF)',
                color: 'var(--color-text-main, #0F172A)',
                fontSize: '0.86rem',
                minHeight: '70px',
              }}
              placeholder="Mô tả chiến dịch hoặc mục tiêu thu thập khách hàng tiềm năng..."
              value={newFormDescription}
              onChange={(e) => setNewFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsCreateFormModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              Tạo Biểu Mẫu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Form Modal */}
      <Modal
        isOpen={isEditFormModalOpen}
        onClose={() => setIsEditFormModalOpen(false)}
        title="Chỉnh Sửa Biểu Mẫu Web"
        subtitle="Cập nhật tên và mô tả chi tiết của biểu mẫu"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditForm} className={styles.modalForm}>
          <Input
            label="Tên biểu mẫu"
            value={editFormTitle}
            onChange={(e) => setEditFormTitle(e.target.value)}
            required
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main, #0F172A)' }}>
              Mô tả mục đích
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #CBD5E1)',
                backgroundColor: 'var(--color-bg-card, #FFFFFF)',
                color: 'var(--color-text-main, #0F172A)',
                fontSize: '0.86rem',
                minHeight: '70px',
              }}
              value={editFormDescription}
              onChange={(e) => setEditFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsEditFormModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Integration Guide Modal matching Image 5 (Section 1) */}
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title="Hướng Dẫn Tích Hợp Biểu Mẫu Nhúng"
        subtitle="Các bước đưa biểu mẫu thu thập lead vào website bất kỳ"
        maxWidth="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.86rem', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              1
            </div>
            <div>
              <strong>Chọn biểu mẫu web cần nhúng:</strong> Trong danh sách biểu mẫu bên trái, nhấp chọn biểu mẫu muốn tích hợp lên website hoặc landing page.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              2
            </div>
            <div>
              <strong>Lấy mã nguồn tại tab &quot;Mã nhúng&quot;:</strong> Chuyển sang tab <em>Mã nhúng</em> và bấm nút <em>&quot;Sao Chép Mã Nguồn&quot;</em>. Bạn có thể chọn giữa mã <code>Iframe</code> hoặc <code>JavaScript Widget SDK</code>.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              3
            </div>
            <div>
              <strong>Dán vào website của bạn:</strong> Dán đoạn mã vào tệp HTML hoặc khối Custom HTML trên các nền tảng CMS như WordPress, Wix, Haravan, Shopify hoặc Webflow.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#16A34A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              ✓
            </div>
            <div>
              <strong>Tự động thu thập lead &amp; chống spam:</strong> Mọi khách hàng điền form trên website sẽ được tự động đổ về CRM ở trạng thái <strong>&quot;Mới&quot;</strong>, đồng thời lọc sạch spam bot nhờ cơ chế bảo mật Honeypot &amp; IP Rate Limiting.
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsGuideModalOpen(false)}
          >
            Đã Hiểu
          </Button>
        </div>
      </Modal>
    </div>
  );
};
