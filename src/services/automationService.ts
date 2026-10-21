import { axiosInstance } from '../utils/axiosInstance';
import {
  IAutomationRule,
  ICreateAutomationRuleDTO,
  IAutomationLog,
} from '../interfaces/automation.interface';

class AutomationService {
  async getRules(): Promise<IAutomationRule[]> {
    try {
      const response = await axiosInstance.get<IAutomationRule[]>('/automations');
      return response.data;
    } catch (err: unknown) {
      console.warn('Backend /automations unavailable, falling back to local storage:', err);
      return this.getLocalRules();
    }
  }

  async createRule(payload: ICreateAutomationRuleDTO): Promise<IAutomationRule> {
    const response = await axiosInstance.post<IAutomationRule>('/automations', payload);
    const created = response.data;
    this.saveLocalRule(created);
    return created;
  }

  async toggleRule(id: string): Promise<IAutomationRule> {
    const response = await axiosInstance.patch<IAutomationRule>(`/automations/${id}/toggle`);
    const updated = response.data;
    this.saveLocalRule(updated);
    return updated;
  }

  async deleteRule(id: string): Promise<void> {
    await axiosInstance.delete(`/automations/${id}`);
    this.removeLocalRule(id);
  }

  async getLogs(ruleId?: string): Promise<IAutomationLog[]> {
    try {
      const response = await axiosInstance.get<IAutomationLog[]>('/automations/logs', {
        params: { ruleId },
      });
      return response.data;
    } catch {
      return [];
    }
  }

  // Local storage helpers
  private getLocalRules(): IAutomationRule[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('nexus_automation_rules_list');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveLocalRule(rule: IAutomationRule): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getLocalRules();
      const idx = list.findIndex((r) => r.id === rule.id);
      if (idx >= 0) {
        list[idx] = rule;
      } else {
        list.unshift(rule);
      }
      window.localStorage.setItem('nexus_automation_rules_list', JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private removeLocalRule(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getLocalRules().filter((r) => r.id !== id);
      window.localStorage.setItem('nexus_automation_rules_list', JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

export const automationService = new AutomationService();
