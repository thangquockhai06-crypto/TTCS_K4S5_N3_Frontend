import React, { useMemo, useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { DealPipeline } from '../components/customer/DealPipeline';
import { Badge, Button, Card, Input, Modal, SearchBar } from '../components/common';
import { useCRMData } from '../context/CRMDataContext';
import { DealStageType } from '../interfaces';
import { formatCompactCurrency, formatCurrency } from '../utils/formatters';
import styles from './DealPipelinePage.module.css';

export const DealPipelinePage: React.FC = () => {
  const { deals, moveDealStage, addDeal } = useCRMData();

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
    });

    setNewDealForm({
      title: '',
      company: '',
      customerName: '',
      value: 165000,
      stage: 'New',
    });
    setIsNewDealModalOpen(false);
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
          <h1 className={styles.header__title}>Phễu cơ hội bán hàng (Deal Pipeline)</h1>
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
      <DealPipeline deals={filteredDeals} onMoveDeal={moveDealStage} />

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
            <label htmlFor="deal-stage-select">Giai đoạn khởi tạo</label>
            <select
              id="deal-stage-select"
              value={newDealForm.stage}
              onChange={(e) =>
                setNewDealForm((prev) => ({
                  ...prev,
                  stage: e.target.value as DealStageType,
                }))
              }
            >
              <option value="New">Cơ hội mới (New)</option>
              <option value="Contacted">Đã liên hệ (Contacted)</option>
              <option value="Negotiation">Đang đàm phán (Negotiation)</option>
              <option value="Won">Chốt thành công (Won)</option>
            </select>
          </div>
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
    </div>
  );
};
