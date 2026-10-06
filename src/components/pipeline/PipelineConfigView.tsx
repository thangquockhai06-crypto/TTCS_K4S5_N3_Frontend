import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, CheckSquare, Edit2, Plus, X } from 'lucide-react';
import { IExitRules, IPipelineStage } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import styles from './PipelineConfigView.module.css';

type PipelineStatus = {
  type: 'success' | 'error';
  text: string;
};

type PipelineApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const EMPTY_EXIT_RULES: IExitRules = {
  require_contact: false,
  require_meeting: false,
  require_budget: false,
  require_quote: false,
  require_approval: false,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as PipelineApiError;
    if (typeof apiError.response?.data?.detail === 'string') {
      return apiError.response.data.detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const normalizeExitRules = (raw: string | undefined | null): IExitRules => {
  if (!raw) {
    return { ...EMPTY_EXIT_RULES };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, boolean | undefined>;
    return {
      ...EMPTY_EXIT_RULES,
      ...parsed,
    };
  } catch {
    return { ...EMPTY_EXIT_RULES };
  }
};

export const PipelineConfigView: React.FC = () => {
  const [stages, setStages] = useState<IPipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<PipelineStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<IPipelineStage | null>(null);
  const [name, setName] = useState('');
  const [stageKey, setStageKey] = useState('');
  const [probability, setProbability] = useState(50);
  const [color, setColor] = useState('#3b82f6');
  const [exitRules, setExitRules] = useState<IExitRules>({ ...EMPTY_EXIT_RULES });

  const fetchStages = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const data = await sprint2Service.getPipelineStages();
      setStages(data);
    } catch (error: unknown) {
      setStatusMsg({
        type: 'error',
        text: getErrorMessage(error, 'Không thể tải danh sách giai đoạn phễu.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStages();
  }, [fetchStages]);

  const handleOpenCreate = (): void => {
    setEditingStage(null);
    setName('');
    setStageKey('');
    setProbability(50);
    setColor('#3b82f6');
    setExitRules({ ...EMPTY_EXIT_RULES });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stage: IPipelineStage): void => {
    setEditingStage(stage);
    setName(stage.name);
    setStageKey(stage.stage_key);
    setProbability(stage.probability);
    setColor(stage.color || '#3b82f6');
    setExitRules(normalizeExitRules(stage.exit_rules));
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    try {
      if (editingStage) {
        await sprint2Service.updatePipelineStage(editingStage.id, {
          name,
          probability: Number(probability),
          color,
          exit_rules: JSON.stringify(exitRules),
        });
        setStatusMsg({
          type: 'success',
          text: 'Cập nhật giai đoạn phễu thành công.',
        });
      } else {
        await sprint2Service.createPipelineStage({
          name,
          stage_key: stageKey.trim() || name.replace(/\s+/g, ''),
          probability: Number(probability),
          color,
          exit_rules: JSON.stringify(exitRules),
          order_index: stages.length,
        });
        setStatusMsg({
          type: 'success',
          text: 'Thêm giai đoạn mới vào phễu thành công.',
        });
      }

      setIsModalOpen(false);
      await fetchStages();
    } catch (error: unknown) {
      setStatusMsg({
        type: 'error',
        text: getErrorMessage(error, 'Lỗi lưu giai đoạn.'),
      });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down'): Promise<void> => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) {
      return;
    }

    const newStages = [...stages];
    const nextStage = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = nextStage;

    setStages(newStages);

    try {
      await sprint2Service.reorderPipelineStages(
        newStages.map((stage, orderIndex) => ({
          id: stage.id,
          order_index: orderIndex,
        }))
      );
    } catch {
      await fetchStages();
    }
  };

  const handleDelete = (): void => {
    setStatusMsg({
      type: 'error',
      text: 'Backend hiện chưa cung cấp API xóa giai đoạn phễu. Frontend giữ nguyên quy tắc an toàn: không tự xóa stage đang dùng bởi Opportunity đang chạy.',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Cấu hình Phễu Bán hàng (Pipeline Stages - S2-09)</h2>
          <p className={styles.subtitle}>
            Thiết lập các chặng phễu, xác suất thành công (0-100%) và điều kiện rời chuyển giai đoạn. Frontend
            chỉ cập nhật theo contract backend; không tự động xóa stage khi chưa có API xóa hỗ trợ.
          </p>
        </div>

        <button type="button" onClick={handleOpenCreate} className={styles.primaryAction}>
          <Plus size={14} /> Thêm giai đoạn
        </button>
      </div>

      {statusMsg && (
        <div
          className={`${styles.notice} ${
            statusMsg.type === 'success' ? styles.noticeSuccess : styles.noticeError
          }`}
        >
          {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className={styles.previewStrip}>
        {stages.map((stage, index) => (
          <div
            key={`strip-${stage.id}`}
            className={styles.previewStage}
            style={{ ['--stage-color' as string]: stage.color || '#2563eb' } as React.CSSProperties}
          >
            <div className={styles.previewMeta}>
              <span className={styles.previewStep}>Chặng {index + 1}</span>
              <span className={styles.previewProbability}>{stage.probability}%</span>
            </div>
            <strong className={styles.previewName}>{stage.name}</strong>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Thứ tự</th>
              <th>Tên giai đoạn</th>
              <th>Mã trạng thái</th>
              <th>Xác suất chốt</th>
              <th>Điều kiện chuyển tiếp</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Đang tải phễu...
                </td>
              </tr>
            ) : stages.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Chưa có giai đoạn phễu nào.
                </td>
              </tr>
            ) : (
              stages.map((stage, index) => {
                const rules = normalizeExitRules(stage.exit_rules);
                const activeRuleNames = [
                  rules.require_contact && 'Đã liên hệ',
                  rules.require_meeting && 'Đã họp demo',
                  rules.require_budget && 'Xác nhận ngân sách',
                  rules.require_quote && 'Gửi báo giá',
                  rules.require_approval && 'Duyệt cấp trên',
                ].filter(Boolean) as string[];

                return (
                  <tr key={stage.id}>
                    <td>
                      <div className={styles.orderCell}>
                        <button
                          type="button"
                          onClick={() => void handleMove(index, 'up')}
                          disabled={index === 0}
                          className={styles.moveButton}
                          aria-label="Di chuyển lên"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMove(index, 'down')}
                          disabled={index === stages.length - 1}
                          className={styles.moveButton}
                          aria-label="Di chuyển xuống"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <span className={styles.orderIndex}>{index + 1}</span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.nameCell}>
                        <span
                          className={styles.stageDot}
                          style={{ ['--stage-color' as string]: stage.color || '#2563eb' } as React.CSSProperties}
                        />
                        {stage.name}
                      </div>
                    </td>

                    <td>
                      <code className={styles.stageKey}>{stage.stage_key}</code>
                    </td>

                    <td>
                      <span className={styles.stageProbability}>{stage.probability}%</span>
                    </td>

                    <td>
                      {activeRuleNames.length === 0 ? (
                        <span className={styles.emptyRuleText}>Không yêu cầu điều kiện</span>
                      ) : (
                        <div className={styles.ruleList}>
                          {activeRuleNames.map((rule) => (
                            <span key={rule} className={styles.ruleBadge}>
                              <CheckSquare size={10} color="#16a34a" /> {rule}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className={styles.actionCell}>
                      <div className={styles.actionRow}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(stage)}
                          className={`${styles.iconButton} ${styles.edit}`}
                          aria-label="Chỉnh sửa giai đoạn"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className={styles.iconButton}
                          aria-label="Xóa giai đoạn"
                          title="Backend chưa hỗ trợ xóa giai đoạn"
                          style={{ color: 'var(--color-text-muted, #64748b)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingStage ? 'Chỉnh sửa Giai đoạn' : 'Thêm mới Giai đoạn phễu (S2-09)'}
              </h3>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Tên giai đoạn hiển thị *</label>
                <input
                  type="text"
                  required
                  placeholder="Khảo sát nhu cầu & Demo"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={styles.input}
                />
              </div>

              {!editingStage && (
                <div className={styles.field}>
                  <label className={styles.label}>Mã khóa giai đoạn (Stage Key) *</label>
                  <input
                    type="text"
                    required
                    placeholder="DemoSurvey"
                    value={stageKey}
                    onChange={(event) => setStageKey(event.target.value)}
                    className={styles.input}
                  />
                </div>
              )}

              <div className={styles.twoColumnGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Xác suất thành công (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={probability}
                    onChange={(event) => setProbability(Number(event.target.value))}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Màu sắc nhận diện</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Điều kiện chuyển bước (Exit-rule checkboxes):</label>
                <div className={styles.checkboxPanel}>
                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_contact)}
                      onChange={(event) =>
                        setExitRules((previous) => ({
                          ...previous,
                          require_contact: event.target.checked,
                        }))
                      }
                    />
                    Yêu cầu đã liên hệ khách hàng thành công
                  </label>

                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_meeting)}
                      onChange={(event) =>
                        setExitRules((previous) => ({
                          ...previous,
                          require_meeting: event.target.checked,
                        }))
                      }
                    />
                    Yêu cầu có lịch họp trao đổi / demo sản phẩm
                  </label>

                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_budget)}
                      onChange={(event) =>
                        setExitRules((previous) => ({
                          ...previous,
                          require_budget: event.target.checked,
                        }))
                      }
                    />
                    Yêu cầu khách hàng xác nhận ngân sách dự kiến
                  </label>

                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_quote)}
                      onChange={(event) =>
                        setExitRules((previous) => ({
                          ...previous,
                          require_quote: event.target.checked,
                        }))
                      }
                    />
                    Yêu cầu đã lập và gửi báo giá chính thức
                  </label>

                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_approval)}
                      onChange={(event) =>
                        setExitRules((previous) => ({
                          ...previous,
                          require_approval: event.target.checked,
                        }))
                      }
                    />
                    Yêu cầu phê duyệt từ cấp Trưởng phòng / Giám đốc
                  </label>
                </div>
              </div>

              <div className={styles.footerActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.modalActionButton}
                >
                  Hủy
                </button>
                <button type="submit" className={`${styles.modalActionButton} ${styles.primary}`}>
                  Lưu giai đoạn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
