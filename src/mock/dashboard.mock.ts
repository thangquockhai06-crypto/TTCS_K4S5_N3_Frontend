import {
  INotificationItem,
  IPipelineVelocityItem,
  IRevenueDataPoint,
  IStatCard,
} from '../interfaces';

export const DASHBOARD_KPI_CARDS: ReadonlyArray<IStatCard> = [
  {
    id: 'kpi-total-customers',
    label: 'Tổng khách hàng',
    value: '1,482',
    numericValue: 1482,
    changePercent: 18.4,
    changeDirection: 'up',
    comparisonLabel: '+64 doanh nghiệp quý này',
    tone: 'primary',
    iconName: 'users',
    sparkline: [38, 44, 42, 51, 58, 63, 72, 84],
  },
  {
    id: 'kpi-new-leads',
    label: 'Khách hàng tiềm năng mới',
    value: '318',
    numericValue: 318,
    changePercent: 24.2,
    changeDirection: 'up',
    comparisonLabel: '92% đạt chuẩn thẩm định',
    tone: 'accent',
    iconName: 'sparkles',
    sparkline: [22, 28, 31, 29, 40, 48, 52, 66],
  },
  {
    id: 'kpi-active-deals',
    label: 'Cơ hội đang triển khai',
    value: '$4.86M',
    numericValue: 4860000,
    changePercent: 14.8,
    changeDirection: 'up',
    comparisonLabel: '42 hợp đồng Enterprise',
    tone: 'success',
    iconName: 'briefcase',
    sparkline: [45, 50, 49, 58, 62, 71, 76, 89],
  },
  {
    id: 'kpi-conversion-rate',
    label: 'Tỷ lệ chuyển đổi',
    value: '34.6%',
    numericValue: 34.6,
    changePercent: 4.1,
    changeDirection: 'up',
    comparisonLabel: 'Top 5% chuẩn B2B SaaS',
    tone: 'warning',
    iconName: 'trending-up',
    sparkline: [26, 28, 27, 30, 31, 32, 33, 35],
  },
];

export const MONTHLY_REVENUE_SERIES: ReadonlyArray<IRevenueDataPoint> = [
  { month: 'Th4', actualArr: 640, targetArr: 600, newDealsCount: 14 },
  { month: 'Th5', actualArr: 720, targetArr: 680, newDealsCount: 17 },
  { month: 'Th6', actualArr: 810, targetArr: 750, newDealsCount: 19 },
  { month: 'Th7', actualArr: 890, targetArr: 820, newDealsCount: 22 },
  { month: 'Th8', actualArr: 1040, targetArr: 920, newDealsCount: 26 },
  { month: 'Th9', actualArr: 1280, targetArr: 1050, newDealsCount: 31 },
];

export const PIPELINE_VELOCITY_METRICS: ReadonlyArray<IPipelineVelocityItem> = [
  {
    stage: 'Tiếp nhận & Phân loại (New)',
    count: 64,
    totalValue: 1420000,
    conversionRate: 78,
    color: '#2563EB',
  },
  {
    stage: 'Khảo sát & Demo Kỹ thuật',
    count: 38,
    totalValue: 1890000,
    conversionRate: 62,
    color: '#8B5CF6',
  },
  {
    stage: 'Đàm phán Pháp lý & Bảo mật',
    count: 19,
    totalValue: 1550000,
    conversionRate: 84,
    color: '#F59E0B',
  },
  {
    stage: 'Chốt thành công (Quý 3)',
    count: 16,
    totalValue: 1280000,
    conversionRate: 100,
    color: '#10B981',
  },
];

export const INITIAL_NOTIFICATIONS: ReadonlyArray<INotificationItem> = [
  {
    id: 'notif-1',
    title: 'Stripe Japan đã ký hợp đồng Enterprise ($420,000 ARR)',
    description: 'Bản hợp đồng có chữ ký số đã được Sora Takahashi tải lên 14 phút trước.',
    timeAgo: '14 phút trước',
    isRead: false,
    category: 'deal',
  },
  {
    id: 'notif-2',
    title: 'Attio Cloud chuyển sang giai đoạn Đàm phán Pháp lý',
    description: 'Henrik Lindqvist đã phê duyệt hồ sơ bảo mật SOC2 Type II.',
    timeAgo: '1 giờ trước',
    isRead: false,
    category: 'deal',
  },
  {
    id: 'notif-3',
    title: 'Trần Thu Hà đã nhắc đến bạn trong hồ sơ VNG Cloud',
    description: '"@Admin vui lòng duyệt phụ lục SLA hạ tầng đám mây trước 16:00 hôm nay."',
    timeAgo: '3 giờ trước',
    isRead: false,
    category: 'mention',
  },
  {
    id: 'notif-4',
    title: 'Cơ chế tự động làm mới JWT (S1-02) đang hoạt động',
    description: 'Interceptor trong axiosInstance.ts đã sẵn sàng tự động xoay vòng token.',
    timeAgo: '5 giờ trước',
    isRead: true,
    category: 'security',
  },
];
