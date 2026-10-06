import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  Building2,
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
import { formatCurrency } from '../../utils/formatters';
import { Avatar, Badge, SearchBar } from '../common';
import { getCustomerStatusTone } from '../customer/CustomerCard';
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
    customers,
    notifications,
    markAllNotificationsRead,
    appearance,
    updateAppearance,
  } = useCRMData();
  const navigate = useNavigate();

  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const quickResults =
    globalQuery.trim().length >= 1
      ? customers
          .filter(
            (c) =>
              c.fullName.toLowerCase().includes(globalQuery.toLowerCase()) ||
              c.company.toLowerCase().includes(globalQuery.toLowerCase()) ||
              c.email.toLowerCase().includes(globalQuery.toLowerCase()) ||
              c.industry.toLowerCase().includes(globalQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

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

  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__left}>
        {/* Nút đóng/mở hẳn thanh Sidebar trên Desktop */}
        <button
          type="button"
          className={styles.topbar__sidebarToggleBtn}
          onClick={onToggleSidebarCollapse}
          aria-label={
            isSidebarCollapsed ? 'Mở thanh điều hướng' : 'Thu gọn thanh điều hướng'
          }
          title={
            isSidebarCollapsed
              ? 'Mở thanh điều hướng (Thụt ra)'
              : 'Ẩn thanh điều hướng (Thụt hẳn vào)'
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

        <div className={styles.topbar__searchContainer} ref={searchWrapRef}>
          <SearchBar
            value={globalQuery}
            onChange={setGlobalQuery}
            placeholder="Tìm nhanh khách hàng, công ty, ngành nghề..."
            ariaLabel="Tìm kiếm toàn hệ thống CRM"
            enableGlobalShortcut
          />

          {globalQuery.trim().length >= 1 && (
            <div className={styles.topbar__searchDropdown} role="listbox">
              <div className={styles.topbar__dropdownHeaderRow}>
                <span className={styles.topbar__dropdownHeader}>
                  KẾT QUẢ TÌM KIẾM NHANH ({quickResults.length})
                </span>
                <button
                  type="button"
                  className={styles.topbar__viewAllSearchBtn}
                  onClick={() => {
                    setGlobalQuery('');
                    navigate('/customers');
                  }}
                >
                  Xem tất cả danh bạ <ArrowUpRight size={12} />
                </button>
              </div>

              {quickResults.length === 0 ? (
                <div className={styles.topbar__emptySearch}>
                  Không tìm thấy khách hàng nào khớp với <strong>"{globalQuery}"</strong>
                </div>
              ) : (
                <div className={styles.topbar__resultsList}>
                  {quickResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className={styles.topbar__searchResultItem}
                      onClick={() => {
                        setGlobalQuery('');
                        navigate(`/customers/${customer.id}`);
                      }}
                    >
                      <Avatar src={customer.avatarUrl} name={customer.fullName} size="sm" />
                      <div className={styles.topbar__resultMeta}>
                        <span className={styles.topbar__resultName}>
                          {customer.fullName}
                        </span>
                        <span className={styles.topbar__resultCompany}>
                          <Building2 size={11} /> {customer.company} · {customer.role}
                        </span>
                      </div>
                      <div className={styles.topbar__resultRight}>
                        <strong className={`${styles.topbar__resultArr} tabular-nums`}>
                          {formatCurrency(customer.dealValue)}
                        </strong>
                        <Badge
                          tone={getCustomerStatusTone(customer.status)}
                          size="sm"
                        >
                          {customer.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.topbar__right}>
        <button
          type="button"
          onClick={() => void handleTestRefreshToken()}
          className={styles.topbar__tokenBtn}
          title="S1-02: Giả lập lỗi 401 & tự động làm mới Token qua Axios Interceptor"
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
                  onClick={markAllNotificationsRead}
                  className={styles.topbar__markReadBtn}
                >
                  <CheckCheck size={14} />
                  Đánh dấu đã đọc
                </button>
              </div>
              <div className={styles.topbar__notifList}>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.topbar__notifItem} ${
                      !item.isRead ? styles['topbar__notifItem--unread'] : ''
                    }`}
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
            onClick={() => navigate('/settings')}
            className={styles.topbar__avatarBtn}
            aria-label="Mở cài đặt tài khoản"
          >
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName ?? 'Quản Trị Viên Hệ Thống'}
              size="sm"
              status="online"
            />
            <div className={styles.topbar__profileMeta}>
              <span className={styles.topbar__profileName}>
                {user?.fullName ?? 'Quản Trị Viên Hệ Thống'}
              </span>
              <span className={styles.topbar__profileRole}>
                {user?.workspaceName ?? 'Enterprise VN'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className={styles.topbar__logoutBtn}
            aria-label="Đăng xuất và xóa bộ nhớ phiên"
            title="S1-02: Đăng xuất & Xóa Token Storage"
          >
            <LogOut size={15} />
            <span className={styles.topbar__logoutLabel}>Đăng xuất</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className={styles.topbar__mobileProfileBtn}
            aria-label="Cài đặt"
          >
            <UserIcon size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
