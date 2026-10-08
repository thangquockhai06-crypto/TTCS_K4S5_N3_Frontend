import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  FolderTree,
  GitCommit,
  Package,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Target,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Card } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { sprint2Service } from '../services/sprint2Service';
import { IAuditLogItem } from '../interfaces/sprint2.interface';
import styles from './DashboardPage.module.css';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLoginToast, setShowLoginToast] = useState<boolean>(() => {
    return Boolean((location.state as any)?.loginSuccess);
  });

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalAuditLogs: 0,
  });
  const [recentLogs, setRecentLogs] = useState<IAuditLogItem[]>([]);

  useEffect(() => {
    if (showLoginToast) {
      const timer = window.setTimeout(() => {
        setShowLoginToast(false);
      }, 5000);
      return () => window.clearTimeout(timer);
    }
  }, [showLoginToast]);

  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, productsRes, categoriesRes, auditRes] = await Promise.allSettled([
          userService.getUsers({
            search: '',
            role: 'all',
            status: 'all',
            group: 'all',
            page: 1,
            limit: 1,
          }),
          sprint2Service.getProducts(),
          sprint2Service.getCategories(),
          sprint2Service.getAuditLogs({ limit: 5 }),
        ]);

        if (!isMounted) return;

        const totalUsers = usersRes.status === 'fulfilled' ? (usersRes.value?.total ?? 0) : 0;
        const totalProducts =
          productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)
            ? productsRes.value.length
            : 0;
        const totalCategories =
          categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)
            ? categoriesRes.value.length
            : 0;
        const totalAuditLogs = auditRes.status === 'fulfilled' ? (auditRes.value?.total ?? 0) : 0;

        let logs: IAuditLogItem[] = [];
        if (auditRes.status === 'fulfilled' && auditRes.value) {
          const rawItems = auditRes.value.items || (auditRes.value as any).data;
          if (Array.isArray(rawItems)) {
            logs = rawItems;
          }
        }

        setStats({
          totalUsers,
          totalProducts,
          totalCategories,
          totalAuditLogs,
        });
        setRecentLogs(logs);
      } catch (err) {
        console.error('Lỗi tải dữ liệu tổng quan:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRealData();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.fullName ?? 'Quản Trị Viên';

  const quickNavModules = [
    {
      title: 'Quản lý Người dùng & Phân quyền',
      desc: 'Quản trị tài khoản, phân vai trò, nhóm làm việc và kiểm soát đăng nhập',
      icon: <UserCheck size={22} style={{ color: '#2563eb' }} />,
      path: '/users',
    },
    {
      title: 'Cơ cấu Tổ chức',
      desc: 'Sơ đồ cây phòng ban, phân cấp nhân sự và quản lý đơn vị tổ chức',
      icon: <Building2 size={22} style={{ color: '#0891b2' }} />,
      path: '/organization',
    },
    {
      title: 'Danh mục Dùng chung',
      desc: 'Quản lý các danh mục tra cứu chuẩn hóa dùng chung toàn hệ thống CRM',
      icon: <FolderTree size={22} style={{ color: '#7c3aed' }} />,
      path: '/categories',
    },
    {
      title: 'Sản phẩm & Bảng giá',
      desc: 'Danh mục sản phẩm, dịch vụ và chính sách giá niêm yết bảo mật',
      icon: <Package size={22} style={{ color: '#059669' }} />,
      path: '/products',
    },
    {
      title: 'Cấu hình Pipeline & Xác suất',
      desc: 'Thiết lập các giai đoạn phễu bán hàng và tỷ lệ xác suất thành công',
      icon: <GitCommit size={22} style={{ color: '#ea580c' }} />,
      path: '/pipeline',
    },
    {
      title: 'Lý do Thắng/Thua & Đối thủ',
      desc: 'Chuẩn hóa lý do chốt thành công, thất bại và theo dõi đối thủ cạnh tranh',
      icon: <Target size={22} style={{ color: '#d97706' }} />,
      path: '/win-loss',
    },
    {
      title: 'Trường Tùy chỉnh (Custom Fields)',
      desc: 'Định nghĩa các thuộc tính mở rộng cho đối tượng dữ liệu hệ thống',
      icon: <Sliders size={22} style={{ color: '#4f46e5' }} />,
      path: '/custom-fields',
    },
    {
      title: 'Nhật ký Kiểm toán Hệ thống',
      desc: 'Theo dõi chi tiết các biến động dữ liệu và so sánh thay đổi Diff Viewer',
      icon: <FileText size={22} style={{ color: '#dc2626' }} />,
      path: '/audit-logs',
    },
  ];

  return (
    <div className={styles.dashboard}>
      {/* Toast thông báo đăng nhập thành công */}
      {showLoginToast && (
        <motion.div
          className={styles.loginToast}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
        >
          <div className={styles.loginToast__content}>
            <CheckCircle2 size={24} className={styles.loginToast__icon} />
            <div>
              <h4 className={styles.loginToast__title}>Đăng nhập thành công!</h4>
              <p className={styles.loginToast__desc}>
                Chào mừng <strong>{displayName}</strong> đã đăng nhập thành công vào hệ thống NexusCRM Enterprise.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLoginToast(false)}
            className={styles.loginToast__closeBtn}
            aria-label="Đóng thông báo"
            title="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Hero Banner */}
      <motion.section
        className={styles.heroBanner}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.heroBanner__left}>
          <div className={styles.heroBanner__pill}>
            <ShieldCheck size={14} />
            <span>HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP NEXUSCRM</span>
          </div>
          <h1 className={styles.heroBanner__greeting}>Xin chào, {displayName}.</h1>
          <p className={styles.heroBanner__summary}>
            Hệ thống CRM sẵn sàng hoạt động với đầy đủ tính năng Quản lý người dùng, phân quyền bảo mật,
            sản phẩm, cơ cấu tổ chức và cấu hình quy trình.
          </p>
        </div>

        <div className={styles.heroBanner__actions}>
          <button
            type="button"
            className={styles.heroActionBtn}
            onClick={() => navigate('/users')}
          >
            <Users size={16} />
            <span>Quản lý Người dùng</span>
          </button>
        </div>
      </motion.section>

      {/* KPI System Cards from Real Backend */}
      <section className={styles.kpiGrid} aria-label="Chỉ số hệ thống thực tế">
        <div className={styles.realStatCard}>
          <div className={styles.realStatHeader}>
            <span className={styles.realStatLabel}>Người dùng hệ thống</span>
            <div className={`${styles.realStatIcon} ${styles.statIconBlue}`}>
              <Users size={18} />
            </div>
          </div>
          <strong className={styles.realStatValue}>
            {isLoading ? <RefreshCw size={20} className="spin" /> : stats.totalUsers}
          </strong>
          <span className={styles.realStatDesc}>Tài khoản đã đăng ký trong CSDL</span>
        </div>

        <div className={styles.realStatCard}>
          <div className={styles.realStatHeader}>
            <span className={styles.realStatLabel}>Sản phẩm & Dịch vụ</span>
            <div className={`${styles.realStatIcon} ${styles.statIconGreen}`}>
              <Package size={18} />
            </div>
          </div>
          <strong className={styles.realStatValue}>
            {isLoading ? <RefreshCw size={20} className="spin" /> : stats.totalProducts}
          </strong>
          <span className={styles.realStatDesc}>Mặt hàng trong bảng giá</span>
        </div>

        <div className={styles.realStatCard}>
          <div className={styles.realStatHeader}>
            <span className={styles.realStatLabel}>Danh mục Dùng chung</span>
            <div className={`${styles.realStatIcon} ${styles.statIconPurple}`}>
              <FolderTree size={18} />
            </div>
          </div>
          <strong className={styles.realStatValue}>
            {isLoading ? <RefreshCw size={20} className="spin" /> : stats.totalCategories}
          </strong>
          <span className={styles.realStatDesc}>Danh mục tra cứu chuẩn hóa</span>
        </div>

        <div className={styles.realStatCard}>
          <div className={styles.realStatHeader}>
            <span className={styles.realStatLabel}>Nhật ký Kiểm toán</span>
            <div className={`${styles.realStatIcon} ${styles.statIconRed}`}>
              <FileText size={18} />
            </div>
          </div>
          <strong className={styles.realStatValue}>
            {isLoading ? <RefreshCw size={20} className="spin" /> : stats.totalAuditLogs}
          </strong>
          <span className={styles.realStatDesc}>Lịch sử thao tác được ghi vết</span>
        </div>
      </section>

      {/* Grid: Phân hệ chức năng & Nhật ký kiểm toán gần đây */}
      <section className={styles.bottomGrid}>
        {/* Phân hệ Sprint 1 & 2 */}
        <Card padding="md">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Phân hệ Quản trị & Cấu hình</h2>
              <p className={styles.sectionSubtitle}>
                Truy cập nhanh các phân hệ chức năng trong hệ thống
              </p>
            </div>
          </div>

          <div className={styles.moduleGrid}>
            {quickNavModules.map((m) => (
              <div
                key={m.path}
                className={styles.moduleCard}
                onClick={() => navigate(m.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(m.path);
                  }
                }}
              >
                <div className={styles.moduleCardTop}>
                  <div className={styles.moduleIconBox}>{m.icon}</div>
                </div>
                <h3 className={styles.moduleTitle}>{m.title}</h3>
                <p className={styles.moduleDesc}>{m.desc}</p>
                <div className={styles.moduleAction}>
                  <span>Truy cập</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Nhật ký kiểm toán gần đây từ Backend */}
        <Card padding="md">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Nhật ký Hoạt động Kiểm toán</h2>
              <p className={styles.sectionSubtitle}>
                Các thao tác hệ thống ghi nhận gần đây nhất
              </p>
            </div>
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={() => navigate('/audit-logs')}
            >
              Xem tất cả <ArrowRight size={13} />
            </button>
          </div>

          <div className={styles.auditList}>
            {isLoading ? (
              <div className={styles.loadingBox}>
                <RefreshCw size={20} className="spin" />
                <span>Đang tải nhật ký...</span>
              </div>
            ) : (!recentLogs || recentLogs.length === 0) ? (
              <div className={styles.emptyBox}>
                <FileText size={32} style={{ color: '#94a3b8' }} />
                <span>Chưa có bản ghi nhật ký mới</span>
              </div>
            ) : (
              (recentLogs || []).map((log) => {
                const logTime = log.timestamp || log.created_at;
                return (
                  <div key={log.id} className={styles.auditItem}>
                    <div className={styles.auditDot} />
                    <div className={styles.auditContent}>
                      <div className={styles.auditTopRow}>
                        <strong className={styles.auditAction}>{log.action}</strong>
                        <span className={styles.auditTime}>
                          {logTime
                            ? new Date(logTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Vừa xong'}
                        </span>
                      </div>
                      <p className={styles.auditTarget}>
                        Đối tượng: <code>{log.target_type}</code> · Thực hiện bởi:{' '}
                        <span className={styles.auditUser}>{log.user_name || log.performed_by}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};
