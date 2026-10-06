import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Briefcase,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Plus,
  Settings,
  ShieldCheck,
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
import { Package, FileText } from 'lucide-react';

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
    id: 'users',
    label: 'Quản lý Người dùng',
    path: '/users',
    icon: <UserCheck size={19} />,
    requiredPermission: 'manage_sales_staff',
    badge: '45',
  },
  {
    id: 'customers',
    label: 'Khách hàng',
    path: '/customers',
    icon: <Users size={19} />,
    requiredPermission: 'manage_customers',
    badge: '50',
  },
  {
    id: 'deals',
    label: 'Phễu Cơ hội (Deals)',
    path: '/deals',
    icon: <Briefcase size={19} />,
    requiredPermission: 'manage_deals',
    badge: '12',
  },
  {
    id: 'products',
    label: 'Sản phẩm & Giá',
    path: '/products',
    icon: <Package size={19} />,
    requiredPermission: 'manage_products',
  },
  {
    id: 'activities',
    label: 'Nhật ký Hoạt động',
    path: '/activities',
    icon: <Activity size={19} />,
  },
  {
    id: 'audit-logs',
    label: 'Nhật ký Kiểm toán',
    path: '/audit-logs',
    icon: <FileText size={19} />,
    requiredPermission: 'view_audit_logs',
  },
  {
    id: 'reports',
    label: 'Báo cáo Doanh thu',
    path: '/reports',
    icon: <BarChart3 size={19} />,
    requiredPermission: 'view_team_reports',
  },
  {
    id: 'settings',
    label: 'Cài đặt Hệ thống',
    path: '/settings',
    icon: <Settings size={19} />,
    requiredPermission: 'system_settings',
  },
];

export const Sidebar: React.FC<ISidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { user, logout, lastTokenRefresh } = useAuth();
  const { hasPermission } = useAuthorization();
  const navigate = useNavigate();

  const menuItems = React.useMemo(() => {
    return ALL_MENU_ITEMS.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(item.requiredPermission);
    });
  }, [hasPermission]);

  const handleLogout = (): void => {
    logout();
    onCloseMobile();
    navigate('/login');
  };

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
              <span className={styles.sidebar__brandTag}>QUẢN TRỊ DOANH THU · 2026</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles.sidebar__collapseBtn}
            aria-label="Thu gọn hoàn toàn thanh điều hướng"
            title="Đóng thanh điều hướng (Thụt vào hoàn toàn)"
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

        <div className={styles.sidebar__ctaWrap}>
          <button
            type="button"
            className={styles.sidebar__quickAddBtn}
            onClick={() => {
              onCloseMobile();
              navigate('/customers/new');
            }}
            aria-label="Thêm khách hàng mới"
          >
            <Plus size={17} />
            <span>Thêm khách hàng mới</span>
          </button>
        </div>

        <nav className={styles.sidebar__nav} aria-label="Menu chính">
          <p className={styles.sidebar__sectionLabel}>PHÂN HỆ QUẢN TRỊ</p>
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
              <span className={styles.sidebar__tokenTitle}>Phiên JWT Bảo mật</span>
              <span className={styles.sidebar__tokenSub}>
                {lastTokenRefresh ?? 'Đã xác thực Bearer'}
              </span>
            </div>
          </div>

          <div className={styles.sidebar__userRow}>
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName ?? 'Quản Trị Viên Hệ Thống'}
              size="sm"
              status="online"
            />
            <div className={styles.sidebar__userInfo}>
              <p className={styles.sidebar__userName} title={user?.fullName ?? 'Quản Trị Viên'}>
                {user?.fullName ?? 'Quản Trị Viên Hệ Thống'}
              </p>
              <p className={styles.sidebar__userRole} title={`${user?.role ?? 'Super Admin'} · ${user?.department || 'Ban Quản trị'}`}>
                {user?.role ?? 'Super Admin'} · {user?.department || 'Ban Quản trị'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.sidebar__logoutBtn}
              aria-label="Đăng xuất và xóa bộ nhớ phiên"
              title="Đăng xuất (Xóa Token Storage)"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
