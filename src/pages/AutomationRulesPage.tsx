import React, { useCallback, useEffect, useState } from 'react';
import {
  Zap,
  Plus,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Sliders,
  Trash2,
} from 'lucide-react';
import {
  IAutomationRule,
  IAutomationLog,
  ICreateAutomationRuleDTO,
} from '../interfaces/automation.interface';
import { automationService } from '../services/automationService';
import { Button, Modal, Badge, LoadingSkeleton } from '../components/common';
import { showGlobalToast } from '../context/ToastContext';
import styles from './AutomationRulesPage.module.css';

type AutomationTab = 'rules' | 'logs';

export const AutomationRulesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AutomationTab>('rules');
  const [rules, setRules] = useState<IAutomationRule[]>([]);
  const [logs, setLogs] = useState<IAutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleDescription, setRuleDescription] = useState<string>('');
  const [triggerEntity, setTriggerEntity] = useState<string>('deal');
  const [triggerEvent, setTriggerEvent] = useState<string>('status_changed');
  const [conditionField, setConditionField] = useState<string>('stage');
  const [conditionOperator, setConditionOperator] = useState<string>('equals');
  const [conditionValue, setConditionValue] = useState<string>('negotiation');
  const [actionType, setActionType] = useState<string>('create_task');
  const [actionTitle, setActionTitle] = useState<string>('');
  const [actionDescription, setActionDescription] = useState<string>('');
  const [actionPriority, setActionPriority] = useState<string>('high');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesData, logsData] = await Promise.all([
        automationService.getRules(),
        automationService.getLogs(),
      ]);
      setRules(rulesData);
      setLogs(logsData);
    } catch (err: unknown) {
      console.error('Lỗi nạp quy tắc tự động hóa:', err);
      showGlobalToast('Không thể tải danh sách quy tắc tự động hóa.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleActive = async (rule: IAutomationRule) => {
    try {
      const updated = await automationService.toggleRule(rule.id);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? updated : r))
      );
      showGlobalToast(
        `Quy tắc "${rule.name}" đã được ${updated.isActive ? 'kích hoạt' : 'tạm dừng'}.`,
        'success'
      );
    } catch (err: unknown) {
      console.error(err);
      showGlobalToast('Không thể cập nhật trạng thái quy tắc.', 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa quy tắc tự động hóa "${ruleName}"?`)) return;
    try {
      await automationService.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      showGlobalToast('Đã xóa quy tắc tự động hóa.', 'success');
    } catch (err: unknown) {
      console.error(err);
      showGlobalToast('Không thể xóa quy tắc.', 'error');
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim()) {
      showGlobalToast('Vui lòng nhập tên quy tắc tự động hóa.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ICreateAutomationRuleDTO = {
        name: ruleName.trim(),
        description: ruleDescription.trim(),
        isActive: true,
        triggerEntity,
        triggerEvent,
        conditions: {
          field: conditionField,
          operator: conditionOperator,
          value: conditionValue,
        },
        actionType,
        actionConfig: {
          title: actionTitle.trim() || `Tự động: ${ruleName}`,
          description: actionDescription.trim() || `Hành động tự động sinh bởi quy tắc ${ruleName}`,
          priority: actionPriority,
        },
      };

      const created = await automationService.createRule(payload);
      setRules((prev) => [created, ...prev]);
      showGlobalToast(`Đã tạo thành công quy tắc "${created.name}"!`, 'success');
      setIsCreateModalOpen(false);
      // Reset form
      setRuleName('');
      setRuleDescription('');
      setActionTitle('');
      setActionDescription('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi tạo quy tắc.';
      showGlobalToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTriggerLabel = (event: string, entity: string) => {
    const entityMap: Record<string, string> = {
      deal: 'Cơ hội bán hàng',
      quotation: 'Báo giá',
      contract: 'Hợp đồng',
      lead: 'Lead tiềm năng',
    };
    const eventMap: Record<string, string> = {
      status_changed: 'Thay đổi trạng thái',
      created: 'Khởi tạo mới',
      time_condition: 'Điều kiện thời gian (Quá hạn / Hết hạn)',
      deal_won: 'Cơ hội Thắng (Won)',
      quote_accepted: 'Khách hàng duyệt báo giá',
    };
    return `${entityMap[entity] || entity} · ${eventMap[event] || event}`;
  };

  const renderActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'create_task':
        return 'Tạo công việc / nhiệm vụ mới';
      case 'send_notification':
        return 'Gửi thông báo In-App cho người phụ trách';
      case 'change_owner':
        return 'Tự động chuyển người phụ trách (Reassign Owner)';
      default:
        return actionType;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBadge}>
            <Zap size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Tự Động Hóa Quy Trình IF–THEN</h1>
            <p className={styles.pageSubtitle}>
              Thiết lập các kịch bản tự động hóa theo sự kiện trạng thái hoặc thời gian, tự động giao việc và thông báo
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw size={14} />}
            onClick={() => void loadData()}
          >
            Làm mới
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm Quy Tắc Mới
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'rules' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Sliders size={16} /> Danh sách Quy tắc ({rules.length})
        </button>
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'logs' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Clock size={16} /> Nhật ký thực thi ({logs.length})
        </button>
      </div>

      {/* Tab 1: Rules List */}
      {activeTab === 'rules' && (
        <div className={styles.cardContainer}>
          {isLoading ? (
            <div style={{ padding: 24 }}>
              <LoadingSkeleton height={60} />
              <div style={{ marginTop: 12 }}>
                <LoadingSkeleton height={120} />
              </div>
            </div>
          ) : rules.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
              <Zap size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Chưa có quy tắc tự động hóa nào được tạo.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                Bấm nút "Thêm Quy Tắc Mới" để thiết lập kịch bản tự động cho Deal, Báo giá hoặc Hợp đồng.
              </p>
            </div>
          ) : (
            <div className={styles.ruleList}>
              {rules.map((rule) => (
                <div key={rule.id} className={styles.ruleCard}>
                  <div className={styles.ruleInfo}>
                    <div className={styles.ruleTitleRow}>
                      <h3 className={styles.ruleName}>{rule.name}</h3>
                      <Badge tone={rule.isActive ? 'success' : 'neutral'} size="sm">
                        {rule.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>

                    {rule.description && <p className={styles.ruleDesc}>{rule.description}</p>}

                    <div className={styles.ifThenBlock}>
                      <span className={styles.ifBadge}>
                        IF: {renderTriggerLabel(rule.triggerEvent, rule.triggerEntity)}
                      </span>
                      <span style={{ color: '#64748B', fontWeight: 700 }}>&rarr;</span>
                      <span className={styles.thenBadge}>
                        THEN: {renderActionLabel(rule.actionType)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <label className={styles.toggleSwitch} title={rule.isActive ? 'Bấm để tắt' : 'Bấm để bật'}>
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => void handleToggleActive(rule)}
                      />
                      <span className={styles.slider} />
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeleteRule(rule.id, rule.name)}
                      title="Xóa quy tắc này"
                    >
                      <Trash2 size={16} color="#94A3B8" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Execution Logs */}
      {activeTab === 'logs' && (
        <div className={styles.cardContainer}>
          <div className={styles.tableWrap}>
            {isLoading ? (
              <div style={{ padding: 24 }}>
                <LoadingSkeleton height={140} />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
                <Clock size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Chưa có nhật ký thực thi tự động nào.</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                  Nhật ký sẽ xuất hiện tự động khi các sự kiện Deal hoặc Báo giá kích hoạt điều kiện IF–THEN.
                </p>
              </div>
            ) : (
              <table className={styles.logsTable}>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Tên Quy tắc</th>
                    <th>Sự kiện kích hoạt</th>
                    <th>Thực thể &amp; Mã</th>
                    <th>Hành động thực thi</th>
                    <th>Trạng thái</th>
                    <th>Chi tiết thực thi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                        {log.executedAt ? log.executedAt.slice(0, 19).replace('T', ' ') : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{log.ruleName}</td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                          {log.triggerEvent}
                        </span>
                      </td>
                      <td>
                        <Badge tone="neutral" size="sm">
                          {log.entityType}: {log.entityId}
                        </Badge>
                      </td>
                      <td>{renderActionLabel(log.actionType)}</td>
                      <td>
                        {log.status === 'success' ? (
                          <span className={styles.statusSuccess}>
                            <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                            Thành công
                          </span>
                        ) : log.status === 'failed' ? (
                          <span className={styles.statusFailed}>
                            <XCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                            Lỗi
                          </span>
                        ) : (
                          <span className={styles.statusSkipped}>Bỏ qua</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#475569', maxWidth: 280 }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal Thêm Quy Tắc Tự Động Hóa Mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Quy Tắc Tự Động Hóa IF–THEN Mới"
        subtitle="Cấu hình sự kiện kích hoạt và hành động tự động tương ứng"
        maxWidth="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Tên quy tắc: <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.9375rem',
                boxSizing: 'border-box',
              }}
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Ví dụ: Tự động nhắc việc khi Báo giá được gửi cho Khách hàng"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Mô tả mục đích quy tắc:
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                minHeight: 60,
                boxSizing: 'border-box',
              }}
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              placeholder="Giải thích ngữ cảnh hoạt động của quy tắc này..."
            />
          </div>

          {/* IF Section */}
          <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#1E3A8A' }}>
              1. ĐIỀU KIỆN KÍCH HOẠT (IF):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Đối tượng theo dõi:
                </label>
                <select
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                  value={triggerEntity}
                  onChange={(e) => setTriggerEntity(e.target.value)}
                >
                  <option value="deal">Cơ hội bán hàng (Deal)</option>
                  <option value="quotation">Báo giá (Quotation)</option>
                  <option value="contract">Hợp đồng (Contract)</option>
                  <option value="lead">Lead tiềm năng</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Sự kiện kích hoạt:
                </label>
                <select
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                >
                  <option value="status_changed">Khi trạng thái thay đổi</option>
                  <option value="time_condition">Khi quá hạn / sắp hết hạn</option>
                  <option value="created">Khi bản ghi được khởi tạo</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                  Trường kiểm tra:
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value)}
                  placeholder="stage / status..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                  Phép so sánh:
                </label>
                <select
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value)}
                >
                  <option value="equals">Bằng (=)</option>
                  <option value="contains">Chứa (contains)</option>
                  <option value="greater_than">Lớn hơn (&gt;)</option>
                  <option value="less_than">Nhỏ hơn (&lt;)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                  Giá trị điều kiện:
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="negotiation / sent..."
                />
              </div>
            </div>
          </div>

          {/* THEN Section */}
          <div style={{ background: '#F0FDF4', padding: 16, borderRadius: 8, border: '1px solid #BBF7D0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#166534' }}>
              2. HÀNH ĐỘNG THỰC THI (THEN):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                    Hành động thực hiện:
                  </label>
                  <select
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                  >
                    <option value="create_task">Tạo công việc / nhiệm vụ mới cho người phụ trách</option>
                    <option value="send_notification">Gửi thông báo In-App cho người phụ trách</option>
                    <option value="change_owner">Thay đổi người phụ trách (Reassign Owner)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                    Độ ưu tiên:
                  </label>
                  <select
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                    value={actionPriority}
                    onChange={(e) => setActionPriority(e.target.value)}
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Tiêu đề công việc / thông báo tự động:
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="Ví dụ: Gọi điện xác nhận với khách hàng sau khi gửi báo giá"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateRule}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Quy Tắc Tự Động'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
