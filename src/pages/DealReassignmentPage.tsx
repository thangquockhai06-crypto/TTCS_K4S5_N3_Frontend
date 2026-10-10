import React from 'react';
import { Badge } from '../components/common';
import { DealReassignmentDashboard } from '../components/deal-reassignment/DealReassignmentDashboard';
import styles from './DealReassignmentPage.module.css';

export const DealReassignmentPage: React.FC = () => {
  return (
    <div className={styles.reassignPage}>
      <header className={styles.reassignPage__header}>
        <div className={styles.reassignPage__badgeWrap}>
          <Badge tone="accent" dot>
            TRƯỞNG NHÓM KINH DOANH · WORKLOAD & DEAL REASSIGNMENT
          </Badge>
        </div>
        <h1 className={styles.reassignPage__title}>
          Phân Bổ Lại Cơ Hội Cho Nhân Sự Trong Nhóm (Deal Reassignment)
        </h1>
        <p className={styles.reassignPage__subtitle}>
          Cho phép Trưởng nhóm kinh doanh chuyển quyền sở hữu một hoặc nhiều thương vụ cùng lúc
          khi người phụ trách nghỉ dài ngày hoặc quá tải. Người nhận mới thấy ngay cơ hội trong danh
          sách kèm toàn bộ lịch sử trao đổi, mọi lượt bàn giao đều được lưu vết minh bạch kèm lý do.
        </p>
      </header>

      <DealReassignmentDashboard />
    </div>
  );
};
