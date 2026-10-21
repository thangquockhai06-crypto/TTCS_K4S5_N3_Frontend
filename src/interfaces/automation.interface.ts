/**
 * S7-09: Tự động hóa IF–THEN (Automation Rules Engine) Interfaces.
 */

export interface IAutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface IAutomationActionConfig {
  title?: string;
  description?: string;
  priority?: string;
  due_days?: number;
  user_id?: string;
  new_owner_id?: string;
  [key: string]: unknown;
}

export interface IAutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerEntity: 'deal' | 'lead' | 'quotation' | 'contract';
  triggerEvent: string;
  conditions?: IAutomationCondition | unknown;
  actionType: 'create_task' | 'send_notification' | 'change_owner';
  actionConfig: IAutomationActionConfig | unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateAutomationRuleDTO {
  name: string;
  description?: string;
  isActive: boolean;
  triggerEntity: string;
  triggerEvent: string;
  conditions?: unknown;
  actionType: string;
  actionConfig: unknown;
}

export interface IAutomationLog {
  id: string;
  ruleId?: string;
  ruleName: string;
  triggerEvent: string;
  entityType: string;
  entityId: string;
  actionType: string;
  status: 'success' | 'failed' | 'skipped';
  details?: string;
  executedAt: string;
}
