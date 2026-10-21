import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useCRMData } from '../../context/CRMDataContext';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { INotificationItem } from '../../interfaces/dashboard.interface';
import { Avatar, SearchBar } from '../common';
import styles from './TopBar.module.css';

export interface ITopBarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<ITopBarProps> = ({
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenMobileMenu,
}) => {
  const { user, logout, triggerMockTokenRefresh, lastTokenRefresh } = useAuth();
  const {
    notifications: contextNotifications,
    markAllNotificationsRead,
    appearance,
    updateAppearance,
  } = useCRMData();
  const navigate = useNavigate();

  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);
  const [apiNotifications, setApiNotifications] = useState<INotificationItem[]>([]);
  const [hasLoadedApiNotifications, setHasLoadedApiNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  // Load notifications from backend (S7-08)
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      setApiNotifications(Array.isArray(res?.items) ? res.items : []);
      setHasLoadedApiNotifications(true);
    } catch {
      // Fallback to context
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications, isNotifOpen]);

  const displayNotifications = hasLoadedApiNotifications
    ? apiNotifications
    : contextNotifications;
  const unreadCount = displayNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setGlobalQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTestRefreshToken = async (): Promise<void> => {
    setIsRefreshingToken(true);
    try {
      await triggerMockTokenRefresh();
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleToggleTheme = (): void => {
    updateAppearance({
      theme: appearance.theme === 'light' ? 'dark' : 'light',
    });
  };

  const handleSearchSubmit = (): void => {
    if (!globalQuery.trim()) return;
    const q = globalQuery.trim();
    setGlobalQuery('');
    navigate(`/users?search=${encodeURIComponent(q)}`);
  };

  const handleNotifClick = async (item: INotificationItem): Promise<void> => {
    if (!item.isRead) {
      void notificationService.markAsRead(item.id);
      setApiNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    setIsNotifOpen(false);
    if (item.linkUrl) {
      navigate(item.linkUrl);
    } else if (item.targetType === 'deal') {
      navigate('/deals');
    } else if (item.targetType === 'quotation') {
      navigate('/quotes/approvals');
    } else if (item.targetType === 'task') {
      navigate('/tasks');
    } else if (item.targetType === 'lead') {
      navigate('/leads');
    } else if (item.targetType === 'contract') {
      navigate('/contracts');
    }
  };

  const handleMarkAllRead = async (): Promise<void> => {
    void notificationService.markAllRead();
    setApiNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllNotificationsRead();
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__left}>
        {/* Nút đóng/mở thanh Sidebar trên Desktop */}
        <button
          type="button"
          className={styles.topbar__sidebarToggleBtn}
          onClick={onToggleSidebarCollapse}
          aria-label={
            isSidebarCollapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'
          }
          title={
            isSidebarCollapsed
              ? 'Mở thanh điều hướng'
              : 'Thu gọn thanh điều hướng'
          }
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span className={styles.topbar__sidebarToggleText}>
            {isSidebarCollapsed ? 'Mở Menu' : 'Ẩn Menu'}
          </span>
        </button>

        {/* Nút mở menu trên Mobile */}
        <button
          type="button"
          className={styles.topbar__menuBtn}
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* Thanh tìm kiếm toàn hệ thống */}
        <div className={styles.topbar__searchContainer} ref={searchWrapRef}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
            style={{ width: '100%' }}
          >
            <SearchBar
              value={globalQuery}
              onChange={setGlobalQuery}
              placeholder="Tìm nhanh người dùng theo họ tên, email..."
              ariaLabel="Tìm kiếm người dùng hệ thống"
              enableGlobalShortcut
            />
          </form>

          {globalQuery.trim().length >= 1 && (
            <div className={styles.topbar__searchDropdown} role="listbox">
              <div className={styles.topbar__dropdownHeaderRow}>
                <span className={styles.topbar__dropdownHeader}>
                  TÌM KIẾM NGƯỜI DÙNG: "{globalQuery}"
                </span>
                <button
                  type="button"
                  className={styles.topbar__viewAllSearchBtn}
                  onClick={handleSearchSubmit}
                >
                  Tìm trong Quản lý Người dùng <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.topbar__right}>
        <button
          type="button"
          onClick={() => void handleTestRefreshToken()}
          className={styles.topbar__tokenBtn}
          title="Làm mới JWT Token"
          aria-label="Làm mới JWT Token"
        >
          <RefreshCw
            size={14}
            className={isRefreshingToken ? styles['topbar__spin'] : ''}
          />
          <span className={styles.topbar__tokenBtnText}>
            {lastTokenRefresh ?? 'Làm mới JWT'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleTheme}
          className={styles.topbar__iconBtn}
          aria-label={
            appearance.theme === 'light' ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'
          }
          title="Đổi giao diện Sáng / Tối"
        >
          {appearance.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className={styles.topbar__notifWrap} ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={styles.topbar__iconBtn}
            aria-label={`Thông báo (${unreadCount} chưa đọc)`}
            aria-expanded={isNotifOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.topbar__notifBadge}>{unreadCount}</span>
            )}
          </button>

          {isNotifOpen && (
            <div
              className={styles.topbar__notifPopover}
              role="dialog"
              aria-label="Trung tâm thông báo"
            >
              <div className={styles.topbar__notifHeader}>
                <strong>Trung tâm thông báo</strong>
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  className={styles.topbar__markReadBtn}
                >
                  <CheckCheck size={14} />
                  Đánh dấu đã đọc
                </button>
              </div>
              <div className={styles.topbar__notifList}>
                {displayNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.topbar__notifItem} ${
                      !item.isRead ? styles['topbar__notifItem--unread'] : ''
                    }`}
                    onClick={() => void handleNotifClick(item)}
                    title="Nhấn để mở màn hình liên quan"
                  >
                    <div className={styles.topbar__notifDot} />
                    <div className={styles.topbar__notifBody}>
                      <p className={styles.topbar__notifTitle}>{item.title}</p>
                      <p className={styles.topbar__notifDesc}>{item.description}</p>
                      <span className={styles.topbar__notifTime}>{item.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.topbar__divider} aria-hidden="true" />

        <div className={styles.topbar__profileGroup}>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={styles.topbar__avatarBtn}
            aria-label="Mở hồ sơ cá nhân"
            title="Hồ sơ cá nhân"
          >
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName ?? 'Người dùng'}
              size="sm"
              status="online"
            />
            <div className={styles.topbar__profileMeta}>
              <span className={styles.topbar__profileName}>
                {user?.fullName ?? 'Người dùng'}
              </span>
              <span className={styles.topbar__profileRole}>
                {user?.workspaceName ?? 'NexusCRM'}
              </span>
            </div>
          </button>

          {/* S1-02: Nút Đăng xuất DUY NHẤT trong toàn bộ ứng dụng */}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className={styles.topbar__logoutBtn}
            aria-label="Đăng xuất và xóa bộ nhớ phiên"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={15} />
            <span className={styles.topbar__logoutLabel}>Đăng xuất</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={styles.topbar__mobileProfileBtn}
            aria-label="Hồ sơ cá nhân"
          >
            <UserIcon size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
