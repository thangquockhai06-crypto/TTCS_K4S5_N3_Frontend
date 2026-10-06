import React, { useMemo, useState, useEffect } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { DealPipeline } from '../components/customer/DealPipeline';
import { Badge, Button, Card, Input, Modal, SearchBar } from '../components/common';
import { CustomSelect } from '../components/common/CustomSelect';
import { useCRMData } from '../context/CRMDataContext';
import { DealStageType, ICustomField, IDeal, IWinLossReason, ICompetitor } from '../interfaces';
import { formatCompactCurrency, formatCurrency } from '../utils/formatters';
import { sprint2Service } from '../services/sprint2Service';
import { CustomFieldRenderer } from '../components/custom-fields/CustomFieldRenderer';
import { useToast } from '../context/ToastContext';
import styles from './DealPipelinePage.module.css';

export const DealPipelinePage: React.FC = () => {
  const { deals, moveDealStage, addDeal } = useCRMData();
  const { showToast } = useToast();

  const [query, setQuery] = useState<string>('');
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState<boolean>(false);
  const [newDealForm, setNewDealForm] = useState<{
    title: string;
    company: string;
    customerName: string;
    value: number;
    stage: DealStageType;
  }>({
    title: '',
    company: '',
    customerName: '',
    value: 165000,
    stage: 'New',
  });

  const [dealCustomFields, setDealCustomFields] = useState<ICustomField[]>([]);
  const [dealCustomValues, setDealCustomValues] = useState<Record<string, string | number>>({});

  // Win/Loss & Competitor integration (Sprint 5 Requirement)
  const [winReasons, setWinReasons] = useState<IWinLossReason[]>([]);
  const [competitors, setCompetitors] = useState<ICompetitor[]>([]);
  const [closingDeal, setClosingDeal] = useState<{
    deal: IDeal;
    targetStage: DealStageType;
  } | null>(null);
  const [closeDealForm, setCloseDealForm] = useState<{
    reasonId: string;
    competitorId: string;
    closeNotes: string;
  }>({
    reasonId: '',
    competitorId: '',
    closeNotes: '',
  });

  useEffect(() => {
    void (async () => {
      try {
        const [fields, rData, cData] = await Promise.all([
          sprint2Service.getCustomFields('deal'),
          sprint2Service.getWinLossReasons('WON'),
          sprint2Service.getCompetitors(),
        ]);
        setDealCustomFields(fields);
        setWinReasons(rData);
        setCompetitors(cData);

        const initVal: Record<string, string | number> = {};
        fields.forEach((f) => {
          if (f.default_value) initVal[f.field_name] = f.default_value;
        });
        setDealCustomValues(initVal);
      } catch {
        // Fallback
      }
    })();
  }, []);

  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.company.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q)
    );
  }, [deals, query]);

  const totalPipelineValue = useMemo(
    () => filteredDeals.reduce((sum, d) => sum + d.value, 0),
    [filteredDeals]
  );

  const weightedPipelineValue = useMemo(
    () =>
      filteredDeals.reduce(
        (sum, d) => sum + Math.round((d.value * d.probability) / 100),
        0
      ),
    [filteredDeals]
  );

  const handleCreateDeal = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!newDealForm.title.trim() || !newDealForm.company.trim()) return;

    addDeal({
      title: newDealForm.title.trim(),
      company: newDealForm.company.trim(),
      customerId: 'cust-001',
      customerName: newDealForm.customerName.trim() || 'Đại diện Cấp cao',
      stage: newDealForm.stage,
      value: newDealForm.value,
      probability:
        newDealForm.stage === 'Won'
          ? 100
          : newDealForm.stage === 'Negotiation'
          ? 80
          : newDealForm.stage === 'Contacted'
          ? 55
          : 35,
      priority: 'High',
      expectedCloseDate: '15/11/2026',
      ownerName: 'Quản Trị Viên Hệ Thống',
      tags: ['Doanh nghiệp', 'Mục tiêu Q4'],
      custom_fields: dealCustomValues,
    });

    const createdTitle = newDealForm.title.trim();
    setNewDealForm({
      title: '',
      company: '',
      customerName: '',
      value: 165000,
      stage: 'New',
    });
    setDealCustomValues({});
    setIsNewDealModalOpen(false);
    showToast('success', `Đã tạo cơ hội bán hàng "${createdTitle}" thành công!`);
  };

  const handleConfirmCloseDeal = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!closingDeal) return;
    if (!closeDealForm.reasonId) {
      showToast('warning', 'Vui lòng chọn lý do thắng theo quy chuẩn Sprint 5.');
      return;
    }
    if (!closeDealForm.competitorId) {
      showToast('warning', 'Vui lòng chọn đối thủ cạnh tranh đã gặp trong thương vụ.');
      return;
    }

    const selectedReason = winReasons.find((r) => r.id === closeDealForm.reasonId);
    const selectedComp = competitors.find((c) => c.id === closeDealForm.competitorId);

    moveDealStage(closingDeal.deal.id, closingDeal.targetStage);
    const dealTitle = closingDeal.deal.title;
    setClosingDeal(null);
    showToast(
      'success',
      `Đã chốt thành công thương vụ "${dealTitle}"! Ghi nhận lý do: ${selectedReason?.reason || ''}, đối thủ: ${selectedComp?.name || ''}`
    );
  };

  return (
    <div className={styles.pipelinePage}>
      <header className={styles.header}>
        <div>
          <div className={styles.header__badgeRow}>
            <Badge tone="primary" dot>
              BẢNG KANBAN TƯƠNG TÁC · KÉO THẢ TRỰC TIẾP
            </Badge>
          </div>
          <h1 className={styles.header__title}>Phễu cơ hội bán hàng</h1>
          <p className={styles.header__subtitle}>
            Kéo thả thẻ cơ hội giữa các cột hoặc dùng nút mũi tên để cập nhật dự báo doanh thu theo
            thời gian thực.
          </p>
        </div>

        <div className={styles.header__actions}>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsNewDealModalOpen(true)}
          >
            Tạo cơ hội mới
          </Button>
        </div>
      </header>

      {/* Pipeline Summary Bar */}
      <Card padding="sm" className={styles.summaryStrip}>
        <div className={styles.summaryStrip__metrics}>
          <div className={styles.summaryMetric}>
            <span>TỔNG GIÁ TRỊ PHỄU ARR</span>
            <strong className="tabular-nums">{formatCurrency(totalPipelineValue)}</strong>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryMetric}>
            <span>DỰ BÁO TRỌNG SỐ</span>
            <strong className={`${styles.summaryMetric__accent} tabular-nums`}>
              <TrendingUp size={15} /> {formatCompactCurrency(weightedPipelineValue)}
            </strong>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryMetric}>
            <span>CƠ HỘI ĐANG MỞ</span>
            <strong className="tabular-nums">{filteredDeals.length} thương vụ</strong>
          </div>
        </div>

        <div className={styles.summaryStrip__search}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Lọc thương vụ theo tên công ty hoặc cơ hội..."
            shortcutHint=""
          />
        </div>
      </Card>

      {/* Kanban Board */}
      <DealPipeline
        deals={filteredDeals}
        onMoveDeal={(dealId, newStage) => {
          const targetDeal = deals.find((d) => d.id === dealId);
          if (newStage === 'Won' && targetDeal) {
            setClosingDeal({ deal: targetDeal, targetStage: newStage });
            setCloseDealForm({
              reasonId: winReasons[0]?.id || '',
              competitorId: competitors[0]?.id || '',
              closeNotes: '',
            });
            return;
          }
          moveDealStage(dealId, newStage);
          showToast('success', 'Đã chuyển giai đoạn cơ hội bán hàng thành công!');
        }}
      />

      {/* Create New Deal Modal */}
      <Modal
        isOpen={isNewDealModalOpen}
        onClose={() => setIsNewDealModalOpen(false)}
        title="Tạo cơ hội bán hàng mới"
        subtitle="Thêm thương vụ doanh nghiệp mới vào bảng Kanban"
      >
        <form onSubmit={handleCreateDeal} className={styles.modalForm}>
          <Input
            label="Tên thương vụ / cơ hội *"
            value={newDealForm.title}
            onChange={(e) =>
              setNewDealForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="VD: Tập đoàn Viettel — Mở rộng hệ thống Cloud CRM"
            required
          />
          <Input
            label="Tên doanh nghiệp *"
            value={newDealForm.company}
            onChange={(e) =>
              setNewDealForm((prev) => ({ ...prev, company: e.target.value }))
            }
            placeholder="VD: Viettel Solutions"
            required
          />
          <Input
            label="Người đại diện quyết định"
            value={newDealForm.customerName}
            onChange={(e) =>
              setNewDealForm((prev) => ({ ...prev, customerName: e.target.value }))
            }
            placeholder="VD: Trần Minh Tuấn"
          />
          <Input
            label="Giá trị hợp đồng năm ($ USD)"
            type="number"
            value={String(newDealForm.value)}
            onChange={(e) =>
              setNewDealForm((prev) => ({
                ...prev,
                value: Number(e.target.value) || 0,
              }))
            }
          />
          <div className={styles.modalForm__selectWrap}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Giai đoạn khởi tạo
            </label>
            <CustomSelect<DealStageType>
              value={newDealForm.stage}
              onChange={(val) =>
                setNewDealForm((prev) => ({
                  ...prev,
                  stage: val,
                }))
              }
              options={[
                { value: 'New', label: 'Cơ hội mới' },
                { value: 'Contacted', label: 'Đã liên hệ' },
                { value: 'Negotiation', label: 'Đang đàm phán' },
                { value: 'Won', label: 'Chốt thành công' },
              ]}
              height="38px"
            />
          </div>

          {/* Trường tùy chỉnh của thương vụ */}
          {dealCustomFields.length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Trường thông tin tùy chỉnh thương vụ
              </label>
              <CustomFieldRenderer
                fields={dealCustomFields}
                values={dealCustomValues}
                onChange={(fieldNameKey, val) =>
                  setDealCustomValues((prev) => ({ ...prev, [fieldNameKey]: val }))
                }
                layout="stack"
              />
            </div>
          )}
          <div className={styles.modalForm__footer}>
            <Button variant="secondary" onClick={() => setIsNewDealModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary">
              Thêm vào phễu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Đóng cơ hội bán hàng */}
      <Modal
        isOpen={Boolean(closingDeal)}
        onClose={() => setClosingDeal(null)}
        title="Đóng cơ hội bán hàng"
        subtitle="Khai báo lý do thành công và đối thủ cạnh tranh thị trường để hoàn tất chốt thương vụ."
      >
        {closingDeal && (
          <form onSubmit={handleConfirmCloseDeal} className={styles.modalForm}>
            <div
              style={{
                backgroundColor: 'var(--color-bg-app, #f8fafc)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #e2e8f0)',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                {closingDeal.deal.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '6px',
                  color: 'var(--color-text-secondary, #475569)',
                  fontSize: '0.8rem',
                }}
              >
                <span>
                  Doanh nghiệp: <strong>{closingDeal.deal.company}</strong>
                </span>
                <span>
                  Giá trị: <strong>{formatCurrency(closingDeal.deal.value)}</strong>
                </span>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #334155)',
                  marginBottom: '6px',
                }}
              >
                Lý do chốt thương vụ thành công *
              </label>
              <select
                required
                value={closeDealForm.reasonId}
                onChange={(e) =>
                  setCloseDealForm((prev) => ({ ...prev, reasonId: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">-- Chọn lý do thành công đã khai báo --</option>
                {winReasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.code}] {r.reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #334155)',
                  marginBottom: '6px',
                }}
              >
                Đối thủ cạnh tranh trực tiếp *
              </label>
              <select
                required
                value={closeDealForm.competitorId}
                onChange={(e) =>
                  setCloseDealForm((prev) => ({ ...prev, competitorId: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">-- Chọn đối thủ cạnh tranh trực tiếp --</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.pricing_tier || 'Trung cấp'}) — Tỷ lệ thắng đối đầu {c.win_rate}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #334155)',
                  marginBottom: '6px',
                }}
              >
                Ghi chú bài học kinh nghiệm / Phân tích
              </label>
              <textarea
                rows={3}
                placeholder="Ghi nhận điều giúp chúng ta chiến thắng hoặc điểm khác biệt so với đối thủ..."
                value={closeDealForm.closeNotes}
                onChange={(e) =>
                  setCloseDealForm((prev) => ({ ...prev, closeNotes: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div className={styles.modalForm__footer}>
              <Button variant="secondary" onClick={() => setClosingDeal(null)}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary">
                Xác nhận chốt thương vụ
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
