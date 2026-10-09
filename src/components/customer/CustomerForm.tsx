import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  FileText,
} from 'lucide-react';
import { ICustomer, CreateCustomerDTO, CustomerStatusType, CustomerTierType } from '../../interfaces';
import { customerService } from '../../services/customerService';
import { Button, Input, Modal } from '../common';
import { showGlobalToast } from '../../context/ToastContext';

interface ICustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: ICustomer) => void;
  customerToEdit?: ICustomer | null;
}

export const CustomerForm: React.FC<ICustomerFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const isEdit = Boolean(customerToEdit);

  const [formData, setFormData] = useState<CreateCustomerDTO>({
    company: '',
    taxCode: '',
    fullName: '',
    role: 'Người đại diện',
    companyDomain: '',
    email: '',
    phone: '',
    industry: 'Công nghệ thông tin & Viễn thông',
    tier: 'Enterprise',
    location: 'Hà Nội, Việt Nam',
    website: '',
    status: 'New Lead' as CustomerStatusType,
    dealValue: 50000000,
    totalContractValue: 50000000,
    tags: ['Enterprise'],
    summary: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        company: customerToEdit.company || '',
        taxCode: customerToEdit.taxCode || '',
        fullName: customerToEdit.fullName || '',
        role: customerToEdit.role || 'Người đại diện',
        companyDomain: customerToEdit.companyDomain || '',
        email: customerToEdit.email || '',
        phone: customerToEdit.phone || '',
        industry: customerToEdit.industry || 'Công nghệ thông tin & Viễn thông',
        tier: (customerToEdit.tier as CustomerTierType) || 'Enterprise',
        location: customerToEdit.location || 'Hà Nội, Việt Nam',
        website: customerToEdit.website || '',
        status: (customerToEdit.status as CustomerStatusType) || 'New Lead',
        dealValue: customerToEdit.totalContractValue || customerToEdit.dealValue || 0,
        totalContractValue: customerToEdit.totalContractValue || customerToEdit.dealValue || 0,
        tags: customerToEdit.tags || ['Enterprise'],
        summary: customerToEdit.summary || customerToEdit.notesSummary || '',
      });
    } else {
      setFormData({
        company: '',
        taxCode: '',
        fullName: '',
        role: 'Người đại diện',
        companyDomain: '',
        email: '',
        phone: '',
        industry: 'Công nghệ thông tin & Viễn thông',
        tier: 'Enterprise',
        location: 'Hà Nội, Việt Nam',
        website: '',
        status: 'New Lead' as CustomerStatusType,
        dealValue: 50000000,
        totalContractValue: 50000000,
        tags: ['Enterprise'],
        summary: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [customerToEdit, isOpen]);

  const validateMST = (mst: string): string | undefined => {
    if (!mst.trim()) return undefined;
    const cleaned = mst.trim().replace(/\s+/g, '');
    const regex = /^(\d{10}|\d{10}-\d{3}|\d{13})$/;
    if (!regex.test(cleaned)) {
      return 'MST chuẩn gồm 10 chữ số (hoặc 13 chữ số có dấu gạch nối, VD: 0101234567 hoặc 0101234567-001).';
    }
    return undefined;
  };

  const handleInputChange = (field: keyof CreateCustomerDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (field === 'taxCode') {
      const err = validateMST(value);
      if (err) {
        setErrors((prev) => ({ ...prev, taxCode: err }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Tên doanh nghiệp không được để trống';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Tên người đại diện không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    }

    if (formData.taxCode) {
      const mstError = validateMST(formData.taxCode);
      if (mstError) {
        newErrors.taxCode = mstError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let savedCustomer: ICustomer;

      if (isEdit && customerToEdit) {
        savedCustomer = await customerService.updateCustomer(customerToEdit.id, {
          company: formData.company,
          taxCode: formData.taxCode || undefined,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          industry: formData.industry,
          tier: formData.tier,
          location: formData.location,
          website: formData.website,
          status: formData.status,
          totalContractValue: formData.totalContractValue,
          notesSummary: formData.summary,
        });
        showGlobalToast(`Đã cập nhật hồ sơ khách hàng "${savedCustomer.company}" thành công!`, 'success');
      } else {
        savedCustomer = await customerService.createCustomer({
          ...formData,
          taxCode: formData.taxCode?.trim() || undefined,
        });
        showGlobalToast(`Đã thêm mới khách hàng "${savedCustomer.company}" thành công!`, 'success');
      }

      onSuccess(savedCustomer);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lưu khách hàng:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Lỗi máy chủ hoặc trùng lặp Mã số thuế (MST). Vui lòng kiểm tra lại.';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map((d: any) => d.msg).join(', ');
      }
      setSubmitError(errMsg);
      showGlobalToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa Hồ sơ Khách hàng Doanh nghiệp' : 'Thêm mới Khách hàng Doanh nghiệp'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {submitError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {submitError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Input
              label="Tên doanh nghiệp *"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="VD: Tập đoàn Vingroup, FPT Software..."
              leftIcon={<Building2 size={16} />}
              error={errors.company}
            />
          </div>

          <div>
            <Input
              label="Mã số thuế (MST)"
              value={formData.taxCode || ''}
              onChange={(e) => handleInputChange('taxCode', e.target.value)}
              placeholder="VD: 0101234567 hoặc 0101234567-001"
              leftIcon={<FileText size={16} />}
              error={errors.taxCode}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Input
              label="Người đại diện / Liên hệ chính *"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="VD: Ông Nguyễn Văn A"
              leftIcon={<User size={16} />}
              error={errors.fullName}
            />
          </div>

          <div>
            <Input
              label="Số điện thoại liên hệ *"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="VD: 0912345678"
              leftIcon={<Phone size={16} />}
              error={errors.phone}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Input
              label="Email công việc *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="VD: contact@doanhnghiep.vn"
              leftIcon={<Mail size={16} />}
              error={errors.email}
            />
          </div>

          <div>
            <Input
              label="Website doanh nghiệp"
              value={formData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="VD: https://doanhnghiep.vn"
              leftIcon={<Globe size={16} />}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Lĩnh vực / Ngành nghề hoạt động
            </label>
            <select
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
              }}
            >
              <option value="Công nghệ thông tin & Viễn thông">Công nghệ thông tin & Viễn thông</option>
              <option value="Tài chính - Ngân hàng - Bảo hiểm">Tài chính - Ngân hàng - Bảo hiểm</option>
              <option value="Sản xuất & Công nghiệp nặng">Sản xuất & Công nghiệp nặng</option>
              <option value="Bán lẻ & Thương mại điện tử">Bán lẻ & Thương mại điện tử</option>
              <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
              <option value="Y tế & Chăm sóc sức khỏe">Y tế & Chăm sóc sức khỏe</option>
              <option value="Giáo dục & Đào tạo">Giáo dục & Đào tạo</option>
              <option value="Logistics & Chuỗi cung ứng">Logistics & Chuỗi cung ứng</option>
              <option value="Khác">Lĩnh vực khác</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Phân khúc khách hàng (Tier)
            </label>
            <select
              value={formData.tier}
              onChange={(e) => handleInputChange('tier', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
              }}
            >
              <option value="Enterprise">Enterprise (Doanh nghiệp VIP/Chiến lược)</option>
              <option value="Mid-Market">Mid-Market (Doanh nghiệp tầm trung)</option>
              <option value="Growth">Growth (Doanh nghiệp tăng trưởng)</option>
              <option value="Startup">Startup (Khởi nghiệp / SME)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Trạng thái hợp tác
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
              }}
            >
              <option value="New Lead">Tiềm năng mới (New Lead)</option>
              <option value="Negotiation">Đang đàm phán (Negotiation)</option>
              <option value="Active">Đang hợp tác (Active)</option>
              <option value="At Risk">Cần chú ý (At Risk)</option>
              <option value="Churned">Đã ngừng hợp tác (Churned)</option>
            </select>
          </div>

          <div>
            <Input
              label="Quy mô hợp đồng (VNĐ)"
              type="number"
              value={String(formData.totalContractValue || formData.dealValue || 0)}
              onChange={(e) => handleInputChange('totalContractValue', Number(e.target.value))}
              placeholder="VD: 150000000"
              leftIcon={<DollarSign size={16} />}
            />
          </div>
        </div>

        <div>
          <Input
            label="Địa chỉ trụ sở / Khu vực"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="VD: Tòa nhà Keangnam, Mễ Trì, Nam Từ Liêm, Hà Nội"
            leftIcon={<MapPin size={16} />}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Ghi chú / Tóm tắt hồ sơ
          </label>
          <textarea
            value={formData.summary || ''}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            placeholder="Thông tin giới thiệu, bối cảnh nhu cầu của doanh nghiệp..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo hồ sơ khách hàng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
