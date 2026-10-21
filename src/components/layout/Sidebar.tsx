import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  Clock,
  FileText,
  FolderTree,
  GitCommit,
  History,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  ShieldCheck,
  Sliders,
  Target,
  TrendingUp,
  Megaphone,
  UserCheck,
  Users,
  X,
  Zap,
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

export interface IMenuGroup {
  id: string;
  title: string;
  items: ReadonlyArray<IMenuItem>;
}

const MENU_GROUPS: ReadonlyArray<IMenuGroup> = [
  {
    id: 'overview',
    title: 'Tổng quan & Báo cáo',
    items: [
      {
        id: 'dashboard',
        label: 'Tổng quan',
        path: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        requiredPermission: 'view_dashboard',
      },
    ],
  },
  {
    id: 'sales',
    title: 'Kinh doanh & Bán hàng',
    items: [
      {
        id: 'leads',
        label: 'Quản lý Lead',
        path: '/leads',
        icon: <Target size={18} />,
        requiredPermission: 'manage_customers',
      },
      {
        id: 'deals',
        label: 'Cơ hội Bán hàng',
        path: '/deals',
        icon: <TrendingUp size={18} />,
        requiredPermission: 'manage_deals',
      },
      {
        id: 'quote-approvals',
        label: 'Duyệt Báo giá',
        path: '/quotes/approvals',
        icon: <ClipboardCheck size={18} />,
        requiredPermission: 'approve_quotes',
      },
      {
        id: 'contracts',
        label: 'Hợp đồng & Tái ký',
        path: '/contracts',
        icon: <FileText size={18} />,
        requiredPermission: 'manage_deals',
      },
    ],
  },
  {
    id: 'customers',
    title: 'Khách hàng & Tiếp thị',
    items: [
      {
        id: 'customers',
        label: 'Khách hàng Doanh nghiệp',
        path: '/customers',
        icon: <Users size={18} />,
        requiredPermission: 'manage_customers',
      },
      {
        id: 'campaigns',
        label: 'Chiến dịch Tiếp thị',
        path: '/campaigns',
        icon: <Megaphone size={18} />,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'stagnant-customers',
        label: 'Chăm sóc định kỳ',
        path: '/customers/stagnant',
        icon: <Clock size={18} />,
        requiredPermission: 'manage_customers',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Công việc & Hoạt động',
    items: [
      {
        id: 'tasks',
        label: 'Công việc & Nhiệm vụ',
        path: '/tasks',
        icon: <CheckSquare size={18} />,
        requiredPermission: 'manage_deals',
      },
      {
        id: 'activities',
        label: 'Nhật ký Hoạt động',
        path: '/activities',
        icon: <History size={18} />,
        requiredPermission: 'manage_deals',
      },
    ],
  },
  {
    id: 'catalog',
    title: 'Sản phẩm & Danh mục',
    items: [
      {
        id: 'products',
        label: 'Sản phẩm & Giá',
        path: '/products',
        icon: <Package size={18} />,
        requiredPermission: 'manage_products',
      },
      {
        id: 'categories',
        label: 'Danh mục Dùng chung',
        path: '/categories',
        icon: <FolderTree size={18} />,
        requiredPermission: 'view_dashboard',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Cấu hình & Hệ thống',
    items: [
      {
        id: 'users',
        label: 'Quản lý Người dùng',
        path: '/users',
        icon: <UserCheck size={18} />,
        requiredPermission: 'manage_sales_staff',
      },
      {
        id: 'organization',
        label: 'Cơ cấu Tổ chức',
        path: '/organization',
        icon: <Building2 size={18} />,
        requiredPermission: 'view_dashboard',
      },
      {
        id: 'pipeline',
        label: 'Cấu hình Pipeline',
        path: '/pipeline',
        icon: <GitCommit size={18} />,
        requiredPermission: 'system_settings',
      },
      {
        id: 'win-loss',
        label: 'Lý do Thắng/Thua',
        path: '/win-loss',
        icon: <Target size={18} />,
        requiredPermission: 'system_settings',
      },
      {
        id: 'custom-fields',
        label: 'Trường Tùy chỉnh',
        path: '/custom-fields',
        icon: <Sliders size={18} />,
        requiredPermission: 'system_settings',
      },
      {
        id: 'automation',
        label: 'Tự động hóa IF–THEN',
        path: '/automation',
        icon: <Zap size={18} />,
        requiredPermission: 'system_settings',
      },
      {
        id: 'audit-logs',
        label: 'Nhật ký Kiểm toán',
        path: '/audit-logs',
        icon: <FileText size={18} />,
        requiredPermission: 'view_audit_logs',
      },
    ],
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
  const location = useLocation();

  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nexus_sidebar_collapsed_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const filteredGroups = React.useMemo(() => {
    return MENU_GROUPS.map((group) => {
      const visibleItems = group.items.filter((item) => {
        if (!item.requiredPermission) return true;
        return hasPermission(item.requiredPermission);
      });
      return {
        ...group,
        items: visibleItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [hasPermission]);

  const prevPathRef = React.useRef(location.pathname);
  const initialMountRef = React.useRef(true);

  // Auto-expand group on initial load
  React.useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      const currentPath = location.pathname;
      filteredGroups.forEach((group) => {
        const hasActive = group.items.some(
          (item) => item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path))
        );
        if (hasActive) {
          setCollapsedGroups((prev) => ({ ...prev, [group.id]: false }));
        }
      });
    }
  }, [filteredGroups, location.pathname]);

  // Auto-expand group ONLY when user navigates to a new page
  React.useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      const currentPath = location.pathname;
      filteredGroups.forEach((group) => {
        const hasActive = group.items.some(
          (item) => item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path))
        );
        if (hasActive) {
          setCollapsedGroups((prev) => {
            const next = { ...prev, [group.id]: false };
            try {
              localStorage.setItem('nexus_sidebar_collapsed_groups', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      });
    }
  }, [location.pathname, filteredGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('nexus_sidebar_collapsed_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isAllCollapsed = filteredGroups.length > 0 && filteredGroups.every((g) => collapsedGroups[g.id]);

  const handleToggleAll = () => {
    const shouldCollapse = !isAllCollapsed;
    const next: Record<string, boolean> = {};
    filteredGroups.forEach((g) => {
      next[g.id] = shouldCollapse;
    });
    setCollapsedGroups(next);
    try {
      localStorage.setItem('nexus_sidebar_collapsed_groups', JSON.stringify(next));
    } catch {}
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
          <div className={styles.sidebar__sectionHeader}>
            <p className={styles.sidebar__sectionLabel}>PHÂN HỆ HỆ THỐNG</p>
            <button
              type="button"
              className={styles.sidebar__toggleAllBtn}
              onClick={handleToggleAll}
              title={isAllCollapsed ? 'Mở rộng tất cả các nhóm' : 'Thu gọn tất cả các nhóm'}
            >
              {isAllCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
            </button>
          </div>

          {filteredGroups.map((group) => {
            const isGroupCollapsed = !!collapsedGroups[group.id];

            return (
              <div key={group.id} className={styles.sidebar__group}>
                <button
                  type="button"
                  className={styles.sidebar__groupHeader}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isGroupCollapsed}
                  title={`${isGroupCollapsed ? 'Mở rộng' : 'Thu gọn'} nhóm ${group.title}`}
                >
                  <span className={styles.sidebar__groupTitle}>{group.title}</span>
                  <div className={styles.sidebar__groupMeta}>
                    <span className={styles.sidebar__groupBadge}>{group.items.length}</span>
                    <ChevronDown
                      size={14}
                      className={`${styles.sidebar__groupChevron} ${
                        isGroupCollapsed ? styles['sidebar__groupChevron--collapsed'] : ''
                      }`}
                    />
                  </div>
                </button>

                <div
                  className={`${styles.sidebar__groupCollapse} ${
                    isGroupCollapsed ? styles['sidebar__groupCollapse--collapsed'] : ''
                  }`}
                  aria-hidden={isGroupCollapsed}
                >
                  <ul className={styles.sidebar__groupList}>
                    {group.items.map((item) => (
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
                </div>
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebar__footer}>
          <div className={styles.sidebar__tokenStatus} title="Bảo vệ phiên JWT">
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
