import { leadRoutingDevelopmentNotice, createLeadRoutingMockSnapshot } from '../mocks/leadRouting.mock';
import {
  ILeadRoutingQueueItem,
  ILeadRoutingRule,
  ILeadRoutingRuleDraft,
  ILeadRoutingSnapshot,
} from '../types/LeadRouting.types';

export interface ILeadRoutingService {
  readonly developmentNotice: string | null;
  getSnapshot(): Promise<ILeadRoutingSnapshot>;
  saveRule(rule: ILeadRoutingRuleDraft): Promise<ILeadRoutingSnapshot>;
  setRuleActive(ruleId: string, isActive: boolean): Promise<ILeadRoutingSnapshot>;
  savePriorityOrder(ruleIds: string[]): Promise<ILeadRoutingSnapshot>;
  assignLead(leadId: string, employeeId: string): Promise<ILeadRoutingSnapshot>;
}

function cloneSnapshot(snapshot: ILeadRoutingSnapshot): ILeadRoutingSnapshot {
  return {
    ...snapshot,
    rules: snapshot.rules.map((rule) => ({ ...rule, assigneeIds: [...rule.assigneeIds] })),
    queue: snapshot.queue.map((item) => ({ ...item })),
    regions: [...snapshot.regions],
    industries: [...snapshot.industries],
    teams: snapshot.teams.map((team) => ({ ...team, memberIds: [...team.memberIds] })),
    employees: snapshot.employees.map((employee) => ({ ...employee })),
  };
}

class MockLeadRoutingService implements ILeadRoutingService {
  readonly developmentNotice = leadRoutingDevelopmentNotice;
  private snapshot = createLeadRoutingMockSnapshot();
  private nextRuleId = 1;

  async getSnapshot(): Promise<ILeadRoutingSnapshot> {
    await this.delay();
    return cloneSnapshot(this.snapshot);
  }

  async saveRule(ruleDraft: ILeadRoutingRuleDraft): Promise<ILeadRoutingSnapshot> {
    await this.delay();
    const team = this.snapshot.teams.find((item) => item.id === ruleDraft.teamId);
    if (!team) {
      throw new Error('Không tìm thấy nhóm kinh doanh đã chọn.');
    }

    const existing = ruleDraft.id
      ? this.snapshot.rules.find((item) => item.id === ruleDraft.id)
      : undefined;
    if (ruleDraft.id && !existing) {
      throw new Error('Quy tắc cần cập nhật không còn tồn tại.');
    }

    const savedRule: ILeadRoutingRule = {
      id: existing?.id ?? `mock-routing-rule-${this.nextRuleId++}`,
      name: ruleDraft.name.trim(),
      strategy: ruleDraft.strategy,
      conditionValue: ruleDraft.conditionValue,
      teamId: team.id,
      teamName: team.name,
      assigneeIds: [...ruleDraft.assigneeIds],
      priority: existing?.priority ?? this.snapshot.rules.length + 1,
      isActive: ruleDraft.isActive,
      updatedAt: new Date().toISOString(),
    };

    const rules = existing
      ? this.snapshot.rules.map((item) => (item.id === savedRule.id ? savedRule : item))
      : [...this.snapshot.rules, savedRule];
    this.snapshot = { ...this.snapshot, rules };
    return cloneSnapshot(this.snapshot);
  }

  async setRuleActive(ruleId: string, isActive: boolean): Promise<ILeadRoutingSnapshot> {
    await this.delay();
    if (!this.snapshot.rules.some((rule) => rule.id === ruleId)) {
      throw new Error('Quy tắc cần cập nhật không còn tồn tại.');
    }
    this.snapshot = {
      ...this.snapshot,
      rules: this.snapshot.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, isActive, updatedAt: new Date().toISOString() } : rule
      ),
    };
    return cloneSnapshot(this.snapshot);
  }

  async savePriorityOrder(ruleIds: string[]): Promise<ILeadRoutingSnapshot> {
    await this.delay();
    if (
      ruleIds.length !== this.snapshot.rules.length ||
      new Set(ruleIds).size !== ruleIds.length ||
      ruleIds.some((id) => !this.snapshot.rules.some((rule) => rule.id === id))
    ) {
      throw new Error('Thứ tự ưu tiên không hợp lệ; hãy tải lại danh sách quy tắc.');
    }
    const byId = new Map(this.snapshot.rules.map((rule) => [rule.id, rule]));
    const rules = ruleIds.map((id, index) => {
      const rule = byId.get(id);
      if (!rule) {
        throw new Error('Không thể xác nhận thứ tự ưu tiên đã lưu.');
      }
      return { ...rule, priority: index + 1, updatedAt: new Date().toISOString() };
    });
    this.snapshot = { ...this.snapshot, rules };
    return cloneSnapshot(this.snapshot);
  }

  async assignLead(leadId: string, employeeId: string): Promise<ILeadRoutingSnapshot> {
    await this.delay();
    const employee = this.snapshot.employees.find((item) => item.id === employeeId);
    const lead = this.snapshot.queue.find((item) => item.id === leadId);
    if (!employee || !lead) {
      throw new Error('Không tìm thấy Lead hoặc nhân viên được chọn.');
    }
    if (lead.status !== 'awaiting-manual-assignment' && lead.status !== 'failed') {
      throw new Error('Lead này không còn chờ phân công thủ công.');
    }

    const assignedAt = new Date().toISOString();
    const updatedLead: ILeadRoutingQueueItem = {
      ...lead,
      status: 'assigned',
      pendingReason: undefined,
      pendingReasonType: undefined,
      assignmentResult: `Đã phân công thủ công cho ${employee.name}.`,
      assignedTo: employee.name,
      assignedAt,
    };
    this.snapshot = {
      ...this.snapshot,
      queue: this.snapshot.queue.map((item) => (item.id === leadId ? updatedLead : item)),
    };
    return cloneSnapshot(this.snapshot);
  }

  private delay(): Promise<void> {
    return new Promise<void>((resolve) => window.setTimeout(resolve, 120));
  }
}

class UnavailableLeadRoutingService implements ILeadRoutingService {
  readonly developmentNotice = null;

  private unavailable(): Error {
    return new Error(
      'Lead routing APIs are not integrated. Configure the backend contracts before enabling this feature.'
    );
  }

  async getSnapshot(): Promise<ILeadRoutingSnapshot> {
    throw this.unavailable();
  }

  async saveRule(_rule: ILeadRoutingRuleDraft): Promise<ILeadRoutingSnapshot> {
    throw this.unavailable();
  }

  async setRuleActive(_ruleId: string, _isActive: boolean): Promise<ILeadRoutingSnapshot> {
    throw this.unavailable();
  }

  async savePriorityOrder(_ruleIds: string[]): Promise<ILeadRoutingSnapshot> {
    throw this.unavailable();
  }

  async assignLead(_leadId: string, _employeeId: string): Promise<ILeadRoutingSnapshot> {
    throw this.unavailable();
  }
}

export const leadRoutingService: ILeadRoutingService = import.meta.env.DEV
  ? new MockLeadRoutingService()
  : new UnavailableLeadRoutingService();
