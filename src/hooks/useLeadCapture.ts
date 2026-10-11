import { useState, useCallback, useMemo } from 'react';
import {
  ICreateManualLeadDTO,
  IEmbedFormConfig,
  IEmbedFormField,
  ILeadCaptureStats,
  ILeadSubmission,
  ILeadSubmissionDTO,
  IWebFormItem,
} from '../interfaces/lead-capture.interface';
import {
  DEFAULT_FORM_FIELDS,
  leadCaptureService,
} from '../services/leadCaptureService';
import { useCRMData } from '../context/CRMDataContext';
import { useToast } from '../context/ToastContext';

export function useLeadCapture() {
  const { addCustomer, addCustomerActivity } = useCRMData();
  const { showToast } = useToast();

  const [forms, setForms] = useState<IWebFormItem[]>(() =>
    leadCaptureService.getWebForms()
  );
  const [selectedFormId, setSelectedFormId] = useState<string>(() => {
    const list = leadCaptureService.getWebForms();
    return list.length > 0 ? list[0].id : 'form-web-01';
  });

  const [config, setConfig] = useState<IEmbedFormConfig>(() =>
    leadCaptureService.getConfig()
  );
  const [submissions, setSubmissions] = useState<ILeadSubmission[]>(() =>
    leadCaptureService.getSubmissions()
  );
  const [stats, setStats] = useState<ILeadCaptureStats>(() =>
    leadCaptureService.getStats()
  );
  const [fields] = useState<IEmbedFormField[]>(DEFAULT_FORM_FIELDS);

  const selectedForm = useMemo(() => {
    return forms.find((f) => f.id === selectedFormId) || forms[0] || null;
  }, [forms, selectedFormId]);

  const reload = useCallback(() => {
    const updatedForms = leadCaptureService.getWebForms();
    setForms(updatedForms);
    setConfig(leadCaptureService.getConfig());
    setSubmissions(leadCaptureService.getSubmissions());
    setStats(leadCaptureService.getStats());
  }, []);

  const updateConfig = useCallback((partial: Partial<IEmbedFormConfig>) => {
    const updated = leadCaptureService.updateConfig(partial);
    setConfig(updated);
  }, []);

  const resetConfig = useCallback(() => {
    const reset = leadCaptureService.resetConfigToDefault();
    setConfig(reset);
    showToast('Đã khôi phục cấu hình biểu mẫu về mặc định ban đầu.', 'info');
  }, [showToast]);

  const iframeCode = useMemo(() => {
    return leadCaptureService.generateIframeCode(config);
  }, [config]);

  const scriptCode = useMemo(() => {
    return leadCaptureService.generateScriptCode(config);
  }, [config]);

  const createWebForm = useCallback(
    (item: Omit<IWebFormItem, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'submissionsCount' | 'conversionRate'>): IWebFormItem => {
      const created = leadCaptureService.createWebForm(item);
      reload();
      setSelectedFormId(created.id);
      showToast(`Đã tạo biểu mẫu mới "${created.title}" thành công!`, 'success');
      return created;
    },
    [reload, showToast]
  );

  const updateWebForm = useCallback(
    (id: string, partial: Partial<IWebFormItem>): IWebFormItem | null => {
      const updated = leadCaptureService.updateWebForm(id, partial);
      if (updated) {
        reload();
        showToast(`Đã cập nhật thông tin biểu mẫu "${updated.title}"!`, 'success');
      }
      return updated;
    },
    [reload, showToast]
  );

  const deleteWebForm = useCallback(
    (id: string): boolean => {
      const form = forms.find((f) => f.id === id);
      const title = form ? form.title : 'Biểu mẫu';
      const success = leadCaptureService.deleteWebForm(id);
      if (success) {
        reload();
        const remaining = leadCaptureService.getWebForms();
        if (remaining.length > 0) {
          setSelectedFormId(remaining[0].id);
        }
        showToast(`Đã xóa biểu mẫu "${title}" khỏi hệ thống!`, 'success');
        return true;
      }
      showToast('Không thể xóa biểu mẫu này.', 'error');
      return false;
    },
    [forms, reload, showToast]
  );

  const submitLead = useCallback(
    (
      dto: ILeadSubmissionDTO,
      ipAddress: string = '127.0.0.1'
    ): {
      success: boolean;
      message: string;
      isSpam?: boolean;
      isRateLimited?: boolean;
      retryAfter?: number;
    } => {
      const result = leadCaptureService.submitLead(dto, ipAddress);
      reload();

      if (!result.success) {
        if (result.isSpam) {
          showToast('Cảnh báo: Hành vi tự động (Spam) đã bị chặn bởi Honeypot Trap.', 'error');
          return {
            success: false,
            message: result.error || 'Yêu cầu bị từ chối do nghi vấn spam.',
            isSpam: true,
          };
        }
        if (result.isRateLimited) {
          showToast(
            `Giới hạn tần suất IP: ${result.error || 'Vui lòng chờ ít phút.'}`,
            'warning'
          );
          return {
            success: false,
            message: result.error || 'Đã vượt quá giới hạn gửi biểu mẫu từ địa chỉ IP này.',
            isRateLimited: true,
            retryAfter: result.retryAfterSeconds,
          };
        }
        showToast(result.error || 'Có lỗi xảy ra khi gửi thông tin.', 'error');
        return {
          success: false,
          message: result.error || 'Gửi thất bại.',
        };
      }

      // Automatically create a new Customer/Lead in the CRM system with status "New Lead"
      try {
        const interestLabelMap: Record<string, string> = {
          crm_consultation: 'Tư vấn Giải pháp Quản trị Khách hàng',
          enterprise_pricing: 'Báo giá Gói Doanh nghiệp Enterprise',
          system_integration: 'Tích hợp Hệ thống & API Webhook',
          product_demo: 'Đăng ký Demo Trải nghiệm Phần mềm',
          partnership: 'Hợp tác Đại lý & Đối tác Triển khai',
          other: 'Yêu cầu Tư vấn Tùy chỉnh',
        };

        const interestName = interestLabelMap[dto.interest] || dto.interest;
        const sourceLabel = `Web Form: ${dto.leadSource || config.leadSource}`;

        const createdCustomer = addCustomer({
          fullName: dto.fullName,
          role: 'Người liên hệ từ Website',
          email: dto.email,
          phone: dto.phone,
          company: dto.company,
          companyDomain: `${dto.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          industry: 'Dịch vụ & Công nghệ',
          location: 'Việt Nam',
          tier: 'Growth',
          status: 'New Lead', // Trạng thái Mới theo đúng yêu cầu
          dealValue: 20000000,
          ownerName: 'Đội ngũ Marketing & Tiếp nhận Lead',
          tags: [sourceLabel, 'Lead Inbound Website', 'Trạng thái Mới'],
          summary: `Khách hàng tiềm năng tự gửi thông tin qua biểu mẫu nhúng trên website. Nhu cầu: ${interestName}.${dto.notes ? ` Ghi chú: ${dto.notes}` : ''}`,
        });

        // Ghi nhật ký tiếp nhận tương tác
        addCustomerActivity(
          createdCustomer.id,
          `Tiếp nhận Lead mới từ Biểu mẫu Website: ${dto.fullName}`,
          `[Nguồn: ${sourceLabel}] Email: ${dto.email}, SĐT: ${dto.phone}, Công ty: ${dto.company}. Nhu cầu quan tâm: ${interestName}.`,
          'email',
          'Hệ thống Thu thập Lead Website'
        );

        showToast(
          `Gửi thành công! Đã tạo Lead mới "${dto.fullName}" ở trạng thái "Mới" trong hệ thống!`,
          'success'
        );

        return {
          success: true,
          message: config.successMessage || 'Gửi yêu cầu thành công!',
        };
      } catch (err) {
        console.error('Error creating CRM customer from web lead:', err);
        showToast('Đã tiếp nhận yêu cầu từ biểu mẫu thành công!', 'success');
        return {
          success: true,
          message: config.successMessage || 'Gửi yêu cầu thành công!',
        };
      }
    },
    [addCustomer, addCustomerActivity, config.leadSource, config.successMessage, reload, showToast]
  );

  const createManualLead = useCallback(
    (dto: ICreateManualLeadDTO, formId?: string): { success: boolean; submission?: ILeadSubmission; message?: string } => {
      // Validate mandatory leadSource
      if (!dto.leadSource || !dto.leadSource.trim()) {
        showToast('Lỗi: Mọi lead nhập vào hệ thống đều bắt buộc phải có nguồn!', 'error');
        return { success: false, message: 'Nguồn lead là bắt buộc' };
      }

      try {
        const sub = leadCaptureService.createManualLead(dto, formId);
        reload();

        const interestLabelMap: Record<string, string> = {
          crm_consultation: 'Tư vấn CRM Doanh nghiệp',
          enterprise_pricing: 'Báo giá Gói Enterprise',
          system_integration: 'Tích hợp API Webhook',
          product_demo: 'Trải nghiệm Bản Demo',
          partnership: 'Hợp tác Đại lý & Đối tác',
          other: 'Yêu cầu tùy chỉnh khác',
        };
        const interestName = interestLabelMap[dto.interest] || dto.interest;

        const createdCustomer = addCustomer({
          fullName: dto.fullName.trim(),
          role: dto.role?.trim() || 'Người liên hệ từ sự kiện',
          email: dto.email.trim(),
          phone: dto.phone.trim(),
          company: dto.company.trim(),
          companyDomain: `${dto.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.vn`,
          industry: 'Dịch vụ & Doanh nghiệp',
          location: 'Việt Nam',
          tier: 'Growth',
          status: 'New Lead',
          dealValue: 25000000,
          ownerName: 'Chuyên viên Tiếp nhận Lead',
          tags: [`Nguồn: ${dto.leadSource.trim()}`, 'Card Visit / Sự kiện', 'Trạng thái Mới'],
          summary: `Lead được nhập thủ công từ ${dto.leadSource.trim()}. Chức danh: ${dto.role || 'N/A'}. Nhu cầu quan tâm: ${interestName}.${dto.notes ? ` Ghi chú card visit: ${dto.notes}` : ''}`,
        });

        addCustomerActivity(
          createdCustomer.id,
          `Tiếp nhận Lead thủ công từ danh thiếp: ${dto.fullName}`,
          `[Nguồn: ${dto.leadSource}] Chức vụ: ${dto.role || 'N/A'}, Công ty: ${dto.company}, Email: ${dto.email}, SĐT: ${dto.phone}.${dto.notes ? ` Ghi chú: ${dto.notes}` : ''}`,
          'note',
          'Chuyên viên Marketing & Sự kiện'
        );

        showToast(
          `Đã tạo lead thủ công "${dto.fullName.trim()}" từ nguồn "${dto.leadSource.trim()}" thành công!`,
          'success'
        );

        return { success: true, submission: sub };
      } catch (err) {
        console.error('Failed to create manual lead:', err);
        showToast('Có lỗi xảy ra khi tạo lead thủ công.', 'error');
        return { success: false, message: 'Lỗi hệ thống' };
      }
    },
    [addCustomer, addCustomerActivity, reload, showToast]
  );

  const batchImportLeads = useCallback(
    (dtos: ICreateManualLeadDTO[], formId?: string): { success: boolean; importedCount: number } => {
      if (!dtos || dtos.length === 0) {
        showToast('Không có dữ liệu hợp lệ để nhập vào hệ thống.', 'warning');
        return { success: false, importedCount: 0 };
      }

      // Check that every lead has a leadSource
      const missingSource = dtos.find((d) => !d.leadSource || !d.leadSource.trim());
      if (missingSource) {
        showToast('Lỗi: Tất cả lead nhập vào đều bắt buộc phải có nguồn!', 'error');
        return { success: false, importedCount: 0 };
      }

      try {
        const subs = leadCaptureService.batchImportLeads(dtos, formId);
        reload();

        dtos.forEach((dto) => {
          const createdCustomer = addCustomer({
            fullName: dto.fullName.trim(),
            role: dto.role?.trim() || 'Người liên hệ từ hội thảo',
            email: dto.email.trim(),
            phone: dto.phone.trim(),
            company: dto.company.trim(),
            companyDomain: `${dto.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.vn`,
            industry: 'Doanh nghiệp Hội thảo',
            location: 'Việt Nam',
            tier: 'Growth',
            status: 'New Lead',
            dealValue: 20000000,
            ownerName: 'Đội ngũ Marketing & Tiếp nhận Lead',
            tags: [`Nguồn: ${dto.leadSource.trim()}`, 'Nhập Excel / CSV', 'Trạng thái Mới'],
            summary: `Lead nhập hàng loạt từ tệp Excel/CSV hội thảo. Nguồn: ${dto.leadSource}. Chức danh: ${dto.role || 'N/A'}.${dto.notes ? ` Ghi chú: ${dto.notes}` : ''}`,
          });

          addCustomerActivity(
            createdCustomer.id,
            `Nhập Lead hàng loạt từ tệp Excel: ${dto.fullName}`,
            `[Nguồn: ${dto.leadSource}] Chức danh: ${dto.role || 'N/A'}, Công ty: ${dto.company}, Email: ${dto.email}, SĐT: ${dto.phone}`,
            'note',
            'Hệ thống Nhập Lead Excel'
          );
        });

        showToast(
          `Đã nhập thành công ${subs.length} lead từ tệp Excel vào hệ thống CRM ở trạng thái "Mới"!`,
          'success'
        );

        return { success: true, importedCount: subs.length };
      } catch (err) {
        console.error('Failed to batch import leads:', err);
        showToast('Có lỗi xảy ra khi nhập lead hàng loạt.', 'error');
        return { success: false, importedCount: 0 };
      }
    },
    [addCustomer, addCustomerActivity, reload, showToast]
  );

  const updateSubmission = useCallback(
    (id: string, partial: Partial<ILeadSubmission>): boolean => {
      const res = leadCaptureService.updateSubmission(id, partial);
      if (res) {
        reload();
        return true;
      }
      return false;
    },
    [reload]
  );

  const deleteSubmission = useCallback(
    (id: string): boolean => {
      const success = leadCaptureService.deleteSubmission(id);
      if (success) {
        reload();
        return true;
      }
      return false;
    },
    [reload]
  );

  return {
    forms,
    selectedForm,
    setSelectedFormId,
    config,
    updateConfig,
    resetConfig,
    submissions,
    stats,
    fields,
    iframeCode,
    scriptCode,
    submitLead,
    updateSubmission,
    deleteSubmission,
    createManualLead,
    batchImportLeads,
    createWebForm,
    updateWebForm,
    deleteWebForm,
    reload,
  };
}
