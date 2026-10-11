import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock,
  Search,
  GitMerge,
  TrendingUp,
} from 'lucide-react';
import {
  EmbedCodeGenerator,
  LeadCreateModal,
  LeadExcelImport,
  LeadDeduplicationView,
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

const FORM_TYPE_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'Thu thập khách hàng tiềm năng', label: 'Thu thập khách hàng tiềm năng' },
  { value: 'Đăng ký tư vấn giải pháp', label: 'Đăng ký tư vấn giải pháp' },
  { value: 'Khảo sát & đồng bộ Custom Field', label: 'Khảo sát & đồng bộ Custom Field' },
  { value: 'Trải nghiệm bản Demo Enterprise', label: 'Trải nghiệm bản Demo Enterprise' },
];

const WORKFLOW_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'Không liên kết workflow', label: 'Không liên kết workflow' },
  { value: 'Tự động phân bổ Salesteam Inbound', label: 'Tự động phân bổ Salesteam Inbound' },
  { value: 'Chiến dịch email nuôi dưỡng Lead tự động', label: 'Chiến dịch email nuôi dưỡng Lead tự động' },
];

const SUBMIT_ACTION_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'Hiển thị tin nhắn', label: 'Hiển thị tin nhắn' },
  { value: 'Chuyển hướng đến liên kết URL', label: 'Chuyển hướng đến liên kết URL' },
];

export interface IAvailableFieldItem {
  key: string;
  label: string;
  shortLabel: string;
  mockLabel: string;
  mockValue: string;
}

export const AVAILABLE_FORM_FIELDS: IAvailableFieldItem[] = [
  { key: 'fullName', label: 'T Full name *', shortLabel: 'Họ và tên', mockLabel: 'T Full name *', mockValue: 'Nguyễn Văn Hải' },
  { key: 'email', label: '✉ Email *', shortLabel: 'Email', mockLabel: '✉ Email *', mockValue: 'hai.nguyen@company.com' },
  { key: 'phone', label: '✆ Phone *', shortLabel: 'Số điện thoại', mockLabel: '✆ Số điện thoại *', mockValue: '0987 654 321' },
  { key: 'company', label: 'Tên công ty', shortLabel: 'Tên công ty', mockLabel: '🏢 Tên công ty / Doanh nghiệp', mockValue: 'VietTech Solutions JSC' },
  { key: 'interest', label: 'Nhu cầu quan tâm', shortLabel: 'Nhu cầu', mockLabel: '🎯 Nhu cầu quan tâm', mockValue: 'Tư vấn CRM Doanh nghiệp' },
  { key: 'notes', label: 'Ghi chú / Yêu cầu', shortLabel: 'Ghi chú', mockLabel: '📝 Ghi chú / Yêu cầu tùy chỉnh', mockValue: 'Cần tích hợp trong Q2...' },
];

export const LeadCapturePage: React.FC = () => {
  const navigate = useNavigate();
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
  const [isDeduplicationModalOpen, setIsDeduplicationModalOpen] = useState<boolean>(false);

  // New form state (matching Image 4)
  const [newFormTitle, setNewFormTitle] = useState<string>('Thu thập khách hàng tiềm năng Q2');
  const [newFormType, setNewFormType] = useState<string>('Thu thập khách hàng tiềm năng');
  const [newFormDescription, setNewFormDescription] = useState<string>('Thu thập khách hàng tiềm năng từ các landing page trả phí.');
  const [newFormWorkflow, setNewFormWorkflow] = useState<string>('Không liên kết workflow');
  const [newFormSubmitAction, setNewFormSubmitAction] = useState<string>('Hiển thị tin nhắn');
  const [newFormSuccessMessage, setNewFormSuccessMessage] = useState<string>('Cảm ơn bạn đã gửi thông tin!');
  const [createFormFields, setCreateFormFields] = useState<string[]>([
    'fullName',
    'email',
    'phone',
    'company',
    'interest',
  ]);

  // Edit form state (matching Image 5)
  const [editFormTitle, setEditFormTitle] = useState<string>('');
  const [editFormWorkflow, setEditFormWorkflow] = useState<string>('Không liên kết workflow');
  const [editFormDescription, setEditFormDescription] = useState<string>('');
  const [editFormSubmitAction, setEditFormSubmitAction] = useState<string>('Hiển thị tin nhắn');
  const [editFormSuccessMessage, setEditFormSuccessMessage] = useState<string>('OK');
  const [editFormStatus, setEditFormStatus] = useState<'active' | 'inactive'>('active');
  const [editFormFields, setEditFormFields] = useState<string[]>([
    'fullName',
    'email',
    'phone',
    'company',
    'interest',
  ]);

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

  // Toggle and Add field handlers for Create Form Modal
  const handleToggleCreateField = (key: string): void => {
    setCreateFormFields((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) {
          showToast('Biểu mẫu cần ít nhất 1 trường dữ liệu.', 'warning');
          return prev;
        }
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleAddMoreCreateField = (): void => {
    const missing = AVAILABLE_FORM_FIELDS.find((f) => !createFormFields.includes(f.key));
    if (missing) {
      setCreateFormFields((prev) => [...prev, missing.key]);
      showToast(`Đã thêm trường "${missing.shortLabel}" vào biểu mẫu!`, 'success');
    } else {
      showToast('Đã kích hoạt toàn bộ các trường dữ liệu tiêu chuẩn!', 'info');
    }
  };

  // Toggle and Add field handlers for Edit Form Modal
  const handleToggleEditField = (key: string): void => {
    setEditFormFields((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) {
          showToast('Biểu mẫu cần ít nhất 1 trường dữ liệu.', 'warning');
          return prev;
        }
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleAddMoreEditField = (): void => {
    const missing = AVAILABLE_FORM_FIELDS.find((f) => !editFormFields.includes(f.key));
    if (missing) {
      setEditFormFields((prev) => [...prev, missing.key]);
      showToast(`Đã thêm trường "${missing.shortLabel}" vào biểu mẫu!`, 'success');
    } else {
      showToast('Đã kích hoạt toàn bộ các trường dữ liệu tiêu chuẩn!', 'info');
    }
  };

  // Fields configured for the active selected form (syncs Tab 2 "Trường")
  const currentFormFields = useMemo(() => {
    if (!selectedForm) return fields;
    const activeKeys =
      selectedForm.fields && selectedForm.fields.length > 0
        ? selectedForm.fields
        : ['fullName', 'email', 'phone', 'company', 'interest'];
    return fields.filter(
      (f) => activeKeys.includes(f.name) || f.name === 'honeypotValue'
    );
  }, [selectedForm, fields]);

  // Submissions scope filter ('current_form' by default, or 'all')
  const [submissionFilterScope, setSubmissionFilterScope] = useState<'current_form' | 'all'>('current_form');

  // Submissions associated with the active form
  const currentFormSubmissions = useMemo(() => {
    if (!selectedForm) return [];
    return submissions.filter((s) => s.formId === selectedForm.id);
  }, [submissions, selectedForm]);

  const displayedSubmissions = useMemo(() => {
    if (submissionFilterScope === 'all') return submissions;
    return currentFormSubmissions;
  }, [submissionFilterScope, submissions, currentFormSubmissions]);

  // Create Web Form Handler
  const handleCreateForm = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!newFormTitle.trim()) {
      showToast('Vui lòng nhập tên biểu mẫu.', 'warning');
      return;
    }
    createWebForm({
      title: newFormTitle.trim(),
      type: newFormType,
      status: 'active',
      embedKey: `nexus_${Date.now()}`,
      workflowConnection: newFormWorkflow,
      description: newFormDescription.trim() || 'Biểu mẫu thu thập thông tin khách hàng tiềm năng qua website.',
      submitAction: newFormSubmitAction,
      successMessage: newFormSuccessMessage.trim() || 'Cảm ơn bạn đã gửi thông tin!',
      fields: createFormFields,
    });
    setNewFormTitle('');
    setNewFormDescription('');
    setCreateFormFields(['fullName', 'email', 'phone', 'company', 'interest']);
    setIsCreateFormModalOpen(false);
  };

  // Open Edit Form Modal (matching Image 5)
  const handleOpenEditFormModal = (): void => {
    if (!selectedForm) return;
    setEditFormTitle(selectedForm.title);
    setEditFormWorkflow(selectedForm.workflowConnection || 'Không liên kết workflow');
    setEditFormDescription(selectedForm.description);
    setEditFormSubmitAction(selectedForm.submitAction || 'Hiển thị tin nhắn');
    setEditFormSuccessMessage(selectedForm.successMessage || 'OK');
    setEditFormStatus(selectedForm.status);
    setEditFormFields(
      selectedForm.fields && selectedForm.fields.length > 0
        ? selectedForm.fields
        : ['fullName', 'email', 'phone', 'company', 'interest']
    );
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
      workflowConnection: editFormWorkflow,
      description: editFormDescription.trim(),
      submitAction: editFormSubmitAction,
      successMessage: editFormSuccessMessage.trim(),
      status: editFormStatus,
      fields: editFormFields,
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
              leftIcon={<TrendingUp size={16} />}
              onClick={() => navigate('/campaigns')}
            >
              Theo Dõi Chiến Dịch
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<GitMerge size={16} />}
              onClick={() => setIsDeduplicationModalOpen(true)}
            >
              Gộp Lead Trùng
            </Button>
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
              Tạo Biểu Mẫu
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
                Trường ({currentFormFields.length})
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
                Lượt Gửi ({currentFormSubmissions.length})
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
                    <span className={styles.infoLabel}>Hành động khi gửi:</span>
                    <span className={styles.infoVal}>{selectedForm.submitAction || 'Hiển thị tin nhắn'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Tin nhắn thành công:</span>
                    <span className={styles.infoVal}>{selectedForm.successMessage || 'Cảm ơn bạn đã gửi thông tin!'}</span>
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
              </div>
            )}

            {/* Tab 2: Trường (Fields Configuration Synchronized to Selected Form) */}
            {activeTab === 'fields' && (
              <div className={styles.tabContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Cấu hình trường của biểu mẫu: <span style={{ color: 'var(--color-primary)' }}>{selectedForm.title}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Đang kích hoạt {currentFormFields.length} trường thu thập độc lập. Mỗi biểu mẫu có cấu hình trường riêng, không bị đè dữ liệu lên nhau.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 size={13} />}
                    onClick={handleOpenEditFormModal}
                  >
                    Chỉnh Sửa Trường Biểu Mẫu
                  </Button>
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
                      {currentFormFields.map((f) => (
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
                      {selectedForm.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '0 0 20px 0' }}>
                      {selectedForm.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {(selectedForm.fields && selectedForm.fields.length > 0
                        ? selectedForm.fields
                        : ['fullName', 'email', 'phone', 'company', 'interest']
                      ).map((fieldKey) => {
                        if (fieldKey === 'fullName') {
                          return (
                            <Input
                              key="fullName"
                              label="Họ và tên của bạn *"
                              placeholder="Ví dụ: Lê Hoàng Long"
                              readOnly
                            />
                          );
                        }
                        if (fieldKey === 'company') {
                          return (
                            <Input
                              key="company"
                              label="Tên công ty / Doanh nghiệp"
                              placeholder="Ví dụ: VietTech Solutions"
                              readOnly
                            />
                          );
                        }
                        if (fieldKey === 'email') {
                          return (
                            <Input
                              key="email"
                              label="Email liên hệ *"
                              placeholder="long@company.com"
                              readOnly
                            />
                          );
                        }
                        if (fieldKey === 'phone') {
                          return (
                            <Input
                              key="phone"
                              label="Số điện thoại *"
                              placeholder="0912 345 678"
                              readOnly
                            />
                          );
                        }
                        if (fieldKey === 'interest') {
                          return (
                            <div key="interest" className={styles.fieldGroup}>
                              <label className={styles.fieldLabel}>Nhu cầu quan tâm</label>
                              <CustomSelect
                                options={INTEREST_OPTIONS}
                                value="crm_consultation"
                                onChange={() => {}}
                                disabled
                                height="47px"
                              />
                            </div>
                          );
                        }
                        if (fieldKey === 'notes') {
                          return (
                            <div key="notes" className={styles.fieldGroup}>
                              <label className={styles.fieldLabel}>Ghi chú / Yêu cầu tùy chỉnh</label>
                              <textarea
                                className={styles.formTextarea}
                                placeholder="Mô tả thêm quy mô doanh nghiệp hoặc tính năng cần tích hợp..."
                                readOnly
                              />
                            </div>
                          );
                        }
                        return null;
                      })}

                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={<Send size={16} />}
                      >
                        {selectedForm.submitAction === 'Chuyển hướng đến liên kết URL'
                          ? 'Đăng Ký & Chuyển Hướng URL'
                          : config.ctaText || 'Gửi Thông Tin Ngay'}
                      </Button>

                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--color-text-muted)',
                          textAlign: 'center',
                          marginTop: '2px',
                        }}
                      >
                        Thông báo hiển thị sau khi gửi:{' '}
                        <strong>&quot;{selectedForm.successMessage || 'Cảm ơn bạn đã gửi thông tin!'}&quot;</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Mã nhúng (Embed Code Generator - S4-01) */}
            {activeTab === 'embed' && (
              <div className={styles.tabContent}>
                <EmbedCodeGenerator form={selectedForm} />
              </div>
            )}

            {/* Tab 5: Lượt gửi (Submissions History with Edit, Delete & Form Isolation) */}
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

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<GitMerge size={14} />}
                      onClick={() => setIsDeduplicationModalOpen(true)}
                    >
                      Quét &amp; Gộp Lead Trùng
                    </Button>
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

                {/* Scope filter & Synchronized status strip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-bg-subtle)', padding: '3px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSubmissionFilterScope('current_form')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: submissionFilterScope === 'current_form' ? 600 : 400,
                        backgroundColor: submissionFilterScope === 'current_form' ? 'var(--color-bg-card)' : 'transparent',
                        color: submissionFilterScope === 'current_form' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        boxShadow: submissionFilterScope === 'current_form' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Chỉ Biểu Mẫu Này ({currentFormSubmissions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmissionFilterScope('all')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: submissionFilterScope === 'all' ? 600 : 400,
                        backgroundColor: submissionFilterScope === 'all' ? 'var(--color-bg-card)' : 'transparent',
                        color: submissionFilterScope === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        boxShadow: submissionFilterScope === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Toàn Bộ Hệ Thống ({submissions.length})
                    </button>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                    Biểu mẫu hiện tại: <strong style={{ color: 'var(--color-text-main)' }}>{selectedForm.title}</strong> (Mã: <code>{selectedForm.embedKey}</code>)
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '22%' }}>Khách Hàng &amp; Doanh Nghiệp</th>
                        <th style={{ width: '22%' }}>Email &amp; Điện Thoại</th>
                        <th style={{ width: '22%' }}>Nhu Cầu &amp; Nguồn Lead</th>
                        <th style={{ width: '13%' }}>Trạng Thái CRM</th>
                        <th style={{ width: '11%' }}>Thời Gian</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '42px 20px', color: 'var(--color-text-muted)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <Clock size={30} style={{ opacity: 0.35, color: 'var(--color-primary)' }} />
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                Biểu mẫu &quot;{selectedForm.title}&quot; chưa có lượt gửi nào
                              </div>
                              <div style={{ fontSize: '0.78rem', maxWidth: '440px', lineHeight: 1.5 }}>
                                Dữ liệu mỗi biểu mẫu được phân tách độc lập để đảm bảo không bị đè thông tin lên nhau. Bạn có thể nạp lead mới bằng cách gửi form nhúng, nạp Excel hoặc tạo card visit.
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<FileSpreadsheet size={13} />}
                                  onClick={() => setIsExcelImportOpen(true)}
                                >
                                  Nhập Excel Cho Biểu Mẫu Này
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  leftIcon={<CreditCard size={13} />}
                                  onClick={() => setIsCreateLeadModalOpen(true)}
                                >
                                  + Thêm Card Visit
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayedSubmissions.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <div>
                                <strong style={{ color: 'var(--color-text-main)', fontSize: '0.84rem' }}>{sub.fullName}</strong>
                                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                                  {sub.company || 'Doanh nghiệp chưa phân loại'}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div style={{ color: 'var(--color-text-main)', fontSize: '0.81rem' }}>{sub.email}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{sub.phone}</div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                  {interestLabelMap[sub.interest] || sub.interest}
                                </div>
                                <div style={{ marginTop: '2px' }}>
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                                      color: 'var(--color-primary)',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {sub.leadSource}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {sub.isSpamBlocked ? (
                                <Badge tone="danger">Từ chối (Spam)</Badge>
                              ) : (
                                <div>
                                  <Badge tone="primary">Mới (New Lead)</Badge>
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#16A34A',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      marginTop: '3px',
                                    }}
                                  >
                                    <CheckCircle2 size={11} />
                                    {sub.ipAddress.includes('Card Visit')
                                      ? 'Card Visit'
                                      : sub.ipAddress.includes('Excel')
                                      ? 'Tệp Excel'
                                      : 'Hợp lệ'}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
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
                                  <Edit2 size={12} /> Sửa
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                  onClick={() => setSubToDelete(sub)}
                                  title="Xóa lead khỏi danh sách"
                                >
                                  <Trash2 size={12} /> Xóa
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
        formId={selectedForm?.id}
      />

      {/* Batch Excel Import Modal (S4-02) */}
      <LeadExcelImport
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        currentFormId={selectedForm?.id}
        forms={forms}
      />

      {/* Lead Deduplication & Merge Modal (S4-04) */}
      <Modal
        isOpen={isDeduplicationModalOpen}
        onClose={() => setIsDeduplicationModalOpen(false)}
        title="Quét &amp; Gộp Lead Trùng Lặp"
        subtitle="Phát hiện và xử lý trùng lặp theo Số điện thoại, Email hoặc Tên công ty"
        maxWidth="xl"
      >
        <LeadDeduplicationView />
      </Modal>

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

            <CustomSelect
              label="Nhu cầu quan tâm"
              options={INTEREST_OPTIONS}
              value={editInterest}
              onChange={(val) => setEditInterest(val as LeadInterestType)}
              height="47px"
            />

            <CustomSelect
              label="Nguồn lead"
              options={LEAD_SOURCE_OPTIONS}
              value={editLeadSource}
              onChange={(val) => setEditLeadSource(val)}
              height="47px"
            />

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

      {/* Create New Form Modal matching Image 4 */}
      <Modal
        isOpen={isCreateFormModalOpen}
        onClose={() => setIsCreateFormModalOpen(false)}
        title="Tạo biểu mẫu web"
        subtitle="Tạo biểu mẫu web mới, định nghĩa các trường và cấu hình hành động khi gửi."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateForm}>
          <div className={styles.modal2ColLayout}>
            {/* Left Column: Form Configuration */}
            <div className={styles.modalFormCol}>
              <div className={styles.formRow2}>
                <Input
                  label="Tên biểu mẫu"
                  placeholder="Thu thập khách hàng tiềm năng Q2"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  required
                />
                <CustomSelect
                  label="Loại biểu mẫu"
                  options={FORM_TYPE_OPTIONS}
                  value={newFormType}
                  onChange={(val) => setNewFormType(val)}
                  height="47px"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Mô tả
                </label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Thu thập khách hàng tiềm năng từ các landing page trả phí."
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                />
              </div>

              <CustomSelect
                label="Liên kết workflow"
                options={WORKFLOW_OPTIONS}
                value={newFormWorkflow}
                onChange={(val) => setNewFormWorkflow(val)}
                height="47px"
              />

              <CustomSelect
                label="Hành động khi gửi"
                options={SUBMIT_ACTION_OPTIONS}
                value={newFormSubmitAction}
                onChange={(val) => setNewFormSubmitAction(val)}
                height="47px"
              />

              <Input
                label="Tin nhắn thành công"
                placeholder="Cảm ơn bạn đã gửi thông tin!"
                value={newFormSuccessMessage}
                onChange={(e) => setNewFormSuccessMessage(e.target.value)}
              />

              <div className={styles.fieldSection}>
                <div className={styles.fieldSectionHeader}>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-main)' }}>Trường biểu mẫu</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                      Nhấp để bật/tắt các trường sẽ hiển thị trong biểu mẫu nhúng.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddMoreCreateField}
                  >
                    + Thêm trường
                  </Button>
                </div>
                <div className={styles.fieldChips}>
                  {AVAILABLE_FORM_FIELDS.map((field) => {
                    const isSelected = createFormFields.includes(field.key);
                    return (
                      <button
                        key={field.key}
                        type="button"
                        className={`${styles.fieldChip} ${isSelected ? styles.fieldChipActive : ''}`}
                        onClick={() => handleToggleCreateField(field.key)}
                        title={`Bật/tắt trường ${field.shortLabel}`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {field.label.replace(/^✓\s*/, '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: PREVIEW TRỰC TIẾP matching Image 4 (Section 8) */}
            <div className={styles.previewCol}>
              <div className={styles.previewHeading}>PREVIEW TRỰC TIẾP</div>
              <div className={styles.previewBrowserFrame}>
                <div className={styles.browserTopBar}>
                  <div className={styles.browserDots}>
                    <span className={styles.browserDot} style={{ backgroundColor: '#EF4444' }} />
                    <span className={styles.browserDot} style={{ backgroundColor: '#F59E0B' }} />
                    <span className={styles.browserDot} style={{ backgroundColor: '#10B981' }} />
                  </div>
                  <span className={styles.browserUrl}>yoursite.com/form</span>
                </div>
                <div className={styles.previewFormContent}>
                  <h4 className={styles.previewFormTitle}>
                    {newFormTitle.trim() || 'Tên biểu mẫu'}
                  </h4>
                  {newFormDescription.trim() && (
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', margin: '2px 0 4px 0', lineHeight: 1.4 }}>
                      {newFormDescription}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {createFormFields.map((fieldKey) => {
                      const fieldDef = AVAILABLE_FORM_FIELDS.find((f) => f.key === fieldKey);
                      if (!fieldDef) return null;
                      return (
                        <div key={fieldDef.key} className={styles.previewMockInput}>
                          <span className={styles.previewMockLabel}>{fieldDef.mockLabel}</span>
                          <span style={{ color: '#E2E8F0', fontSize: '0.74rem' }}>{fieldDef.mockValue}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.previewSubmitBtn}>
                    {newFormSubmitAction === 'Chuyển hướng đến liên kết URL' ? 'Đăng ký & Chuyển hướng' : 'Gửi thông tin'}
                  </div>
                </div>
              </div>
            </div>
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

      {/* Edit Form Modal matching Image 5 */}
      <Modal
        isOpen={isEditFormModalOpen}
        onClose={() => setIsEditFormModalOpen(false)}
        title="Chỉnh sửa biểu mẫu web"
        subtitle="Cập nhật thông tin biểu mẫu và thay thế danh sách trường khi cần để đồng bộ với luồng embed."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditForm} className={styles.modalForm}>
          <div className={styles.formRow2}>
            <Input
              label="Tên biểu mẫu"
              value={editFormTitle}
              onChange={(e) => setEditFormTitle(e.target.value)}
              required
            />
            <CustomSelect
              label="Liên kết workflow"
              options={WORKFLOW_OPTIONS}
              value={editFormWorkflow}
              onChange={(val) => setEditFormWorkflow(val)}
              height="47px"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Mô tả
            </label>
            <textarea
              className={styles.formTextarea}
              value={editFormDescription}
              onChange={(e) => setEditFormDescription(e.target.value)}
            />
          </div>

          <CustomSelect
            label="Hành động khi gửi"
            options={SUBMIT_ACTION_OPTIONS}
            value={editFormSubmitAction}
            onChange={(val) => setEditFormSubmitAction(val)}
            height="47px"
          />

          <Input
            label="Tin nhắn thành công"
            value={editFormSuccessMessage}
            onChange={(e) => setEditFormSuccessMessage(e.target.value)}
          />

          <div className={styles.toggleRow}>
            <div>
              <strong style={{ fontSize: '0.84rem', color: 'var(--color-text-main)' }}>
                Biểu mẫu đang hoạt động
              </strong>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                Tắt tùy chọn này để ngừng nhận lượt gửi mới qua mã nhúng.
              </div>
            </div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={editFormStatus === 'active'}
                onChange={(e) => setEditFormStatus(e.target.checked ? 'active' : 'inactive')}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.fieldSection}>
            <div className={styles.fieldSectionHeader}>
              <div>
                <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-main)' }}>Trường biểu mẫu</strong>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  Cập nhật, đổi thứ tự, thêm hoặc xóa các trường của biểu mẫu này.
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddMoreEditField}
              >
                + Thêm trường
              </Button>
            </div>
            <div className={styles.fieldChips}>
              {AVAILABLE_FORM_FIELDS.map((field) => {
                const isSelected = editFormFields.includes(field.key);
                return (
                  <button
                    key={field.key}
                    type="button"
                    className={`${styles.fieldChip} ${isSelected ? styles.fieldChipActive : ''}`}
                    onClick={() => handleToggleEditField(field.key)}
                    title={`Bật/tắt trường ${field.shortLabel}`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {field.label.replace(/^✓\s*/, '')}
                  </button>
                );
              })}
            </div>
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
