import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, UserPlus, RefreshCw } from 'lucide-react';
import { userService } from '../services/userService';
import {
  AVAILABLE_GROUPS,
  IUserItem,
  UserRoleType,
  UserStatusType,
} from '../interfaces/user-management.interface';
import { UserActivationModal } from '../components/users/UserActivationModal';
import { showGlobalToast } from '../context/ToastContext';
import styles from './UserCreatePage.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

interface IRoleConfigItem {
  id: UserRoleType;
  title: string;
  description: string;
}

const ROLE_OPTIONS: IRoleConfigItem[] = [
  {
    id: 'admin',
    title: 'Quản trị viên',
    description: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền.',
  },
  {
    id: 'manager',
    title: 'Trưởng nhóm',
    description: 'Bắt buộc phải được phân công một nhóm/địa bàn quản lý cụ thể.',
  },
  {
    id: 'sales',
    title: 'Nhân viên kinh doanh',
    description: 'Nhận địa bàn kinh doanh, tiếp cận khách hàng và chốt hợp đồng.',
  },
  {
    id: 'viewer',
    title: 'Người xem',
    description: 'Chỉ xem dữ liệu báo cáo và thông tin công khai.',
  },
];

export const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('Miền Bắc (Hà Nội)');
  const [roles, setRoles] = useState<UserRoleType[]>(['sales']);
  const [status, setStatus] = useState<UserStatusType>('pending_activation');

  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Success state for displaying the activation modal with temp password
  const [createdUserSuccess, setCreatedUserSuccess] = useState<{
    user: IUserItem;
    tempPassword: string;
  } | null>(null);

  // Load existing emails to perform real-time uniqueness validation
  useEffect(() => {
    let isMounted = true;
    userService
      .getUsers({
        search: '',
        role: 'all',
        status: 'all',
        group: 'all',
        page: 1,
        limit: 1000,
      })
      .then((res) => {
        if (isMounted && res.data) {
          setExistingEmails(res.data.map((u) => u.email.trim().toLowerCase()));
        }
      })
      .catch(() => {
        // Fallback silently if offline or error
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Live validate email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setEmailError('Email không được để trống.');
      return;
    }
    if (!EMAIL_REGEX.test(clean)) {
      setEmailError('Định dạng email không hợp lệ (ví dụ: an.nguyen@nexuscrm.vn).');
      return;
    }
    if (existingEmails.includes(clean)) {
      setEmailError(`Email '${clean}' đã tồn tại trong hệ thống. Vui lòng chọn email khác.`);
      return;
    }
    setEmailError(null);
  };

  // Live validate phone
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const clean = val.trim().replace(/[\s-]/g, '');
    if (clean && !VN_PHONE_REGEX.test(clean)) {
      setPhoneError('Số điện thoại không đúng định dạng di động Việt Nam (10 số, đầu 03/05/07/08/09).');
    } else {
      setPhoneError(null);
    }
  };

  // Toggle role selection
  const handleToggleRole = (roleId: UserRoleType) => {
    setRoles((prev) => {
      let updated: UserRoleType[];
      if (prev.includes(roleId)) {
        updated = prev.filter((r) => r !== roleId);
      } else {
        updated = [...prev, roleId];
      }

      if (updated.length === 0) {
        setRolesError('Vui lòng chọn ít nhất một vai trò cho nhân sự.');
      } else {
        setRolesError(null);
      }

      if (updated.includes('manager') && (!group || group === 'Chưa phân nhóm')) {
        setGroupError('Vai trò Trưởng nhóm bắt buộc phải được phân công một nhóm cụ thể.');
      } else {
        setGroupError(null);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate Name
    if (!name.trim()) {
      setServerError('Họ và tên nhân sự không được để trống.');
      return;
    }

    // Validate Email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Email không được để trống.');
      setServerError('Email không được để trống.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setEmailError('Email sai định dạng.');
      setServerError('Email sai định dạng.');
      return;
    }
    if (existingEmails.includes(cleanEmail)) {
      setEmailError(`Email '${cleanEmail}' đã được sử dụng.`);
      setServerError(`Email '${cleanEmail}' đã được sử dụng.`);
      return;
    }

    // Validate Phone if provided
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (cleanPhone && !VN_PHONE_REGEX.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ.');
      setServerError('Số điện thoại không hợp lệ.');
      return;
    }

    // Validate Roles
    if (roles.length === 0) {
      setRolesError('Vui lòng chọn ít nhất một vai trò.');
      setServerError('Vui lòng chọn ít nhất một vai trò.');
      return;
    }

    // Validate Group for Manager
    if (roles.includes('manager') && (!group || group === 'Chưa phân nhóm')) {
      const msg = 'Người giữ vai trò Trưởng nhóm phải được gán một nhóm/địa bàn cụ thể.';
      setGroupError(msg);
      setServerError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await userService.createUser({
        name: name.trim(),
        email: cleanEmail,
        group: group.trim() || 'Chưa phân nhóm',
        roles,
        status,
        phone: cleanPhone || undefined,
      });

      showGlobalToast(result.message || 'Tạo tài khoản người dùng thành công!', 'success');

      // Pop up activation modal with temporary password
      setCreatedUserSuccess({
        user: result.user,
        tempPassword: result.tempPassword,
      });
    } catch (err: any) {
      const errMsg = err.message || 'Đã xảy ra lỗi khi tạo tài khoản người dùng.';
      setServerError(errMsg);
      showGlobalToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivationModalClose = () => {
    setCreatedUserSuccess(null);
    navigate('/users');
  };

  const handleResendActivation = async (user: IUserItem) => {
    await userService.resendActivationEmail(user.id);
    showGlobalToast('Đã gửi lại email kích hoạt thành công!', 'success');
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => navigate('/users')}
        className={styles.backBtn}
        aria-label="Quay lại danh sách người dùng"
      >
        <ArrowLeft size={16} />
        <span>Trở về danh sách người dùng</span>
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Thêm người dùng & Phân quyền</h1>
        <p className={styles.subtitle}>
          Cấp quyền và địa bàn cho nhân viên kinh doanh mới ngay ngày đầu nhận việc.
        </p>
      </header>

      <div className={styles.card}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Họ và tên nhân sự */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>
                Họ và tên nhân sự <span className={styles.requiredStar}>*</span>
              </span>
            </label>
            <input
              type="text"
              required
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              disabled={isSubmitting}
            />
          </div>

          {/* Email hệ thống */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>
                Email hệ thống <span className={styles.requiredStar}>*</span>
              </span>
            </label>
            <input
              type="email"
              required
              className={`${styles.input} ${emailError ? styles.inputError : ''}`}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Ví dụ: an.nguyen@nexuscrm.vn"
              disabled={isSubmitting}
            />
            {emailError ? (
              <span className={styles.fieldError}>{emailError}</span>
            ) : (
              <span className={styles.helperText}>
                Email dùng để đăng nhập hệ thống và nhận mật khẩu tạm kích hoạt.
              </span>
            )}
          </div>

          {/* Số điện thoại */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Số điện thoại liên hệ</span>
            </label>
            <input
              type="tel"
              className={`${styles.input} ${phoneError ? styles.inputError : ''}`}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Ví dụ: 0987654321"
              disabled={isSubmitting}
            />
            {phoneError && <span className={styles.fieldError}>{phoneError}</span>}
          </div>

          {/* Nhóm / Địa bàn phụ trách */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Nhóm / Địa bàn phụ trách</span>
            </label>
            <select
              className={styles.select}
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                if (roles.includes('manager') && e.target.value && e.target.value !== 'Chưa phân nhóm') {
                  setGroupError(null);
                }
              }}
              disabled={isSubmitting}
            >
              {AVAILABLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {groupError && <span className={styles.fieldError}>{groupError}</span>}
          </div>

          {/* Phân quyền vai trò */}
          <div className={styles.fieldGroup}>
            <div className={styles.label}>
              <span>
                Phân quyền vai trò <span className={styles.requiredStar}>*</span>
              </span>
              <span className={styles.labelHint}>(Có thể chọn nhiều vai trò cùng lúc)</span>
            </div>

            <div className={styles.rolesGrid}>
              {ROLE_OPTIONS.map((opt) => {
                const isChecked = roles.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`${styles.roleCard} ${isChecked ? styles.roleCardActive : ''}`}
                    onClick={() => handleToggleRole(opt.id)}
                  >
                    <input
                      type="checkbox"
                      className={styles.roleCheckbox}
                      checked={isChecked}
                      onChange={() => handleToggleRole(opt.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={opt.title}
                    />
                    <div className={styles.roleContent}>
                      <span className={styles.roleTitle}>{opt.title}</span>
                      <span className={styles.roleDesc}>{opt.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {rolesError && <span className={styles.fieldError}>{rolesError}</span>}
          </div>

          {/* Trạng thái tài khoản */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Trạng thái tài khoản</span>
            </label>
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatusType)}
              disabled={isSubmitting}
            >
              <option value="pending_activation">
                Chờ kích hoạt (Gửi email kèm mật khẩu tạm)
              </option>
              <option value="active">Đang hoạt động (Kích hoạt ngay)</option>
              <option value="locked">Tạm khóa</option>
            </select>
          </div>

          {/* Hành động */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => navigate('/users')}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Tạo tài khoản & Phân quyền</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Thông báo tạo tài khoản thành công kèm mật khẩu tạm */}
      <UserActivationModal
        isOpen={Boolean(createdUserSuccess)}
        onClose={handleActivationModalClose}
        user={createdUserSuccess?.user || null}
        tempPassword={createdUserSuccess?.tempPassword}
        onResendActivation={handleResendActivation}
      />
    </div>
  );
};
