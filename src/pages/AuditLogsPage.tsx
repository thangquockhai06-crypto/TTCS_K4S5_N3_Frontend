import React from 'react';
import { AuditLogViewer } from '../components/audit/AuditLogViewer';

export const AuditLogsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Nhật ký Kiểm toán Hệ thống
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
          Ghi nhận toàn bộ biến động thay đổi dữ liệu, lịch sử thao tác của người dùng và so sánh giá trị cũ - mới (Diff Viewer)
        </p>
      </header>

      <AuditLogViewer />
    </div>
  );
};
