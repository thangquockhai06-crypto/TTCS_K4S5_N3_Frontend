import React from 'react';
import { Badge } from '../components/common';
import { WeightedForecastDashboard } from '../components/forecast/WeightedForecastDashboard';
import styles from './ForecastPage.module.css';

export const ForecastPage: React.FC = () => {
  return (
    <div className={styles.forecastPage}>
      <header className={styles.forecastPage__header}>
        <div className={styles.forecastPage__badgeWrap}>
          <Badge tone="accent" dot>
            GIÁM ĐỐC KINH DOANH · REVENUE FORECASTING
          </Badge>
        </div>
        <h1 className={styles.forecastPage__title}>
          Dự Báo Doanh Số Theo Trọng Số Xác Suất (Weighted Pipeline Forecast)
        </h1>
        <p className={styles.forecastPage__subtitle}>
          Mô hình dự báo doanh thu định lượng dựa trên tổng giá trị cơ hội nhân với xác suất thắng
          của từng giai đoạn phễu bán hàng, so sánh trực quan với chỉ tiêu KPI và phân tích chi tiết
          theo từng nhân viên và nhóm kinh doanh.
        </p>
      </header>

      <WeightedForecastDashboard />
    </div>
  );
};
