import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  DollarSign,
  Globe,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Input } from '../components/common';
import { useCRMData } from '../context/CRMDataContext';
import {
  CreateCustomerDTO,
  CustomerStatusType,
  CustomerTierType,
  ICustomField,
} from '../interfaces';
import { createAvatarSvgDataUri, formatCurrency } from '../utils/formatters';
import { sprint2Service } from '../services/sprint2Service';
import { CustomFieldRenderer } from '../components/custom-fields/CustomFieldRenderer';
import styles from './CreateCustomerPage.module.css';

interface IFormErrors {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyDomain?: string;
  dealValue?: string;
}

export const CreateCustomerPage: React.FC = () => {
  const { addCustomer } = useCRMData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateCustomerDTO>({
    fullName: '',
    role: '',
    email: '',
    phone: '',
    company: '',
    companyDomain: '',
    industry: 'Trí tuệ Nhân tạo & Đám mây',
    location: 'Hà Nội, Việt Nam',
    tier: 'Enterprise',
    status: 'New Lead',
    dealValue: 145000,
    ownerName: 'Quản Trị Viên Hệ Thống',
    tags: ['Enterprise', 'Quý 3'],
    summary: '',
  });

  const [tagInput, setTagInput] = useState<string>('');
  const [errors, setErrors] = useState<IFormErrors>({});

  // Custom Fields State
  const [customFields, setCustomFields] = useState<ICustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | number>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      try {
        const fields = await sprint2Service.getCustomFields('customer');
        setCustomFields(fields);
        const initialValues: Record<string, string | number> = {};
        fields.forEach((f) => {
          if (f.default_value) {
            initialValues[f.field_name] = f.default_value;
          }
        });
        setCustomFieldValues(initialValues);
      } catch {
        // Fallback
      }
    })();
  }, []);

  const validateSingleField = (
    field: keyof CreateCustomerDTO,
    value: string | number
  ): string | undefined => {
    const strVal = String(value).trim();
    switch (field) {
      case 'fullName':
        if (strVal.length < 3) return 'Họ và tên phải có ít nhất 3 ký tự.';
        return undefined;
      case 'role':
        if (strVal.length < 2) return 'Vui lòng nhập chức vụ của người đại diện.';
        return undefined;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
          return 'Vui lòng nhập email công việc hợp lệ (VD: ten@congty.vn).';
        }
        return undefined;
      case 'phone':
        if (strVal.length < 7) return 'Vui lòng nhập số điện thoại liên hệ hợp lệ.';
        return undefined;
      case 'company':
        if (strVal.length < 2) return 'Tên doanh nghiệp không được để trống.';
        return undefined;
      case 'companyDomain':
        if (strVal && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(strVal)) {
          return 'Tên miền cần có định dạng chuẩn (VD: congty.vn)';
        }
        return undefined;
      case 'dealValue':
        if (Number(value) <= 0) return 'Giá trị hợp đồng năm phải lớn hơn $0.';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = <K extends keyof CreateCustomerDTO>(
    field: K,
    value: CreateCustomerDTO[K]
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (
      field === 'fullName' ||
      field === 'role' ||
      field === 'email' ||
      field === 'phone' ||
      field === 'company' ||
      field === 'companyDomain' ||
      field === 'dealValue'
    ) {
      const errMsg = validateSingleField(field, String(value));
      setErrors((prev) => ({ ...prev, [field]: errMsg }));
    }
  };

  const handleAddTag = (): void => {
    const cleaned = tagInput.trim();
    if (!cleaned || formData.tags.includes(cleaned)) return;
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, cleaned] }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handlePrefillSample = (): void => {
    setFormData({
      fullName: 'Phạm Hoàng Nam',
      role: 'Giám đốc Khối Hạ tầng Số',
      email: 'nam.pham@viettelcloud.vn',
      phone: '+84 (098) 890-4810',
      company: 'Viettel Cloud Enterprise',
      companyDomain: 'viettelcloud.vn',
      industry: 'Hạ tầng Điện toán Đám mây & AI',
      location: 'Hà Nội, Việt Nam',
      tier: 'Enterprise',
      status: 'Negotiation',
      dealValue: 320000,
      ownerName: 'Quản Trị Viên Hệ Thống',
      tags: ['Việt Nam Enterprise', 'Hạ tầng AI', 'Đa năm'],
      summary:
        'Triển khai hệ thống quản trị doanh thu cho 450 tài khoản khối khách hàng doanh nghiệp với tiêu chuẩn bảo mật SOC2.',
    });
    setCustomFieldValues({
      tax_code: '0108923456',
      employee_count: 450,
      deployment_type: 'Cloud SaaS',
      target_launch_date: '2026-11-20',
    });
    setErrors({});
    setCustomFieldErrors({});
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const nextErrors: IFormErrors = {
      fullName: validateSingleField('fullName', formData.fullName),
      role: validateSingleField('role', formData.role),
      email: validateSingleField('email', formData.email),
      phone: validateSingleField('phone', formData.phone),
      company: validateSingleField('company', formData.company),
      companyDomain: validateSingleField('companyDomain', formData.companyDomain),
      dealValue: validateSingleField('dealValue', formData.dealValue),
    };
    setErrors(nextErrors);

    // Validate required custom fields
    const nextCustomErrors: Record<string, string> = {};
    customFields.forEach((cf) => {
      if (cf.is_required) {
        const val = customFieldValues[cf.field_name];
        if (val === undefined || val === null || String(val).trim() === '') {
          nextCustomErrors[cf.field_name] = `Vui lòng nhập ${cf.field_label.toLowerCase()}.`;
        }
      }
    });
    setCustomFieldErrors(nextCustomErrors);

    const hasError = Object.values(nextErrors).some((msg) => Boolean(msg));
    const hasCustomError = Object.keys(nextCustomErrors).length > 0;
    if (hasError || hasCustomError) return;

    const created = addCustomer({
      ...formData,
      custom_fields: customFieldValues,
    });
    navigate(`/customers/${created.id}`);
  };

  return (
    <div className={styles.createPage}>
      <div className={styles.topActionRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft size={16} />
          <span>Quay lại Danh bạ</span>
        </button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Sparkles size={14} />}
          onClick={handlePrefillSample}
        >
          Điền nhanh Dữ liệu Mẫu
        </Button>
      </div>

      <header className={styles.headerBlock}>
        <div>
          <h1 className={styles.headerBlock__title}>Thêm Hồ sơ Khách hàng Mới</h1>
          <p className={styles.headerBlock__subtitle}>
            Thiết lập thông tin người đại diện, hồ sơ doanh nghiệp và dự báo giá trị hợp đồng năm.
          </p>
        </div>

        {/* Xem trước trực tiếp */}
        <div className={styles.livePreviewPill}>
          <Avatar
            src={createAvatarSvgDataUri(formData.fullName || 'Khach Hang Moi', 2)}
            name={formData.fullName || 'Khách hàng mới'}
            size="md"
          />
          <div>
            <strong>{formData.fullName || 'Họ và tên người đại diện'}</strong>
            <span>
              {formData.company || 'Tên doanh nghiệp'} ·{' '}
              <b className="tabular-nums">{formatCurrency(formData.dealValue || 0)}</b>
            </span>
          </div>
          <Badge tone="primary" size="sm">
            {formData.tier}
          </Badge>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.multiSectionForm} noValidate>
        {/* PHẦN 1: Thông tin Người đại diện */}
        <motion.section
          className={styles.formSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className={styles.formSection__meta}>
            <span className={styles.formSection__step}>PHẦN 01</span>
            <h2 className={styles.formSection__title}>Thông tin Người đại diện</h2>
            <p className={styles.formSection__desc}>
              Người ra quyết định chính hoặc đầu mối phụ trách ký kết hợp đồng.
            </p>
          </div>

          <Card padding="lg" className={styles.formSection__fieldsCard}>
            <div className={styles.grid2Col}>
              <Input
                label="Họ và tên người đại diện *"
                floatingLabel
                value={formData.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                error={errors.fullName}
                isValid={formData.fullName.trim().length >= 3 && !errors.fullName}
                leftIcon={<User size={16} />}
              />

              <Input
                label="Chức vụ / Vai trò *"
                floatingLabel
                value={formData.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                error={errors.role}
                isValid={formData.role.trim().length >= 2 && !errors.role}
              />

              <Input
                label="Địa chỉ Email công việc *"
                type="email"
                floatingLabel
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                error={errors.email}
                isValid={formData.email.includes('@') && !errors.email}
                leftIcon={<Mail size={16} />}
              />

              <Input
                label="Số điện thoại liên hệ *"
                type="tel"
                floatingLabel
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                error={errors.phone}
                isValid={formData.phone.trim().length >= 7 && !errors.phone}
                leftIcon={<Phone size={16} />}
              />
            </div>
          </Card>
        </motion.section>

        {/* PHẦN 2: Hồ sơ Tổ chức & Doanh nghiệp */}
        <motion.section
          className={styles.formSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
        >
          <div className={styles.formSection__meta}>
            <span className={styles.formSection__step}>PHẦN 02</span>
            <h2 className={styles.formSection__title}>Hồ sơ Doanh nghiệp</h2>
            <p className={styles.formSection__desc}>
              Tên miền chính thức, ngành nghề hoạt động và khu vực trụ sở chính.
            </p>
          </div>

          <Card padding="lg" className={styles.formSection__fieldsCard}>
            <div className={styles.grid2Col}>
              <Input
                label="Tên Công ty / Tổ chức *"
                floatingLabel
                value={formData.company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                error={errors.company}
                isValid={formData.company.trim().length >= 2 && !errors.company}
                leftIcon={<Building2 size={16} />}
              />

              <Input
                label="Tên miền Website (VD: fpt.com)"
                floatingLabel
                value={formData.companyDomain}
                onChange={(e) => handleFieldChange('companyDomain', e.target.value)}
                error={errors.companyDomain}
                isValid={formData.companyDomain.includes('.') && !errors.companyDomain}
                leftIcon={<Globe size={16} />}
              />

              <Input
                label="Lĩnh vực / Ngành nghề"
                floatingLabel
                value={formData.industry}
                onChange={(e) => handleFieldChange('industry', e.target.value)}
                isValid={Boolean(formData.industry)}
              />

              <Input
                label="Địa điểm Trụ sở chính"
                floatingLabel
                value={formData.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                isValid={Boolean(formData.location)}
                leftIcon={<MapPin size={16} />}
              />
            </div>
          </Card>
        </motion.section>

        {/* PHẦN 3: Giá trị Thương mại & Phân bổ */}
        <motion.section
          className={styles.formSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
        >
          <div className={styles.formSection__meta}>
            <span className={styles.formSection__step}>PHẦN 03</span>
            <h2 className={styles.formSection__title}>Thương mại & Phân khúc</h2>
            <p className={styles.formSection__desc}>
              Dự báo doanh thu định kỳ hàng năm (ARR), phân hạng quy mô và gắn nhãn.
            </p>
          </div>

          <Card padding="lg" className={styles.formSection__fieldsCard}>
            <div className={styles.grid3Col}>
              <Input
                label="Giá trị Hợp đồng Dự kiến ($ USD) *"
                type="number"
                floatingLabel
                value={String(formData.dealValue)}
                onChange={(e) =>
                  handleFieldChange('dealValue', Number(e.target.value) || 0)
                }
                error={errors.dealValue}
                isValid={formData.dealValue > 0}
                leftIcon={<DollarSign size={16} />}
              />

              <div className={styles.selectBox}>
                <label htmlFor="tier-select">Phân hạng Khách hàng</label>
                <select
                  id="tier-select"
                  value={formData.tier}
                  onChange={(e) =>
                    handleFieldChange('tier', e.target.value as CustomerTierType)
                  }
                >
                  <option value="Enterprise">Enterprise ($100K+ ARR)</option>
                  <option value="Mid-Market">Mid-Market ($50K–$100K)</option>
                  <option value="Growth">Growth ($15K–$50K)</option>
                  <option value="Startup">Startup</option>
                </select>
              </div>

              <div className={styles.selectBox}>
                <label htmlFor="status-select">Trạng thái Ban đầu</label>
                <select
                  id="status-select"
                  value={formData.status}
                  onChange={(e) =>
                    handleFieldChange('status', e.target.value as CustomerStatusType)
                  }
                >
                  <option value="New Lead">Tiềm năng mới (New Lead)</option>
                  <option value="Negotiation">Đang đàm phán (Negotiation)</option>
                  <option value="Active">Đang hợp tác (Active)</option>
                  <option value="At Risk">Cần chú ý (At Risk)</option>
                </select>
              </div>
            </div>

            <div className={styles.tagsEditor}>
              <label htmlFor="tag-adder">Nhãn phân loại (Tags)</label>
              <div className={styles.tagsEditor__row}>
                <input
                  id="tag-adder"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Nhập tên nhãn (VD: SOC2, Đa năm) rồi nhấn Thêm..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onClick={handleAddTag}>
                  + Thêm Nhãn
                </Button>
              </div>
              <div className={styles.tagsEditor__chips}>
                {formData.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.removableTag}
                    onClick={() => handleRemoveTag(tag)}
                    title="Nhấn để xóa nhãn"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.summaryField}>
              <label htmlFor="exec-summary">Ghi chú Tóm tắt Nhu cầu</label>
              <textarea
                id="exec-summary"
                rows={3}
                value={formData.summary}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                placeholder="Mô tả ngắn gọn mục tiêu kinh doanh, yêu cầu tích hợp kỹ thuật và thời gian dự kiến triển khai..."
              />
            </div>
          </Card>
        </motion.section>

        {/* PHẦN 4: Trường Thông tin Tùy chỉnh (Custom Fields) */}
        {customFields.length > 0 && (
          <motion.section
            className={styles.formSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.18 }}
          >
            <div className={styles.formSection__meta}>
              <span className={styles.formSection__step}>PHẦN 04</span>
              <h2 className={styles.formSection__title}>Trường Thông tin Tùy chỉnh</h2>
              <p className={styles.formSection__desc}>
                Các trường dữ liệu tùy biến được cấu hình bởi Quản trị hệ thống, tự động đồng bộ trên Biểu mẫu, Bộ lọc và Xuất Excel.
              </p>
            </div>

            <Card padding="lg" className={styles.formSection__fieldsCard}>
              <CustomFieldRenderer
                fields={customFields}
                values={customFieldValues}
                onChange={(fieldNameKey, val) => {
                  setCustomFieldValues((prev) => ({ ...prev, [fieldNameKey]: val }));
                  if (customFieldErrors[fieldNameKey]) {
                    setCustomFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated[fieldNameKey];
                      return updated;
                    });
                  }
                }}
                errors={customFieldErrors}
                layout="grid"
              />
            </Card>
          </motion.section>
        )}

        <footer className={styles.stickyFooter}>
          <Button variant="secondary" onClick={() => navigate('/customers')}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={<CheckCircle2 size={17} />}
          >
            Lưu Hồ sơ Khách hàng
          </Button>
        </footer>
      </form>
    </div>
  );
};
