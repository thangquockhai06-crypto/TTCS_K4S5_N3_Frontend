export type StatCardToneType = 'primary' | 'accent' | 'success' | 'warning';

export interface IStatCard {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  changePercent: number;
  changeDirection: 'up' | 'down';
  comparisonLabel: string;
  tone: StatCardToneType;
  iconName: 'users' | 'sparkles' | 'briefcase' | 'trending-up';
  sparkline: number[];
}

export interface IRevenueDataPoint {
  month: string;
  actualArr: number;
  targetArr: number;
  newDealsCount: number;
}

export interface IPipelineVelocityItem {
  stage: string;
  count: number;
  totalValue: number;
  conversionRate: number;
  color: string;
}

export interface INotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  category?: 'deal' | 'security' | 'mention' | 'system' | 'quote' | 'lead' | 'task';
  type?: string;
  targetType?: string;
  targetId?: string;
  linkUrl?: string;
  createdAt?: string;
}

