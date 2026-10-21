import React from 'react';
import { Calendar, KeyRound, MapPin, Phone, Shield, X } from 'lucide-react';
import {
  IUserItem,
  USER_ROLES_CONFIG,
  USER_STATUS_CONFIG,
} from '../../interfaces/user-management.interface';
import { createAvatarSvgDataUri, formatDate } from '../../utils/formatters';
import styles from './UserDetailModal.module.css';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUserItem | null;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;

  const avatarUri = createAvatarSvgDataUri(user.name, user.avatarIndex ?? 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Hồ sơ người dùng chi tiết</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.profileHero}>
            <img src={avatarUri} alt={user.name} className={styles.avatarLg} />
            <div className={styles.heroInfo}>
              <span className={styles.heroName}>{user.name}</span>
              <span className={styles.heroEmail}>{user.email}</span>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                Địa bàn / Nhóm
              </span>
              <span className={styles.detailValue}>{user.group}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Trạng thái tài khoản</span>
              <span className={styles.detailValue}>
                {USER_STATUS_CONFIG[user.status]?.label || user.status}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
                Số điện thoại
              </span>
              <span className={styles.detailValue}>{user.phone || 'Chưa cập nhật'}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Lần đăng nhập cuối</span>
              <span className={styles.detailValue}>{user.lastLogin || 'Chưa đăng nhập'}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                Thời điểm khởi tạo
              </span>
              <span className={styles.detailValue}>
                {formatDate(user.createdAt)}
              </span>
            </div>

            {user.tempPassword && user.status === 'pending_activation' && (
              <div className={styles.detailItem} style={{ background: '#f0fdf4' }}>
                <span className={styles.detailLabel} style={{ color: '#166534' }}>
                  <KeyRound size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Mật khẩu tạm thời
                </span>
                <span className={styles.detailValue} style={{ color: '#15803d' }}>
                  {user.tempPassword}
                </span>
              </div>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>
              <Shield size={13} style={{ display: 'inline', marginRight: 4 }} />
              Danh sách vai trò được cấp ({user.roles.length} vai trò)
            </span>
            <div className={styles.rolesWrap}>
              {user.roles.map((r) => (
                <span
                  key={r}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  {USER_ROLES_CONFIG[r]?.label || r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
