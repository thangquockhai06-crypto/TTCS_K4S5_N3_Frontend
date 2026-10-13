import React, { useState } from 'react';
import { Flame, Thermometer, Snowflake, Info } from 'lucide-react';
import { LeadTemperatureType } from '../../interfaces/lead-scoring.interface';
import styles from './LeadScoreBadge.module.css';

export interface ILeadScoreBadgeProps {
  score: number;
  temperature?: LeadTemperatureType;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  showLabel?: boolean;
  showTooltip?: boolean;
  matchedCriteria?: { criterionName: string; points: number }[];
  recommendedAction?: string;
  className?: string;
}

export const LeadScoreBadge: React.FC<ILeadScoreBadgeProps> = ({
  score,
  temperature,
  size = 'md',
  showScore = true,
  showLabel = true,
  showTooltip = true,
  matchedCriteria = [],
  recommendedAction,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Tự động phân loại nếu không truyền temperature
  const temp: LeadTemperatureType =
    temperature || (score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold');

  const config = {
    Hot: {
      label: 'Nóng',
      icon: <Flame size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className={styles['icon--hot']} />,
      styleClass: styles['badge--hot'],
      action: recommendedAction || 'Ưu tiên gọi điện tư vấn ngay trong 15 phút',
    },
    Warm: {
      label: 'Ấm',
      icon: <Thermometer size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className={styles['icon--warm']} />,
      styleClass: styles['badge--warm'],
      action: recommendedAction || 'Phân bổ telesales liên hệ trong vòng 24 giờ',
    },
    Cold: {
      label: 'Lạnh',
      icon: <Snowflake size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className={styles['icon--cold']} />,
      styleClass: styles['badge--cold'],
      action: recommendedAction || 'Tự động đưa vào luồng Email Drip nuôi dưỡng',
    },
  }[temp];

  return (
    <div
      className={styles.badgeWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`${styles.badge} ${styles[`badge--${size}`]} ${config.styleClass} ${className}`}
        role="status"
        aria-label={`Điểm đánh giá lead: ${score} điểm, phân loại: ${config.label}`}
      >
        {config.icon}
        {showScore && <span className={styles.scoreNumber}>{score}đ</span>}
        {showScore && showLabel && <span className={styles.labelDot}>·</span>}
        {showLabel && <span className={styles.temperatureLabel}>{config.label}</span>}
      </div>

      {/* Tooltip giải thích chi tiết */}
      {showTooltip && isHovered && (
        <div className={styles.tooltip} role="tooltip">
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipTitle}>
              {config.icon} Lead {config.label}
            </span>
            <span className={styles.tooltipScore}>{score} / 100 điểm</span>
          </div>

          <div className={styles.tooltipAction}>
            <Info size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {config.action}
          </div>

          {matchedCriteria.length > 0 && (
            <div className={styles.tooltipCriteriaList}>
              {matchedCriteria.slice(0, 4).map((c, idx) => (
                <div key={idx} className={styles.tooltipCriterionItem}>
                  <span>✓ {c.criterionName}</span>
                  <span className={styles.tooltipCriterionPts}>+{c.points}đ</span>
                </div>
              ))}
              {matchedCriteria.length > 4 && (
                <div style={{ fontSize: '0.68rem', color: '#64748B', fontStyle: 'italic', marginTop: 2 }}>
                  + {matchedCriteria.length - 4} tiêu chí phù hợp khác
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
