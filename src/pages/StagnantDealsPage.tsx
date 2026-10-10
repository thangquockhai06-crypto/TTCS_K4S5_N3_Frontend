import React from 'react';
import { Badge } from '../components/common';
import { StagnantDealDashboard } from '../components/stagnant-deals/StagnantDealDashboard';
import styles from './StagnantDealsPage.module.css';

export const StagnantDealsPage: React.FC = () => {
  return (
    <div className={styles.stagnantPage}>
      <header className={styles.stagnantPage__header}>
        <div className={styles.stagnantPage__badgeWrap}>
          <Badge tone="danger" dot>
            TRƯỞNG NHÓM KINH DOANH · PIPELINE HEALTH & DEAL RESCUE
          </Badge>
        </div>
        <h1 className={styles.stagnantPage__title}>
          Cảnh Báo & Can Thiệp Cơ Hội Đình Trệ (Stagnant Deals Alert)
        </h1>
        <p className={styles.stagnantPage__subtitle}>
          Hệ thống quét tự động phát hiện sớm các thương vụ không có hoạt động trong quá N ngày
          (cấu hình theo từng giai đoạn phễu) hoặc đã quá ngày dự kiến chốt mà chưa đóng, giúp Trưởng
          nhóm can thiệp kịp thời trước khi thương vụ nguội lạnh.
        </p>
      </header>

      <StagnantDealDashboard />
    </div>
  );
};
