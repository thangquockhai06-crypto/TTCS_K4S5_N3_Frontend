import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarCheck2, Kanban, Plus, Sparkles } from 'lucide-react';
import {
  getCustomerStatusLabel,
  getCustomerStatusTone,
} from '../components/customer/CustomerCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { MiniCharts } from '../components/dashboard/MiniCharts';
import { Avatar, Badge, Button, Card, StatCard } from '../components/common';
import { useCRMData } from '../context/CRMDataContext';
import { useAuth } from '../hooks/useAuth';
import { DASHBOARD_KPI_CARDS } from '../mock/dashboard.mock';
import { formatCurrency } from '../utils/formatters';
import styles from './DashboardPage.module.css';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { customers } = useCRMData();
  const navigate = useNavigate();

  const recentActivities = useMemo(() => {
    return customers.flatMap((c) => c.activities).slice(0, 6);
  }, [customers]);

  const topAccounts = useMemo(() => {
    return [...customers].sort((a, b) => b.dealValue - a.dealValue).slice(0, 5);
  }, [customers]);

  const displayName = user?.fullName ?? 'Quản Trị Viên Hệ Thống';

  return (
    <div className={styles.dashboard}>
      {/* Hero Section */}
      <motion.section
        className={styles.heroBanner}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.heroBanner__left}>
          <div className={styles.heroBanner__pill}>
            <Sparkles size={13} />
            <span>BÁO CÁO TỔNG QUAN DOANH THU QUÝ 3</span>
          </div>
          <h1 className={styles.heroBanner__greeting}>Xin chào, {displayName}.</h1>
          <p className={styles.heroBanner__summary}>
            Hệ thống đang theo dõi tổng giá trị cơ hội <strong>$4.86M</strong> trên{' '}
            <strong>42 hợp đồng đang triển khai</strong>. Hôm nay bạn có{' '}
            <strong>4 cuộc họp gia hạn cấp cao</strong> cần phê duyệt.
          </p>
        </div>

        <div className={styles.heroBanner__actions}>
          <Button
            variant="secondary"
            leftIcon={<Kanban size={16} />}
            onClick={() => navigate('/deals')}
          >
            Mở Phễu Cơ hội
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/customers/new')}
          >
            Thêm khách hàng
          </Button>
        </div>
      </motion.section>

      {/* 4 KPI Cards */}
      <section className={styles.kpiGrid} aria-label="Chỉ số hiệu suất chính (KPI)">
        {DASHBOARD_KPI_CARDS.map((stat, idx) => (
          <StatCard key={stat.id} stat={stat} index={idx} />
        ))}
      </section>

      {/* Mini Charts Section */}
      <section aria-label="Phân tích doanh thu và phễu bán hàng">
        <MiniCharts />
      </section>

      {/* Bottom Split: Activity Feed + Priority Enterprise Accounts */}
      <section className={styles.bottomGrid}>
        <Card padding="md" className={styles.feedCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Nhật ký Hoạt động Mới nhất</h2>
              <p className={styles.sectionSubtitle}>
                Cập nhật tương tác thời gian thực với các doanh nghiệp lớn
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/activities')}
            >
              Xem tất cả
            </Button>
          </div>
          <ActivityFeed activities={recentActivities} />
        </Card>

        <Card padding="md" className={styles.accountsCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Khách hàng Doanh nghiệp Trọng điểm</h2>
              <p className={styles.sectionSubtitle}>
                Các hợp đồng có giá trị ARR cao nhất trong danh mục
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/customers')}
            >
              Tất cả ({customers.length})
            </Button>
          </div>

          <div className={styles.topAccountsList}>
            {topAccounts.map((customer) => (
              <div
                key={customer.id}
                className={styles.accountRow}
                onClick={() => navigate(`/customers/${customer.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/customers/${customer.id}`);
                  }
                }}
              >
                <Avatar src={customer.avatarUrl} name={customer.fullName} size="md" />
                <div className={styles.accountRow__info}>
                  <strong className={styles.accountRow__company}>{customer.company}</strong>
                  <span className={styles.accountRow__contact}>
                    {customer.fullName} · {customer.role}
                  </span>
                </div>
                <div className={styles.accountRow__right}>
                  <strong className={`${styles.accountRow__arr} tabular-nums`}>
                    {formatCurrency(customer.dealValue)}
                  </strong>
                  <Badge
                    tone={getCustomerStatusTone(customer.status)}
                    size="sm"
                    dot
                  >
                    {getCustomerStatusLabel(customer.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.upcomingCallBox}>
            <CalendarCheck2 size={18} className={styles.upcomingCallBox__icon} />
            <div>
              <strong>Lịch họp Cấp cao tiếp theo · 14:00 Hôm nay</strong>
              <p>Attio Cloud ($240K ARR) — Ký duyệt Pháp lý & Kiến trúc Bảo mật SOC2</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
