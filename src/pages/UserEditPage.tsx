import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, Save, RefreshCw } from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import {
  AVAILABLE_GROUPS,
  IUserItem,
  USER_ROLES_CONFIG,
  USER_STATUS_CONFIG,
  UserRoleType,
  UserStatusType,
} from '../interfaces/user-management.interface';
import { showGlobalToast } from '../context/ToastContext';
import styles from './UserEditPage.module.css';

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentAuthUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [targetUser, setTargetUser] = useState<IUserItem | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('Chưa phân nhóm');
  const [role, setRole] = useState<UserRoleType>('sales');
  const [status, setStatus] = useState<UserStatusType>('active');

  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy mã người dùng.');
      setIsLoading(false);
      return;
    }

    const loadUser = async () => {
      setIsLoading(true);
      try {
        const u = await userService.getUserById(id);
        if (!u) {
          setError(`Không tìm thấy người dùng có ID: "${id}".`);
          return;
        }
        setTargetUser(u);
        setName(u.name);
        setEmail(u.email);
        setPhone(u.phone || '');
        setGroup(u.group || 'Chưa phân nhóm');
        setRole(u.roles[0] || 'sales');
        setStatus(u.status);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải thông tin người dùng.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !targetUser) return;

    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên người dùng.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await userService.updateUser(
        id,
        {
          name: name.trim(),
          group: group === 'Chưa phân nhóm' ? '' : group,
          roles: [role],
          status,
          phone: phone.trim(),
        },
        currentAuthUser?.id,
        currentAuthUser?.email
      );

      const msg = result.message || 'Cập nhật tài khoản người dùng thành công.';
      setSuccess(msg);
      showGlobalToast(msg, 'success');
      window.setTimeout(() => {
        navigate('/users');
      }, 1200);
    } catch (err: any) {
      const errMsg = err.message || 'Không thể lưu thay đổi người dùng.';
      setError(errMsg);
      showGlobalToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <RefreshCw size={28} className="spin" />
          <span>Đang tải thông tin tài khoản người dùng...</span>
        </div>
      </div>
    );
  }

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
        <h1 className={styles.title}>Chỉnh sửa tài khoản người dùng</h1>
        <p className={styles.subtitle}>
          Cập nhật thông tin định danh, nhóm địa bàn và phân quyền tài khoản
        </p>
      </header>

      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {targetUser && (
        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              {/* Họ và tên */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Họ và tên <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  disabled={isSaving}
                />
              </div>

              {/* Email (Chỉ đọc) */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Địa chỉ Email <span style={{ color: '#64748b', fontSize: '0.75rem' }}>(Bảo mật - Không thể thay đổi)</span>
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  className={`${styles.input} ${styles.inputDisabled}`}
                  value={email}
                />
                <span className={styles.helperText}>
                  Email được cố định để duy trì danh tính bảo mật và liên kết JWT token
                </span>
              </div>

              {/* Số điện thoại */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Số điện thoại</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  disabled={isSaving}
                />
              </div>

              {/* Nhóm / Địa bàn */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nhóm / Địa bàn phụ trách</label>
                <select
                  className={styles.select}
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="Chưa phân nhóm">Chưa phân nhóm</option>
                  {AVAILABLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vai trò */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Vai trò hệ thống</label>
                <select
                  className={styles.select}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRoleType)}
                  disabled={isSaving}
                >
                  {(Object.keys(USER_ROLES_CONFIG) as UserRoleType[]).map((r) => (
                    <option key={r} value={r}>
                      {USER_ROLES_CONFIG[r].label}
                    </option>
                  ))}
                </select>
                <span className={styles.helperText}>
                  {USER_ROLES_CONFIG[role]?.description}
                </span>
              </div>

              {/* Trạng thái tài khoản */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Trạng thái tài khoản</label>
                <select
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatusType)}
                  disabled={isSaving}
                >
                  {(Object.keys(USER_STATUS_CONFIG) as UserStatusType[]).map((s) => (
                    <option key={s} value={s}>
                      {USER_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => navigate('/users')}
                disabled={isSaving}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className={styles.btnSave}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
