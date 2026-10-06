import React from 'react';
import {
  Edit3,
  Eye,
  Lock,
  MailCheck,
  MapPin,
  Shield,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import {
  IUserItem,
  USER_ROLES_CONFIG,
  USER_STATUS_CONFIG,
  UserRoleType,
} from '../../interfaces/user-management.interface';
import { createAvatarSvgDataUri } from '../../utils/formatters';
import styles from './UserTable.module.css';

interface UserTableProps {
  users: IUserItem[];
  currentUserId?: string;
  currentUserEmail?: string;
  onEdit: (user: IUserItem) => void;
  onViewDetails: (user: IUserItem) => void;
  onToggleStatus: (user: IUserItem) => void;
  onDelete: (user: IUserItem) => void;
  onResendActivation: (user: IUserItem) => void;
  onAssignRole?: (user: IUserItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUserId,
  currentUserEmail,
  onEdit,
  onViewDetails,
  onToggleStatus,
  onDelete,
  onResendActivation,
  onAssignRole,
}) => {
  const getRoleBadgeClass = (role: UserRoleType): string => {
    switch (role) {
      case 'admin':
        return styles.roleBadgeAdmin;
      case 'manager':
        return styles.roleBadgeManager;
      case 'sales':
        return styles.roleBadgeSales;
      case 'viewer':
      default:
        return styles.roleBadgeViewer;
    }
  };

  const getStatusBadgeClass = (status: IUserItem['status']): string => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'pending_activation':
        return styles.statusPending;
      case 'locked':
        return styles.statusLocked;
      default:
        return '';
    }
  };

  if (users.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Không tìm thấy người dùng phù hợp</h3>
          <p className={styles.emptyDesc}>
            Vui lòng thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại các tiêu chí bộ lọc.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Nhóm / Địa bàn</th>
            <th>Vai trò hệ thống</th>
            <th>Trạng thái</th>
            <th>Lần đăng nhập cuối</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf =
              (currentUserId && u.id === currentUserId) ||
              (currentUserEmail &&
                u.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase());

            const avatarUri = createAvatarSvgDataUri(u.name, u.avatarIndex ?? 0);

            return (
              <tr key={u.id} className={isSelf ? styles.selfRow : undefined}>
                {/* Người dùng */}
                <td>
                  <div className={styles.userCell}>
                    <img
                      src={avatarUri}
                      alt={u.name}
                      className={styles.avatar}
                    />
                    <div className={styles.userInfo}>
                      <div className={styles.userNameRow}>
                        <span className={styles.userName}>{u.name}</span>
                        {isSelf && <span className={styles.selfBadge}>Bạn</span>}
                      </div>
                      <span className={styles.userEmail}>{u.email}</span>
                    </div>
                  </div>
                </td>

                {/* Nhóm / Địa bàn */}
                <td>
                  <span className={styles.groupBadge}>
                    <MapPin size={13} />
                    {u.group}
                  </span>
                </td>

                {/* Vai trò: Một người dùng có thể giữ nhiều vai trò cùng lúc */}
                <td>
                  <div className={styles.rolesList}>
                    {u.roles.map((role) => (
                      <span
                        key={role}
                        className={`${styles.roleBadge} ${getRoleBadgeClass(role)}`}
                        title={USER_ROLES_CONFIG[role]?.description}
                      >
                        {role === 'admin' && <Shield size={12} />}
                        {USER_ROLES_CONFIG[role]?.label || role}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Trạng thái */}
                <td>
                  <span
                    className={`${styles.statusBadge} ${getStatusBadgeClass(u.status)}`}
                  >
                    {USER_STATUS_CONFIG[u.status]?.label || u.status}
                  </span>
                </td>

                {/* Lần đăng nhập cuối */}
                <td style={{ color: '#64748b', fontSize: '13px' }}>
                  {u.lastLogin || 'Chưa đăng nhập'}
                </td>

                {/* Thao tác */}
                <td>
                  <div className={styles.actionsCell}>
                    {/* Xem chi tiết */}
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onViewDetails(u)}
                      title="Xem thông tin chi tiết"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Sửa thông tin */}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={() => onEdit(u)}
                      title="Chỉnh sửa tài khoản"
                    >
                      <Edit3 size={16} />
                    </button>

                    {/* Phân vai trò & nhóm (S1-09) */}
                    {onAssignRole && (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => onAssignRole(u)}
                        title="Phân vai trò & nhóm kinh doanh"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <Shield size={16} />
                      </button>
                    )}

                    {/* Gửi lại email kích hoạt (cho tài khoản pending) */}
                    {u.status === 'pending_activation' && (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
                        onClick={() => onResendActivation(u)}
                        title="Gửi lại email kích hoạt kèm mật khẩu tạm"
                      >
                        <MailCheck size={16} />
                      </button>
                    )}

                    {/* Khóa / Mở khóa tài khoản (không thể tự khóa chính mình) */}
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onToggleStatus(u)}
                      disabled={Boolean(isSelf)}
                      title={
                        isSelf
                          ? 'Không thể tự khóa tài khoản của chính mình'
                          : u.status === 'locked'
                          ? 'Mở khóa tài khoản'
                          : 'Khóa tài khoản'
                      }
                    >
                      {u.status === 'locked' ? (
                        <Unlock size={16} style={{ color: '#16a34a' }} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </button>

                    {/* Xóa tài khoản (không thể tự xóa chính mình) */}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => onDelete(u)}
                      disabled={Boolean(isSelf)}
                      title={
                        isSelf
                          ? 'Không thể tự xóa tài khoản của chính mình'
                          : 'Xóa tài khoản'
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
