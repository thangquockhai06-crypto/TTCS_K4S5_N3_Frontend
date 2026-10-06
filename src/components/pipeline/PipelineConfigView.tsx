import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  CheckSquare,
  X,
} from 'lucide-react';
import { IPipelineStage, IExitRules } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

export const PipelineConfigView: React.FC = () => {
  const [stages, setStages] = useState<IPipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<IPipelineStage | null>(null);
  const [name, setName] = useState('');
  const [stageKey, setStageKey] = useState('');
  const [probability, setProbability] = useState(50);
  const [color, setColor] = useState('#3b82f6');
  const [exitRules, setExitRules] = useState<IExitRules>({
    require_contact: false,
    require_meeting: false,
    require_budget: false,
    require_quote: false,
    require_approval: false,
  });

  const fetchStages = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const data = await sprint2Service.getPipelineStages();
      setStages(data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh sách giai đoạn phễu.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const parseExitRules = (raw: string): IExitRules => {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  const handleOpenCreate = () => {
    setEditingStage(null);
    setName('');
    setStageKey('');
    setProbability(50);
    setColor('#3b82f6');
    setExitRules({
      require_contact: false,
      require_meeting: false,
      require_budget: false,
      require_quote: false,
      require_approval: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: IPipelineStage) => {
    setEditingStage(s);
    setName(s.name);
    setStageKey(s.stage_key);
    setProbability(s.probability);
    setColor(s.color || '#3b82f6');
    setExitRules(parseExitRules(s.exit_rules));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStage) {
        await sprint2Service.updatePipelineStage(editingStage.id, {
          name,
          probability: Number(probability),
          color,
          exit_rules: JSON.stringify(exitRules),
        });
        setStatusMsg({ type: 'success', text: 'Cập nhật giai đoạn phễu thành công!' });
      } else {
        await sprint2Service.createPipelineStage({
          name,
          stage_key: stageKey.trim() || name.replace(/\s+/g, ''),
          probability: Number(probability),
          color,
          exit_rules: JSON.stringify(exitRules),
          order_index: stages.length,
        });
        setStatusMsg({ type: 'success', text: 'Thêm giai đoạn mới vào phễu thành công!' });
      }
      setIsModalOpen(false);
      fetchStages();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi lưu giai đoạn.' });
    }
  };

  const handleDelete = async (s: IPipelineStage) => {
    if (!window.confirm(`Xóa giai đoạn "${s.name}"? Hệ thống sẽ đảm bảo không làm mất cơ hội nào đang hoạt động.`)) {
      return;
    }
    try {
      await sprint2Service.deletePipelineStage(s.id);
      setStatusMsg({ type: 'success', text: 'Đã xóa giai đoạn thành công.' });
      fetchStages();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi khi xóa giai đoạn.' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;

    const newStages = [...stages];
    const temp = newStages[index];
    newStages[index] = newStages[targetIdx];
    newStages[targetIdx] = temp;

    setStages(newStages);
    try {
      await sprint2Service.reorderPipelineStages(newStages.map((s) => s.id));
    } catch {
      fetchStages();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Cấu hình Phễu Bán hàng (Pipeline Stages - S2-09)
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
            Thiết lập các chặng phễu, xác suất thành công (0-100%) và quy tắc điều kiện chuyển bước (Exit-rule). Cơ hội đang hoạt động luôn được bảo toàn an toàn.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Thêm giai đoạn
        </button>
      </div>

      {statusMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '6px',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.82rem',
          }}
        >
          {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Pipeline Preview Strip */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        {stages.map((st, idx) => (
          <div
            key={`strip-${st.id}`}
            style={{
              flex: 1,
              minWidth: '130px',
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '6px',
              border: `1px solid #cbd5e1`,
              borderTop: `3px solid ${st.color || '#2563eb'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Chặng {idx + 1}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>{st.probability}%</span>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{st.name}</strong>
          </div>
        ))}
      </div>

      {/* Table Stages */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '10px 14px', width: '70px', color: '#64748b' }}>Thứ tự</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Tên giai đoạn phễu</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Mã trạng thái</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Xác suất chốt</th>
              <th style={{ padding: '10px 14px', color: '#64748b' }}>Điều kiện chuyển tiếp (Exit Rules)</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải phễu...
                </td>
              </tr>
            ) : stages.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Chưa có giai đoạn phễu nào.
                </td>
              </tr>
            ) : (
              stages.map((s, idx) => {
                const rules = parseExitRules(s.exit_rules);
                const activeRuleNames = [
                  rules.require_contact && 'Đã liên hệ',
                  rules.require_meeting && 'Đã họp demo',
                  rules.require_budget && 'Xác nhận ngân sách',
                  rules.require_quote && 'Gửi báo giá',
                  rules.require_approval && 'Duyệt cấp trên',
                ].filter(Boolean);

                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === 0 ? '#cbd5e1' : '#64748b',
                            cursor: idx === 0 ? 'default' : 'pointer',
                            padding: '2px',
                          }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === stages.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === stages.length - 1 ? '#cbd5e1' : '#64748b',
                            cursor: idx === stages.length - 1 ? 'default' : 'pointer',
                            padding: '2px',
                          }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>{idx + 1}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color || '#2563eb' }} />
                        {s.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                      <code>{s.stage_key}</code>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {s.probability}%
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {activeRuleNames.length === 0 ? (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Không yêu cầu điều kiện</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {activeRuleNames.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                fontSize: '0.72rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <CheckSquare size={10} color="#16a34a" /> {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
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

      {/* Modal Add / Edit Stage */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '480px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingStage ? 'Chỉnh sửa Giai đoạn' : 'Thêm mới Giai đoạn phễu (S2-09)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Tên giai đoạn hiển thị *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Khảo sát nhu cầu & Demo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              {!editingStage && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Mã khóa giai đoạn (Stage Key) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DemoSurvey"
                    value={stageKey}
                    onChange={(e) => setStageKey(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Xác suất thành công (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Màu sắc nhận diện
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: '100%', height: '33px', padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Exit rules checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Điều kiện chuyển bước (Exit-rule checkboxes):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_contact)}
                      onChange={(e) => setExitRules({ ...exitRules, require_contact: e.target.checked })}
                    />
                    Yêu cầu đã liên hệ khách hàng thành công
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_meeting)}
                      onChange={(e) => setExitRules({ ...exitRules, require_meeting: e.target.checked })}
                    />
                    Yêu cầu có lịch họp trao đổi / demo sản phẩm
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_budget)}
                      onChange={(e) => setExitRules({ ...exitRules, require_budget: e.target.checked })}
                    />
                    Yêu cầu khách hàng xác nhận ngân sách dự kiến
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_quote)}
                      onChange={(e) => setExitRules({ ...exitRules, require_quote: e.target.checked })}
                    />
                    Yêu cầu đã lập và gửi báo giá chính thức
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(exitRules.require_approval)}
                      onChange={(e) => setExitRules({ ...exitRules, require_approval: e.target.checked })}
                    />
                    Yêu cầu phê duyệt từ cấp Trưởng phòng / Giám đốc
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
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
