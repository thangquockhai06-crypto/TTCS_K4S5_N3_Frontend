import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import { DealStageType, IDeal } from '../../interfaces';
import { DEAL_STAGE_COLUMNS } from '../../mock/deals';
import { formatCompactCurrency, formatCurrency } from '../../utils/formatters';
import { Avatar, Badge } from '../common';
import styles from './DealPipeline.module.css';

export interface IDealPipelineProps {
  deals: ReadonlyArray<IDeal>;
  onMoveDeal: (dealId: string, targetStage: DealStageType) => void;
}

const STAGE_ORDER: ReadonlyArray<DealStageType> = [
  'New',
  'Contacted',
  'Negotiation',
  'Won',
];

export const DealPipeline: React.FC<IDealPipelineProps> = ({ deals, onMoveDeal }) => {
  const navigate = useNavigate();
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<DealStageType | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLElement>, dealId: string): void => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stage: DealStageType): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropStage !== stage) {
      setActiveDropStage(stage);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStage: DealStageType): void => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      onMoveDeal(dealId, targetStage);
    }
    setDraggedDealId(null);
    setActiveDropStage(null);
  };

  const stepStage = (deal: IDeal, delta: -1 | 1): void => {
    const currentIndex = STAGE_ORDER.indexOf(deal.stage as DealStageType);
    const nextIndex = currentIndex + delta;
    const nextStage = STAGE_ORDER[nextIndex];
    if (nextStage) {
      onMoveDeal(deal.id, nextStage);
    }
  };

  return (
    <div className={styles.kanbanBoard} role="region" aria-label="Bảng kéo thả cơ hội bán hàng">
      {DEAL_STAGE_COLUMNS.map((column) => {
        const columnDeals = deals.filter((d) => d.stage === column.id);
        const columnTotal = columnDeals.reduce((acc, d) => acc + d.value, 0);
        const isDropTarget = activeDropStage === column.id;

        return (
          <div
            key={column.id}
            className={`${styles.kanbanColumn} ${
              isDropTarget ? styles['kanbanColumn--dropActive'] : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={() => setActiveDropStage(null)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Tiêu đề cột */}
            <header className={styles.columnHeader}>
              <div className={styles.columnHeader__top}>
                <div className={styles.columnHeader__titleGroup}>
                  <span
                    className={styles.columnHeader__dot}
                    style={{ backgroundColor: column.accentColor }}
                  />
                  <h3 className={styles.columnHeader__title}>{column.title}</h3>
                  <span className={styles.columnHeader__count}>{columnDeals.length}</span>
                </div>
                <strong className={`${styles.columnHeader__sum} tabular-nums`}>
                  {formatCompactCurrency(columnTotal)}
                </strong>
              </div>
              <p className={styles.columnHeader__subtitle}>{column.subtitle}</p>
            </header>

            {/* Danh sách thẻ */}
            <div className={styles.columnCards}>
              {columnDeals.map((deal) => {
                const currentIdx = STAGE_ORDER.indexOf(deal.stage as DealStageType);
                const canMoveLeft = currentIdx > 0;
                const canMoveRight = currentIdx < STAGE_ORDER.length - 1;

                return (
                  <motion.article
                    key={deal.id}
                    layout
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(
                        e as unknown as React.DragEvent<HTMLElement>,
                        deal.id
                      )
                    }
                    onDragEnd={() => {
                      setDraggedDealId(null);
                      setActiveDropStage(null);
                    }}
                    className={`${styles.dealCard} ${
                      draggedDealId === deal.id ? styles['dealCard--dragging'] : ''
                    }`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.dealCard__topRow}>
                      <button
                        type="button"
                        className={styles.dealCard__companyLink}
                        onClick={() => navigate(`/customers/${deal.customerId}`)}
                      >
                        <Avatar src={deal.companyAvatar} name={deal.company} size="xs" />
                        <span>{deal.company}</span>
                      </button>

                      <span className={styles.dealCard__grip} title="Kéo thả thẻ cơ hội">
                        <GripVertical size={15} />
                      </span>
                    </div>

                    <h4
                      className={styles.dealCard__title}
                      onClick={() => navigate(`/customers/${deal.customerId}`)}
                    >
                      {deal.title}
                    </h4>

                    <div className={styles.dealCard__valueRow}>
                      <strong className={`${styles.dealCard__amount} tabular-nums`}>
                        {formatCurrency(deal.value)}
                      </strong>
                      <Badge
                        tone={
                          deal.probability >= 80
                            ? 'success'
                            : deal.probability >= 55
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {deal.probability}% chốt
                      </Badge>
                    </div>

                    <div className={styles.dealCard__tags}>
                      {deal.tags.map((tag) => (
                        <span key={tag} className={styles.dealCard__tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <footer className={styles.dealCard__footer}>
                      <div className={styles.dealCard__meta}>
                        <Avatar src={deal.ownerAvatar} name={deal.ownerName} size="xs" />
                        <span className={styles.dealCard__date}>
                          <Calendar size={12} /> {deal.expectedCloseDate}
                        </span>
                      </div>

                      <div className={styles.dealCard__stageControls}>
                        <button
                          type="button"
                          disabled={!canMoveLeft}
                          onClick={() => stepStage(deal, -1)}
                          className={styles.stageStepBtn}
                          aria-label={`Lùi ${deal.title} về giai đoạn trước`}
                          title="Chuyển về giai đoạn trước"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveRight}
                          onClick={() => stepStage(deal, 1)}
                          className={styles.stageStepBtn}
                          aria-label={`Tiến ${deal.title} sang giai đoạn tiếp theo`}
                          title="Chuyển sang giai đoạn kế tiếp"
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </footer>
                  </motion.article>
                );
              })}

              {columnDeals.length === 0 && (
                <div className={styles.emptyColumnDrop}>
                  <Sparkles size={16} />
                  <span>Kéo thả thẻ cơ hội vào cột này</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
