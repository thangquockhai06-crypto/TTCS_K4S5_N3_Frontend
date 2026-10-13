import React, { FormEvent, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  ContactRound,
  GitBranch,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Users,
  X,
} from 'lucide-react';
import { Button, PermissionGuard } from '../../../components/common';
import { useAuthorization } from '../../../hooks/useAuthorization';
import {
  ILeadRoutingRule,
  ILeadRoutingRuleDraft,
  LeadRoutingQueueFilterType,
  LeadRoutingStatusType,
  LeadRoutingStrategyType,
} from '../types/LeadRouting.types';
import { useLeadRoutingConfiguration } from '../hooks/useLeadRoutingConfiguration';
import {
  formatWaitingDuration,
  getLeadRoutingSlaState,
  matchesLeadRoutingQueueFilter,
  validateLeadRoutingRule,
} from '../utils/leadRouting';
import styles from '../styles/LeadRoutingConfiguration.module.css';

interface IRuleFormProps {
  initialRule: ILeadRoutingRule | null;
  regions: string[];
  industries: string[];
  teams: Array<{ id: string; name: string; memberIds: string[] }>;
  employees: Array<{ id: string; name: string; teamId: string; teamName: string }>;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (draft: ILeadRoutingRuleDraft) => Promise<boolean>;
}

function strategyLabel(strategy: LeadRoutingStrategyType): string {
  switch (strategy) {
    case 'region':
      return 'Theo khu vực';
    case 'industry':
      return 'Theo ngành hàng';
    case 'round-robin':
      return 'Chia vòng (Round Robin)';
  }
}

function statusLabel(status: LeadRoutingStatusType): string {
  switch (status) {
    case 'pending':
      return 'Đang chờ';
    case 'processing':
      return 'Đang xử lý';
    case 'assigned':
      return 'Đã phân công';
    case 'failed':
      return 'Phân công thất bại';
    default:
      return 'Chờ phân công thủ công';
  }
}

const RuleForm: React.FC<IRuleFormProps> = ({
  initialRule,
  regions,
  industries,
  teams,
  employees,
  isSaving,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(initialRule?.name ?? '');
  const [strategy, setStrategy] = useState<LeadRoutingStrategyType>(
    initialRule?.strategy ?? 'region'
  );
  const [conditionValue, setConditionValue] = useState(initialRule?.conditionValue ?? '');
  const [teamId, setTeamId] = useState(initialRule?.teamId ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initialRule?.assigneeIds ?? []);
  const [isActive, setIsActive] = useState(initialRule?.isActive ?? true);
  const [formError, setFormError] = useState<string | null>(null);

  const team = teams.find((item) => item.id === teamId);
  const availableMembers = employees.filter((employee) => employee.teamId === teamId);
  const conditions = strategy === 'region' ? regions : industries;

  const onStrategyChange = (nextStrategy: LeadRoutingStrategyType): void => {
    setStrategy(nextStrategy);
    setConditionValue('');
    setAssigneeIds([]);
  };

  const onTeamChange = (nextTeamId: string): void => {
    setTeamId(nextTeamId);
    const validMembers = teams.find((item) => item.id === nextTeamId)?.memberIds ?? [];
    setAssigneeIds((current) => current.filter((id) => validMembers.includes(id)));
  };

  const toggleAssignee = (employeeId: string): void => {
    setAssigneeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    const draft: ILeadRoutingRuleDraft = {
      id: initialRule?.id,
      name,
      strategy,
      conditionValue: strategy === 'round-robin' ? '' : conditionValue,
      teamId,
      assigneeIds: strategy === 'round-robin' ? assigneeIds : [],
      isActive,
    };
    const validationMessage = validateLeadRoutingRule(
      draft,
      team?.memberIds ?? []
    );
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    if (await onSave(draft)) {
      onCancel();
    }
  };

  return (
    <form className={styles.ruleForm} onSubmit={(event) => void submit(event)} noValidate>
      <div className={styles.ruleForm__heading}>
        <div>
          <p className={styles.eyebrow}>{initialRule ? 'CẬP NHẬT QUY TẮC' : 'QUY TẮC MỚI'}</p>
          <h3>{initialRule ? 'Chỉnh sửa quy tắc' : 'Tạo quy tắc điều phối'}</h3>
        </div>
        <Button variant="ghost" aria-label="Đóng biểu mẫu" onClick={onCancel}>
          <X size={18} />
        </Button>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Tên quy tắc <span aria-hidden="true">*</span></span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            aria-invalid={Boolean(formError && !name.trim())}
            placeholder="VD: Lead khu vực miền Bắc"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Chiến lược</span>
          <select
            value={strategy}
            onChange={(event) => onStrategyChange(event.target.value as LeadRoutingStrategyType)}
          >
            <option value="region">Theo khu vực</option>
            <option value="industry">Theo ngành hàng</option>
            <option value="round-robin">Round Robin theo nhóm</option>
          </select>
        </label>

        {strategy !== 'round-robin' && (
          <label className={styles.field}>
            <span>{strategy === 'region' ? 'Khu vực áp dụng' : 'Ngành hàng áp dụng'}</span>
            <select value={conditionValue} onChange={(event) => setConditionValue(event.target.value)}>
              <option value="">Chọn điều kiện</option>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </label>
        )}

        <label className={styles.field}>
          <span>{strategy === 'round-robin' ? 'Nhóm sales' : 'Nhóm nhận Lead'}</span>
          <select value={teamId} onChange={(event) => onTeamChange(event.target.value)}>
            <option value="">Chọn nhóm kinh doanh</option>
            {teams.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      {strategy === 'round-robin' && teamId && (
        <fieldset className={styles.memberPicker}>
          <legend>Nhân viên tham gia Round Robin (chọn ít nhất 2)</legend>
          {availableMembers.length === 0 ? (
            <p className={styles.muted}>Nhóm này chưa có nhân viên sales đang hoạt động.</p>
          ) : (
            <div className={styles.memberPicker__list}>
              {availableMembers.map((employee) => (
                <label key={employee.id} className={styles.checkOption}>
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(employee.id)}
                    onChange={() => toggleAssignee(employee.id)}
                  />
                  <span>{employee.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      <label className={styles.activeControl}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        <span>Kích hoạt quy tắc sau khi lưu</span>
      </label>

      {formError && <p className={styles.inlineError} role="alert">{formError}</p>}
      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
          {initialRule ? 'Lưu thay đổi' : 'Tạo quy tắc'}
        </Button>
      </div>
    </form>
  );
};

export const LeadRoutingConfigurationPage: React.FC = () => {
  const configuration = useLeadRoutingConfiguration();
  const { hasPermission, isLeader } = useAuthorization();
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [queueFilter, setQueueFilter] = useState<LeadRoutingQueueFilterType>('all');
  const [queueSearch, setQueueSearch] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<Record<string, string>>({});
  const [priorityDirty, setPriorityDirty] = useState(false);
  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);
  const canManageLeads = isLeader && hasPermission('manage_deals');
  const snapshot = configuration.snapshot;
  const rules = snapshot?.rules ?? [];

  const orderedRules = useMemo(() => {
    const byPriority = [...rules].sort((left, right) => left.priority - right.priority);
    if (!priorityDirty || priorityOrder.length !== byPriority.length) {
      return byPriority;
    }
    const byId = new Map(byPriority.map((rule) => [rule.id, rule]));
    return priorityOrder.flatMap((id) => {
      const rule = byId.get(id);
      return rule ? [rule] : [];
    });
  }, [rules, priorityDirty, priorityOrder]);

  const queueItems = useMemo(() => {
    const normalizedSearch = queueSearch.trim().toLocaleLowerCase();
    return (snapshot?.queue ?? []).filter((lead) => {
      const textMatches =
        normalizedSearch.length === 0 ||
        [lead.fullName, lead.company, lead.email, lead.phone].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch)
        );
      return (
        textMatches &&
        matchesLeadRoutingQueueFilter(lead, queueFilter, configuration.now)
      );
    });
  }, [snapshot, queueSearch, queueFilter, configuration.now]);

  const activeRuleCount = rules.filter((rule) => rule.isActive).length;
  const waitingCount = (snapshot?.queue ?? []).filter(
    (lead) => lead.status === 'awaiting-manual-assignment' || lead.status === 'failed'
  ).length;
  const assignedCount = (snapshot?.queue ?? []).filter((lead) => lead.status === 'assigned').length;
  const overdueCount = (snapshot?.queue ?? []).filter(
    (lead) => getLeadRoutingSlaState(lead, configuration.now) === 'overdue'
  ).length;

  const closeForm = (): void => {
    setIsCreatingRule(false);
    setEditingRuleId(null);
  };

  const handleSaveRule = async (draft: ILeadRoutingRuleDraft): Promise<boolean> => {
    const saved = await configuration.saveRule(draft);
    if (saved) {
      closeForm();
      setPriorityDirty(false);
      setPriorityOrder([]);
    }
    return saved;
  };

  const movePriority = (ruleId: string, offset: -1 | 1): void => {
    const ids = orderedRules.map((rule) => rule.id);
    const index = ids.indexOf(ruleId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) return;
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    setPriorityOrder(ids);
    setPriorityDirty(true);
    configuration.clearMessages();
  };

  const savePriority = async (): Promise<void> => {
    const saved = await configuration.savePriorityOrder(orderedRules.map((rule) => rule.id));
    if (saved) {
      setPriorityDirty(false);
      setPriorityOrder([]);
    }
  };

  const renderContent = (): React.ReactNode => {
    if (configuration.isLoading && !snapshot) {
      return (
        <section className={styles.statePanel} aria-live="polite">
          <LoaderCircle size={22} className={styles.spin} />
          <p>Đang tải cấu hình điều phối…</p>
        </section>
      );
    }
    if (configuration.error && !snapshot) {
      return (
        <section className={styles.statePanel} role="alert">
          <h2>Không thể tải dữ liệu</h2>
          <p>{configuration.error}</p>
          <Button variant="secondary" onClick={() => void configuration.loadData()}>Thử lại</Button>
        </section>
      );
    }
    if (!snapshot) return null;

    return (
      <>
        <section className={styles.summaryGrid} aria-label="Tổng quan điều phối">
          <article className={styles.summaryCard}>
            <span className={styles.summaryCard__icon}><GitBranch size={18} /></span>
            <span className={styles.summaryCard__label}>Quy tắc đang bật</span>
            <strong>{activeRuleCount}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={`${styles.summaryCard__icon} ${styles['summaryCard__icon--warning']}`}><ContactRound size={18} /></span>
            <span className={styles.summaryCard__label}>Cần xử lý thủ công</span>
            <strong>{waitingCount}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={`${styles.summaryCard__icon} ${styles['summaryCard__icon--success']}`}><Check size={18} /></span>
            <span className={styles.summaryCard__label}>Đã phân công</span>
            <strong>{assignedCount}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={`${styles.summaryCard__icon} ${styles['summaryCard__icon--danger']}`}><Clock3 size={18} /></span>
            <span className={styles.summaryCard__label}>Quá 5 phút</span>
            <strong>{overdueCount}</strong>
          </article>
        </section>

        <section className={styles.panel} aria-labelledby="routing-rules-heading">
          <div className={styles.panel__header}>
            <div>
              <h2 id="routing-rules-heading">Quy tắc điều phối</h2>
              <p>Ưu tiên cao nhất được xét trước; quy tắc đang bật và hợp lệ đầu tiên khớp sẽ thắng.</p>
            </div>
            {canManageLeads && !isCreatingRule && !editingRuleId && (
              <Button leftIcon={<Plus size={16} />} onClick={() => {
                configuration.clearMessages();
                setIsCreatingRule(true);
              }}>
                Tạo quy tắc
              </Button>
            )}
          </div>

          {configuration.actionError && <p className={styles.inlineError} role="alert">{configuration.actionError}</p>}
          {configuration.successMessage && <p className={styles.successMessage} role="status">{configuration.successMessage}</p>}

          {(isCreatingRule || editingRuleId) && (
            <RuleForm
              key={editingRuleId ?? 'create-rule'}
              initialRule={rules.find((rule) => rule.id === editingRuleId) ?? null}
              regions={snapshot.regions}
              industries={snapshot.industries}
              teams={snapshot.teams}
              employees={snapshot.employees}
              isSaving={configuration.isSaving}
              onCancel={closeForm}
              onSave={handleSaveRule}
            />
          )}

          {orderedRules.length === 0 ? (
            <div className={styles.emptyState}>
              <GitBranch size={24} />
              <strong>Chưa có quy tắc điều phối</strong>
              <span>Tạo quy tắc để cấu hình chiến lược phân công.</span>
            </div>
          ) : (
            <ol className={styles.ruleList}>
              {orderedRules.map((rule, index) => (
                <li className={`${styles.ruleCard} ${rule.isActive ? '' : styles['ruleCard--inactive']}`} key={rule.id}>
                  <div className={styles.ruleCard__priority} aria-label={`Ưu tiên ${index + 1}`}>{index + 1}</div>
                  <div className={styles.ruleCard__main}>
                    <div className={styles.ruleCard__titleRow}>
                      <h3>{rule.name}</h3>
                      <span className={`${styles.statusBadge} ${rule.isActive ? styles['statusBadge--success'] : styles['statusBadge--muted']}`}>
                        {rule.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </div>
                    <div className={styles.ruleCard__details}>
                      <span><b>Chiến lược:</b> {strategyLabel(rule.strategy)}</span>
                      {rule.conditionValue && <span><b>Điều kiện:</b> {rule.conditionValue}</span>}
                      <span><b>Nhóm nhận:</b> {rule.teamName}</span>
                      {rule.strategy === 'round-robin' && (
                        <span><b>Thành viên:</b> {rule.assigneeIds.length} sales</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.ruleCard__controls}>
                    {canManageLeads && (
                      <>
                        <div className={styles.priorityControls} aria-label={`Thay đổi ưu tiên ${rule.name}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Tăng ưu tiên ${rule.name}`}
                            disabled={index === 0 || configuration.isSaving}
                            onClick={() => movePriority(rule.id, -1)}
                          ><ArrowUp size={16} /></Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Giảm ưu tiên ${rule.name}`}
                            disabled={index === orderedRules.length - 1 || configuration.isSaving}
                            onClick={() => movePriority(rule.id, 1)}
                          ><ArrowDown size={16} /></Button>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => {
                          configuration.clearMessages();
                          setEditingRuleId(rule.id);
                          setIsCreatingRule(false);
                        }}>Sửa</Button>
                        <Button
                          variant={rule.isActive ? 'ghost' : 'secondary'}
                          size="sm"
                          disabled={configuration.isSaving}
                          onClick={() => void configuration.setRuleActive(rule.id, !rule.isActive)}
                        >{rule.isActive ? 'Tắt' : 'Bật'}</Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {canManageLeads && priorityDirty && (
            <div className={styles.prioritySave}>
              <p>Thứ tự đã thay đổi. Lưu để xác nhận thứ tự ưu tiên mới.</p>
              <Button isLoading={configuration.isSaving} leftIcon={<Save size={16} />} onClick={() => void savePriority()}>
                Lưu thứ tự
              </Button>
            </div>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="manual-queue-heading">
          <div className={styles.panel__header}>
            <div>
              <h2 id="manual-queue-heading">Hàng đợi phân công Lead</h2>
              <p>Lead không khớp quy tắc và trường hợp phân công lỗi được phân biệt riêng.</p>
            </div>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => void configuration.loadData()}
              isLoading={configuration.isLoading}
            >Tải lại</Button>
          </div>

          <div className={styles.queueFilters}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>Tìm Lead trong hàng đợi</span>
              <input
                type="search"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Tìm tên, công ty, email…"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.srOnly}>Lọc trạng thái hàng đợi</span>
              <select
                value={queueFilter}
                onChange={(event) => setQueueFilter(event.target.value as LeadRoutingQueueFilterType)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="awaiting-manual-assignment">Chờ phân công thủ công</option>
                <option value="failed">Phân công thất bại</option>
                <option value="approaching-target">Sắp chạm mốc 5 phút</option>
                <option value="overdue">Quá mốc 5 phút</option>
              </select>
            </label>
          </div>

          {queueItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={24} />
              <strong>{snapshot.queue.length === 0 ? 'Hàng đợi đang trống' : 'Không có Lead phù hợp'}</strong>
              <span>{snapshot.queue.length === 0 ? 'Chưa có Lead cần xử lý.' : 'Thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}</span>
            </div>
          ) : (
            <ul className={styles.queueList}>
              {queueItems.map((lead) => {
                const slaState = getLeadRoutingSlaState(lead, configuration.now);
                const awaitingManual =
                  lead.status === 'awaiting-manual-assignment' || lead.status === 'failed';
                return (
                  <li
                    key={lead.id}
                    className={`${styles.queueCard} ${slaState === 'overdue' ? styles['queueCard--overdue'] : ''} ${slaState === 'approaching' ? styles['queueCard--approaching'] : ''}`}
                  >
                    <div className={styles.queueCard__identity}>
                      <strong>{lead.fullName}</strong>
                      <span>{lead.company}</span>
                      <span>{lead.email} · {lead.phone}</span>
                    </div>
                    <div className={styles.queueCard__customer}>
                      <span><b>Ngành:</b> {lead.industry}</span>
                      <span><b>Khu vực:</b> {lead.region}</span>
                    </div>
                    <div className={styles.queueCard__status}>
                      <span className={`${styles.statusBadge} ${styles[`statusBadge--${lead.status}`]}`}>
                        {statusLabel(lead.status)}
                      </span>
                      {lead.pendingReasonType && (
                        <span className={styles.reasonType}>
                          {lead.pendingReasonType === 'unmatched' ? 'Không khớp quy tắc' : 'Lỗi phân công'}
                        </span>
                      )}
                      {lead.pendingReason && <span>{lead.pendingReason}</span>}
                      {lead.assignmentResult && <span>{lead.assignmentResult}</span>}
                      {lead.assignedTo && <span>Người nhận: {lead.assignedTo}</span>}
                    </div>
                    <div className={styles.queueCard__timing}>
                      <span><b>Tiếp nhận:</b> {formatReceivedAt(lead.receivedAt)}</span>
                      <span><b>Đang chờ:</b> {formatWaitingDuration(lead, configuration.now)}</span>
                      {slaState === 'approaching' && <strong className={styles.slaWarning}>Sắp chạm mốc 5 phút</strong>}
                      {slaState === 'overdue' && <strong className={styles.slaOverdue}>Đã vượt mốc 5 phút</strong>}
                      {slaState === 'unknown' && <span className={styles.muted}>Không thể tính thời gian chờ</span>}
                    </div>
                    {canManageLeads && awaitingManual && (
                      <div className={styles.assignControl}>
                        <label>
                          <span className={styles.srOnly}>Chọn nhân viên nhận {lead.fullName}</span>
                          <select
                            value={selectedAssignees[lead.id] ?? ''}
                            onChange={(event) => setSelectedAssignees((current) => ({
                              ...current,
                              [lead.id]: event.target.value,
                            }))}
                          >
                            <option value="">Chọn nhân viên</option>
                            {snapshot.employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} · {employee.teamName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button
                          size="sm"
                          disabled={!selectedAssignees[lead.id] || configuration.isSaving}
                          isLoading={configuration.isSaving}
                          onClick={() => {
                            const employeeId = selectedAssignees[lead.id];
                            if (employeeId) {
                              void configuration.assignLead(lead.id, employeeId);
                            }
                          }}
                        >Phân công</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.slaNote}>
            Mốc 5 phút là mục tiêu hiển thị để ưu tiên xử lý, không phải cam kết SLA. Thời gian được tính từ thời điểm tiếp nhận hợp lệ.
          </p>
        </section>
      </>
    );
  };

  function formatReceivedAt(value: string): string {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp)
      ? 'Chưa có dữ liệu'
      : new Date(timestamp).toLocaleString('vi-VN');
  }

  return (
    <PermissionGuard roles={['sales manager', 'team leader', 'revops lead', 'admin', 'super admin', 'director', 'sales director', 'vp of sales']}>
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>QUẢN TRỊ LEAD</p>
            <h1>Cấu hình điều phối Lead</h1>
            <p>Thiết lập quy tắc ưu tiên và theo dõi các Lead cần phân công.</p>
          </div>
          <div className={styles.pageHeader__actions}>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => void configuration.loadData()}
              isLoading={configuration.isLoading}
            >Tải lại</Button>
          </div>
        </header>

        {configuration.developmentNotice && (
          <aside className={styles.developmentNotice} role="note" aria-label="Thông báo dữ liệu thử nghiệm">
            <strong>Chế độ phát triển</strong>
            <span>{configuration.developmentNotice}</span>
            <span>Quy tắc, ưu tiên và thao tác phân công chỉ được mô phỏng trong bộ nhớ trình duyệt.</span>
          </aside>
        )}

        {configuration.error && snapshot && (
          <p className={styles.inlineError} role="alert">{configuration.error}</p>
        )}
        {renderContent()}
      </main>
    </PermissionGuard>
  );
};
