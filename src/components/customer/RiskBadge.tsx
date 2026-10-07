import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface IRiskBadgeProps {
  isRisk: boolean;
  reason?: string;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<IRiskBadgeProps> = ({ isRisk, reason, size = 'md' }) => {
  if (!isRisk) return null;

  const isSmall = size === 'sm';

  return (
    <span
      title={reason || 'Khách hàng có cảnh báo rủi ro cao (quá hạn hỗ trợ / tương tác)'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isSmall ? '2px 6px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 600,
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        border: '1px solid #FCA5A5',
        cursor: reason ? 'help' : 'default',
        lineHeight: 1.2,
      }}
    >
      <AlertTriangle size={isSmall ? 12 : 14} style={{ color: '#DC2626', flexShrink: 0 }} />
      <span>Nguy cơ cao</span>
    </span>
  );
};
