import React, { useMemo } from 'react';
import { MiniCharts } from '../components/dashboard/MiniCharts';
import { Badge, Card } from '../components/common';
import { useCRMData } from '../context/CRMDataContext';
import { formatCurrency } from '../utils/formatters';
import styles from './ReportsPage.module.css';

const TIER_LABELS: Record<string, string> = {
  Enterprise: 'Phân khúc Tập đoàn lớn',
  'Mid-Market': 'Phân khúc Vừa & Lớn',
  Growth: 'Phân khúc Tăng trưởng',
  Startup: 'Phân khúc Khởi nghiệp',
};

export const ReportsPage: React.FC = () => {
  const { customers } = useCRMData();

  const tierBreakdown = useMemo(() => {
    const tiers = ['Enterprise', 'Mid-Market', 'Growth', 'Startup'] as const;
    return tiers.map((tier) => {
      const matched = customers.filter((c) => c.tier === tier);
      const arr = matched.reduce((sum, c) => sum + c.dealValue, 0);
      return {
        tier,
        label: TIER_LABELS[tier] ?? tier,
        count: matched.length,
        arr,
      };
    });
  }, [customers]);

  return (
    <div className={styles.reportsPage}>
      <header>
        <Badge tone="accent" dot>
          PHÂN TÍCH DỮ LIỆU ĐIỀU HÀNH
        </Badge>
        <h1 className={styles.title}>Báo cáo doanh thu & Phân khúc khách hàng</h1>
        <p className={styles.subtitle}>
          Phân bổ doanh thu định kỳ (ARR) theo từng phân khúc doanh nghiệp, tốc độ giữ chân khách hàng
          và hiệu suất theo khu vực.
        </p>
      </header>

      <div className={styles.tierGrid}>
        {tierBreakdown.map((item) => (
          <Card key={item.tier} padding="md" className={styles.tierCard}>
            <span className={styles.tierCard__label}>{item.label}</span>
            <strong className={`${styles.tierCard__arr} tabular-nums`}>
              {formatCurrency(item.arr)}
            </strong>
            <span className={styles.tierCard__count}>{item.count} khách hàng đang hoạt động</span>
          </Card>
        ))}
      </div>

      <MiniCharts />
    </div>
  );
};
