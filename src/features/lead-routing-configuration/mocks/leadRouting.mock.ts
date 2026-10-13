import { AVAILABLE_GROUPS, IUserItem } from '../../../interfaces/user-management.interface';
import { MOCK_CUSTOMERS } from '../../../mock/customers';
import { INITIAL_USERS } from '../../../mock/users.mock';
import {
  ILeadRoutingEmployee,
  ILeadRoutingQueueItem,
  ILeadRoutingRule,
  ILeadRoutingSnapshot,
  ILeadRoutingTeam,
} from '../types/LeadRouting.types';

const REGIONS = [
  'Miền Bắc',
  'Miền Trung',
  'Miền Nam',
  'Đồng bằng Sông Cửu Long',
] as const;

function getActiveSalesUsers(users: readonly IUserItem[]): IUserItem[] {
  return users.filter((user) => user.status === 'active' && user.roles.includes('sales'));
}

function createTeams(users: readonly IUserItem[]): ILeadRoutingTeam[] {
  return AVAILABLE_GROUPS.map((name) => ({
    id: name,
    name,
    memberIds: users.filter((user) => user.group === name).map((user) => user.id),
  }));
}

function createEmployees(users: readonly IUserItem[]): ILeadRoutingEmployee[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    teamId: user.group,
    teamName: user.group,
  }));
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const activeSalesUsers = getActiveSalesUsers(INITIAL_USERS);
const teams = createTeams(activeSalesUsers);
const employees = createEmployees(activeSalesUsers);
const industries = Array.from(new Set(MOCK_CUSTOMERS.map((customer) => customer.industry))).sort(
  (left, right) => left.localeCompare(right, 'vi')
);

const initialRules: ILeadRoutingRule[] = [
  {
    id: 'rule-north-region',
    name: 'Lead khu vực miền Bắc',
    strategy: 'region',
    conditionValue: REGIONS[0],
    teamId: 'Miền Bắc (Hà Nội)',
    teamName: 'Miền Bắc (Hà Nội)',
    assigneeIds: [],
    priority: 1,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-software-industry',
    name: 'Lead công nghệ phần mềm',
    strategy: 'industry',
    conditionValue: industries[0] ?? '',
    teamId: 'Doanh nghiệp FDI & Toàn cầu',
    teamName: 'Doanh nghiệp FDI & Toàn cầu',
    assigneeIds: [],
    priority: 2,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-north-round-robin',
    name: 'Chia đều nhóm miền Bắc',
    strategy: 'round-robin',
    conditionValue: '',
    teamId: 'Miền Bắc (Hà Nội)',
    teamName: 'Miền Bắc (Hà Nội)',
    assigneeIds: teams.find((team) => team.id === 'Miền Bắc (Hà Nội)')?.memberIds ?? [],
    priority: 3,
    isActive: false,
    updatedAt: new Date().toISOString(),
  },
];

const initialQueue: ILeadRoutingQueueItem[] = [
  {
    id: 'lead-queue-1001',
    fullName: 'Nguyễn Minh Anh',
    company: 'Công ty Sao Bắc',
    email: 'minhanh@example.test',
    phone: '090 000 1001',
    industry: industries[0] ?? 'Chưa có dữ liệu',
    region: REGIONS[0],
    receivedAt: minutesAgo(4.4),
    status: 'awaiting-manual-assignment',
    pendingReasonType: 'unmatched',
    pendingReason: 'Không có quy tắc đang hoạt động phù hợp với khu vực và ngành của Lead.',
  },
  {
    id: 'lead-queue-1002',
    fullName: 'Lê Hoàng Nam',
    company: 'An Phát Logistics',
    email: 'hoangnam@example.test',
    phone: '090 000 1002',
    industry: industries[1] ?? industries[0] ?? 'Chưa có dữ liệu',
    region: REGIONS[1],
    receivedAt: minutesAgo(6.2),
    status: 'failed',
    pendingReasonType: 'assignment-failed',
    pendingReason: 'Không thể hoàn tất phân công tự động; cần quản lý kiểm tra.',
  },
  {
    id: 'lead-queue-1003',
    fullName: 'Phạm Ngọc Hà',
    company: 'Mộc Nhiên Retail',
    email: 'ngocha@example.test',
    phone: '090 000 1003',
    industry: industries[2] ?? industries[0] ?? 'Chưa có dữ liệu',
    region: REGIONS[2],
    receivedAt: minutesAgo(1.8),
    status: 'processing',
    pendingReason: 'Đang xử lý phân công tự động.',
  },
  {
    id: 'lead-queue-1004',
    fullName: 'Vũ Đức Long',
    company: 'Đại Dương Tech',
    email: 'duclong@example.test',
    phone: '090 000 1004',
    industry: industries[3] ?? industries[0] ?? 'Chưa có dữ liệu',
    region: REGIONS[0],
    receivedAt: minutesAgo(2.1),
    status: 'assigned',
    assignmentResult: 'Đã phân công theo quy tắc miền Bắc.',
    assignedTo: activeSalesUsers[0]?.name,
    assignedAt: minutesAgo(1.9),
  },
];

export const leadRoutingDevelopmentNotice =
  'DEVELOPMENT MOCK DATA — No real lead assignment is being executed.';

export function createLeadRoutingMockSnapshot(): ILeadRoutingSnapshot {
  return {
    rules: initialRules.map((rule) => ({ ...rule, assigneeIds: [...rule.assigneeIds] })),
    queue: initialQueue.map((item) => ({ ...item })),
    regions: [...REGIONS],
    industries: [...industries],
    teams: teams.map((team) => ({ ...team, memberIds: [...team.memberIds] })),
    employees: employees.map((employee) => ({ ...employee })),
  };
}
