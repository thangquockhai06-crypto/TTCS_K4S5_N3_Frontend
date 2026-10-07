import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  Clock,
  FileText,
  FolderTree,
  GitCommit,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  ShieldCheck,
  Sliders,
  Target,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../common';
import logoUrl from '../../assets/logo.svg';
import styles from './Sidebar.module.css';

import { useAuthorization } from '../../hooks/useAuthorization';
import { IMenuItem } from '../../interfaces/menu.interface';

export interface ISidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const ALL_MENU_ITEMS: ReadonlyArray<IMenuItem> = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    path: '/dashboard',
    icon: <LayoutDashboard size={19} />,
    requiredPermission: 'view_dashboard',
  },
  {
    id: 'customers',
    label: 'Khách hàng Doanh nghiệp',
    path: '/customers',
    icon: <Users size={19} />,
    requiredPermission: 'manage_customers',
  },
  {
    id: 'stagnant-customers',
    label: 'Chăm sóc định kỳ',
    path: '/customers/stagnant',
    icon: <Clock size={19} />,
    requiredPermission: 'manage_customers',
  },
  {
    id: 'users',
    label: 'Quản lý Người dùng',
    path: '/users',
    icon: <UserCheck size={19} />,
    requiredPermission: 'manage_sales_staff',
  },
  {
    id: 'organization',
    label: 'Cơ cấu Tổ chức',
    path: '/organization',
    icon: <Building2 size={19} />,
    requiredPermission: 'view_dashboard',
  },
  {
    id: 'categories',
    label: 'Danh mục Dùng chung',
    path: '/categories',
    icon: <FolderTree size={19} />,
    requiredPermission: 'view_dashboard',
  },
  {
    id: 'products',
    label: 'Sản phẩm & Giá',
    path: '/products',
    icon: <Package size={19} />,
    requiredPermission: 'manage_products',
  },
  {
    id: 'pipeline',
    label: 'Cấu hình Pipeline',
    path: '/pipeline',
    icon: <GitCommit size={19} />,
    requiredPermission: 'system_settings',
  },
  {
    id: 'win-loss',
    label: 'Lý do Thắng/Thua',
    path: '/win-loss',
    icon: <Target size={19} />,
    requiredPermission: 'system_settings',
  },
  {
    id: 'custom-fields',
    label: 'Trường Tùy chỉnh',
    path: '/custom-fields',
    icon: <Sliders size={19} />,
    requiredPermission: 'system_settings',
  },
  {
    id: 'audit-logs',
    label: 'Nhật ký Kiểm toán',
    path: '/audit-logs',
    icon: <FileText size={19} />,
    requiredPermission: 'view_audit_logs',
  },
];

export const Sidebar: React.FC<ISidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { user, lastTokenRefresh } = useAuth();
  const { hasPermission } = useAuthorization();

  const menuItems = React.useMemo(() => {
    return ALL_MENU_ITEMS.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(item.requiredPermission);
    });
  }, [hasPermission]);

  const sidebarClasses = [
    styles.sidebar,
    isCollapsed ? styles['sidebar--collapsed'] : '',
    isMobileOpen ? styles['sidebar--mobileOpen'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isMobileOpen && (
        <div
          className={styles.sidebar__backdrop}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={sidebarClasses}
        aria-label="Thanh điều hướng chính"
        aria-hidden={isCollapsed && !isMobileOpen}
      >
        <div className={styles.sidebar__header}>
          <div className={styles.sidebar__brand}>
            <img src={logoUrl} alt="NexusCRM Logo" className={styles.sidebar__logo} />
            <div className={styles.sidebar__brandText}>
              <span className={styles.sidebar__brandTitle}>NexusCRM</span>
              <span className={styles.sidebar__brandTag}>DOANH NGHIỆP · 2026</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles.sidebar__collapseBtn}
            aria-label="Thu gọn thanh điều hướng"
            title="Thu gọn thanh điều hướng"
          >
            <PanelLeftClose size={17} />
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className={styles.sidebar__mobileCloseBtn}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.sidebar__nav} aria-label="Menu chính">
          <p className={styles.sidebar__sectionLabel}>PHÂN HỆ HỆ THỐNG</p>
          <ul className={styles.sidebar__list}>
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `${styles.sidebar__link} ${
                      isActive ? styles['sidebar__link--active'] : ''
                    }`
                  }
                >
                  <span className={styles.sidebar__linkIcon}>{item.icon}</span>
                  <span className={styles.sidebar__linkLabel}>{item.label}</span>
                  {item.badge && (
                    <span className={styles.sidebar__linkBadge}>{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebar__footer}>
          <div className={styles.sidebar__tokenStatus} title="S1-02 Bảo vệ phiên JWT">
            <ShieldCheck size={14} className={styles.sidebar__tokenIcon} />
            <div className={styles.sidebar__tokenMeta}>
              <span className={styles.sidebar__tokenTitle}>Phiên JWT Hoạt động</span>
              <span className={styles.sidebar__tokenSub}>
                {lastTokenRefresh ?? 'Đã xác thực Bearer'}
              </span>
            </div>
          </div>

          <div className={styles.sidebar__userRow}>
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName ?? 'Người dùng'}
              size="sm"
              status="online"
            />
            <div className={styles.sidebar__userInfo}>
              <p className={styles.sidebar__userName} title={user?.fullName ?? 'Người dùng'}>
                {user?.fullName ?? 'Người dùng'}
              </p>
              <p className={styles.sidebar__userRole} title={`${user?.role ?? 'Người dùng'} · ${user?.department || 'Hệ thống'}`}>
                {user?.role ?? 'Người dùng'} · {user?.department || 'Hệ thống'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
