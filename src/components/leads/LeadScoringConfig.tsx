import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Thermometer,
  Snowflake,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Search,
  PhoneCall,
  Mail,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Target,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useLeadScoring } from '../../hooks/useLeadScoring';
import { LeadScoreBadge } from './LeadScoreBadge';
import { Button, Modal, ConfirmModal } from '../common';
import { Badge } from '../common/Badge';
import {
  ILeadScoringCriterion,
  LeadScoringCategoryType,
  ConditionOperatorType,
  ICreateCriterionDTO,
  LeadTemperatureType,
  IScoredLead,
} from '../../interfaces/lead-scoring.interface';
import { useToast } from '../../context/ToastContext';
import styles from './LeadScoringConfig.module.css';

export const LeadScoringConfig: React.FC = () => {
  const { showToast } = useToast();
  const {
    config,
    scoredLeads,
    stats,
    updateThresholds,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    toggleCriterion,
    recalculateAll,
  } = useLeadScoring();

  // Threshold edit state
  const [isEditingThresholds, setIsEditingThresholds] = useState<boolean>(false);
  const [hotMinInput, setHotMinInput] = useState<number>(config.thresholds.hotMin);
  const [warmMinInput, setWarmMinInput] = useState<number>(config.thresholds.warmMin);

  // Criteria filter tab
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Phân trang danh sách tiêu chí (Card 2)
  const [criteriaPage, setCriteriaPage] = useState<number>(1);
  const criteriaPerPage = 5;

  // Criteria Modal State
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState<boolean>(false);
  const [editingCriterion, setEditingCriterion] = useState<ILeadScoringCriterion | null>(null);

  // Form fields for create/edit criterion
  const [critCategory, setCritCategory] = useState<LeadScoringCategoryType>('industry');
  const [critName, setCritName] = useState<string>('');
  const [critField, setCritField] = useState<'industry' | 'companySize' | 'leadSource' | 'interest' | 'company' | 'custom'>('industry');
  const [critOperator, setCritOperator] = useState<ConditionOperatorType>('contains');
  const [critValue, setCritValue] = useState<string>('');
  const [critPoints, setCritPoints] = useState<number>(20);
  const [critDescription, setCritDescription] = useState<string>('');

  // Delete confirm modal state
  const [deletingCriterionId, setDeletingCriterionId] = useState<string | null>(null);
  const [deletingCriterionName, setDeletingCriterionName] = useState<string>('');

  // Simulator state
  const [simIndustry, setSimIndustry] = useState<string>('Công nghệ thông tin & Viễn thông');
  const [simCompanySize, setSimCompanySize] = useState<string>('Enterprise (> 500 nhân sự)');
  const [simSource, setSimSource] = useState<string>('Website Landing Page');
  const [simInterest, setSimInterest] = useState<string>('enterprise_pricing');

  // Call Queue state & Pagination (Card 4)
  const [queueTempFilter, setQueueTempFilter] = useState<'all' | LeadTemperatureType>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);
  const queuePerPage = 5;

  // Tự động reset trang tiêu chí khi chuyển danh mục
  useEffect(() => {
    setCriteriaPage(1);
  }, [selectedCategory]);

  // Tự động reset trang hàng đợi khi lọc hoặc tìm kiếm
  useEffect(() => {
    setQueuePage(1);
  }, [queueTempFilter, queueSearchQuery]);

  // Xử lý lưu ngưỡng điểm
  const handleSaveThresholds = () => {
    if (hotMinInput <= warmMinInput) {
      showToast('Ngưỡng điểm Lead Nóng phải lớn hơn ngưỡng điểm Lead Ấm!', 'error');
      return;
    }
    updateThresholds({
      hotMin: Number(hotMinInput),
      warmMin: Number(warmMinInput),
      coldMax: Number(warmMinInput) - 1,
    });
    setIsEditingThresholds(false);
  };

  // Mở modal thêm mới tiêu chí
  const handleOpenAddCriterion = () => {
    setEditingCriterion(null);
    setCritCategory('industry');
    setCritName('');
    setCritField('industry');
    setCritOperator('contains');
    setCritValue('');
    setCritPoints(20);
    setCritDescription('');
    setIsCriterionModalOpen(true);
  };

  // Mở modal chỉnh sửa tiêu chí
  const handleOpenEditCriterion = (criterion: ILeadScoringCriterion) => {
    setEditingCriterion(criterion);
    setCritCategory(criterion.category);
    setCritName(criterion.criterionName);
    setCritField(criterion.conditionField);
    setCritOperator(criterion.conditionOperator);
    setCritValue(criterion.conditionValue);
    setCritPoints(criterion.points);
    setCritDescription(criterion.description);
    setIsCriterionModalOpen(true);
  };

  // Lưu tiêu chí (thêm mới hoặc cập nhật)
  const handleSubmitCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!critName.trim() || !critValue.trim()) {
      showToast('Vui lòng nhập đầy đủ tên tiêu chí và giá trị điều kiện!', 'error');
      return;
    }

    if (editingCriterion) {
      updateCriterion(editingCriterion.id, {
        category: critCategory,
        criterionName: critName.trim(),
        conditionField: critField,
        conditionOperator: critOperator,
        conditionValue: critValue.trim(),
        points: Number(critPoints),
        description: critDescription.trim(),
      });
    } else {
      const dto: ICreateCriterionDTO = {
        category: critCategory,
        criterionName: critName.trim(),
        conditionField: critField,
        conditionOperator: critOperator,
        conditionValue: critValue.trim(),
        points: Number(critPoints),
        description: critDescription.trim(),
        isEnabled: true,
      };
      addCriterion(dto);
    }
    setIsCriterionModalOpen(false);
  };

  // Xác nhận xóa tiêu chí
  const handleConfirmDelete = () => {
    if (deletingCriterionId) {
      deleteCriterion(deletingCriterionId, deletingCriterionName);
      setDeletingCriterionId(null);
    }
  };

  // Lọc tiêu chí hiển thị theo category & Phân trang (Card 2)
  const filteredCriteria = useMemo(() => {
    if (selectedCategory === 'all') return config.criteria;
    return config.criteria.filter((c) => c.category === selectedCategory);
  }, [config.criteria, selectedCategory]);

  const totalCriteriaPages = Math.max(1, Math.ceil(filteredCriteria.length / criteriaPerPage));
  const pagedCriteria = useMemo(() => {
    const start = (criteriaPage - 1) * criteriaPerPage;
    return filteredCriteria.slice(start, start + criteriaPerPage);
  }, [filteredCriteria, criteriaPage, criteriaPerPage]);

  // Tính toán kết quả Simulator
  const simulatedScoreDetail = useMemo(() => {
    const matchedCriteria: { criterionName: string; points: number }[] = [];
    let totalScore = 0;

    for (const c of config.criteria) {
      if (!c.isEnabled) continue;
      let isMatch = false;
      let targetVal = '';

      if (c.conditionField === 'industry') targetVal = simIndustry;
      else if (c.conditionField === 'companySize') targetVal = simCompanySize;
      else if (c.conditionField === 'leadSource') targetVal = simSource;
      else if (c.conditionField === 'interest') targetVal = simInterest;

      if (c.conditionOperator === 'equals') {
        isMatch = targetVal.toLowerCase().trim() === c.conditionValue.toLowerCase().trim();
      } else if (c.conditionOperator === 'contains') {
        isMatch = targetVal.toLowerCase().includes(c.conditionValue.toLowerCase().trim());
      }

      if (isMatch) {
        totalScore += c.points;
        matchedCriteria.push({ criterionName: c.criterionName, points: c.points });
      }
    }

    const finalScore = Math.max(0, Math.min(100, totalScore));
    const temp: LeadTemperatureType =
      finalScore >= config.thresholds.hotMin
        ? 'Hot'
        : finalScore >= config.thresholds.warmMin
        ? 'Warm'
        : 'Cold';

    return { score: finalScore, temp, matchedCriteria };
  }, [config, simIndustry, simCompanySize, simSource, simInterest]);

  // Lọc hàng đợi cuộc gọi ưu tiên & Phân trang (Card 4)
  const filteredQueueLeads = useMemo(() => {
    return scoredLeads.filter((lead) => {
      // Lọc theo nhiệt độ
      if (queueTempFilter !== 'all' && lead.temperature !== queueTempFilter) {
        return false;
      }
      // Lọc theo từ khóa tìm kiếm
      if (queueSearchQuery.trim()) {
        const query = queueSearchQuery.toLowerCase().trim();
        const text = `${lead.fullName} ${lead.company} ${lead.email} ${lead.phone}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [scoredLeads, queueTempFilter, queueSearchQuery]);

  const totalQueuePages = Math.max(1, Math.ceil(filteredQueueLeads.length / queuePerPage));
  const pagedQueueLeads = useMemo(() => {
    const start = (queuePage - 1) * queuePerPage;
    return filteredQueueLeads.slice(start, start + queuePerPage);
  }, [filteredQueueLeads, queuePage, queuePerPage]);

  // Trigger gọi điện mô phỏng
  const handleSimulateCall = (lead: IScoredLead) => {
    showToast(
      `Đang kết nối cuộc gọi ưu tiên tới ${lead.fullName} (${lead.phone}) - [${lead.score}đ · ${lead.temperature}]`,
      'info',
      undefined,
      2800
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleWithIcon}>
            <div className={styles.headerIconBadge}>
              <Flame size={24} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>Cấu Hình Chấm Điểm Lead (Lead Scoring)</h1>
              <p className={styles.pageSubtitle}>
                Thiết lập thang điểm đánh giá chất lượng Lead tự động theo ngành nghề, quy mô, kênh nguồn và mức độ quan tâm để đội ngũ kinh doanh ưu tiên liên hệ các cơ hội tiềm năng nhất trước.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={15} />}
            onClick={recalculateAll}
            title="Áp dụng thang điểm và tính toán lại toàn bộ lead"
          >
            Tính lại toàn bộ
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={handleOpenAddCriterion}
          >
            Thêm tiêu chí mới
          </Button>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <section className={styles.statsGrid} aria-label="Thống kê phân loại nhiệt độ Lead">
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Tổng số Lead</span>
            <span className={styles.statValue}>{stats.totalLeads}</span>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            <Users size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel} style={{ color: '#DC2626' }}>🔥 Lead Nóng (Hot)</span>
            <span className={styles.statValue} style={{ color: '#DC2626' }}>{stats.hotCount}</span>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
            <Flame size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel} style={{ color: '#D97706' }}>🌡️ Lead Ấm (Warm)</span>
            <span className={styles.statValue} style={{ color: '#D97706' }}>{stats.warmCount}</span>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
            <Thermometer size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel} style={{ color: '#2563EB' }}>❄️ Lead Lạnh (Cold)</span>
            <span className={styles.statValue} style={{ color: '#2563EB' }}>{stats.coldCount}</span>
          </div>
          <div className={styles.statIconBox} style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            <Snowflake size={22} />
          </div>
        </div>
      </section>

      {/* Card 1: Ngưỡng Phân Loại Nhiệt Độ Lead (Hot / Warm / Cold Thresholds) */}
      <section className={styles.thresholdsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrap}>
            <SlidersHorizontal size={20} color="#2563EB" />
            <div>
              <h2 className={styles.cardTitle}>Ngưỡng Phân Loại Nhiệt Độ Lead (Nóng / Ấm / Lạnh)</h2>
              <p className={styles.cardSubtitle}>
                Quy định mốc điểm để phân loại mức độ sẵn sàng mua hàng và xác định SLA phản hồi của nhân viên bán hàng
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isEditingThresholds ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 size={14} />}
                onClick={() => {
                  setHotMinInput(config.thresholds.hotMin);
                  setWarmMinInput(config.thresholds.warmMin);
                  setIsEditingThresholds(true);
                }}
              >
                Chỉnh sửa ngưỡng
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingThresholds(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 size={14} />}
                  onClick={handleSaveThresholds}
                >
                  Lưu cấu hình
                </Button>
              </>
            )}
          </div>
        </div>

        <div className={styles.thresholdsGrid}>
          {/* Cấp độ Nóng 🔥 */}
          <div className={`${styles.thresholdBox} ${styles['thresholdBox--hot']}`}>
            <div className={styles.thresholdHeader}>
              <span className={styles.thresholdTitle} style={{ color: '#DC2626' }}>
                <Flame size={20} /> Lead Nóng (Hot)
              </span>
              <Badge tone="danger">Ưu tiên số 1</Badge>
            </div>

            <div className={styles.thresholdInputRow}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Từ mốc:</span>
              {isEditingThresholds ? (
                <input
                  type="number"
                  className={styles.thresholdInput}
                  value={hotMinInput}
                  onChange={(e) => setHotMinInput(Number(e.target.value))}
                  min={1}
                  max={100}
                />
              ) : (
                <strong style={{ fontSize: '1.25rem', color: '#DC2626' }}>≥ {config.thresholds.hotMin}đ</strong>
              )}
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>đến 100 điểm</span>
            </div>

            <div className={styles.thresholdActionText}>
              <strong>SLA Hành động:</strong> {config.thresholds.hotAction}
            </div>
          </div>

          {/* Cấp độ Ấm 🌡️ */}
          <div className={`${styles.thresholdBox} ${styles['thresholdBox--warm']}`}>
            <div className={styles.thresholdHeader}>
              <span className={styles.thresholdTitle} style={{ color: '#D97706' }}>
                <Thermometer size={20} /> Lead Ấm (Warm)
              </span>
              <Badge tone="warning">Ưu tiên số 2</Badge>
            </div>

            <div className={styles.thresholdInputRow}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Từ mốc:</span>
              {isEditingThresholds ? (
                <input
                  type="number"
                  className={styles.thresholdInput}
                  value={warmMinInput}
                  onChange={(e) => setWarmMinInput(Number(e.target.value))}
                  min={1}
                  max={hotMinInput - 1}
                />
              ) : (
                <strong style={{ fontSize: '1.25rem', color: '#D97706' }}>
                  {config.thresholds.warmMin}đ - {config.thresholds.hotMin - 1}đ
                </strong>
              )}
            </div>

            <div className={styles.thresholdActionText}>
              <strong>SLA Hành động:</strong> {config.thresholds.warmAction}
            </div>
          </div>

          {/* Cấp độ Lạnh ❄️ */}
          <div className={`${styles.thresholdBox} ${styles['thresholdBox--cold']}`}>
            <div className={styles.thresholdHeader}>
              <span className={styles.thresholdTitle} style={{ color: '#2563EB' }}>
                <Snowflake size={20} /> Lead Lạnh (Cold)
              </span>
              <Badge tone="primary">Nuôi dưỡng tự động</Badge>
            </div>

            <div className={styles.thresholdInputRow}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Mốc điểm:</span>
              <strong style={{ fontSize: '1.25rem', color: '#2563EB' }}>
                &lt; {isEditingThresholds ? warmMinInput : config.thresholds.warmMin}đ
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>(0 đến {isEditingThresholds ? warmMinInput - 1 : config.thresholds.warmMin - 1}đ)</span>
            </div>

            <div className={styles.thresholdActionText}>
              <strong>SLA Hành động:</strong> {config.thresholds.coldAction}
            </div>
          </div>
        </div>

        {/* Thước đo trực quan phân tầng thang điểm */}
        <div className={styles.spectrumWrap}>
          <div className={styles.spectrumBar} />
          <div className={styles.spectrumLabels}>
            <span>0đ (Lạnh ❄️)</span>
            <span>{config.thresholds.warmMin}đ (Ấm 🌡️)</span>
            <span>{config.thresholds.hotMin}đ (Nóng 🔥)</span>
            <span>100đ</span>
          </div>
        </div>
      </section>

      {/* Card 2: Bảng Khai Báo Tiêu Chí & Thang Điểm (Criteria Rules) */}
      <section className={styles.criteriaCard}>
        <div className={styles.criteriaHeaderRow}>
          <div>
            <h2 className={styles.cardTitle}>Danh Sách Tiêu Chí & Thang Điểm Khai Báo</h2>
            <p className={styles.cardSubtitle}>
              Khai báo số điểm cộng/trừ cho từng thuộc tính để hệ thống tự động cộng dồn điểm tiềm năng khi phát sinh hoặc cập nhật lead
            </p>
          </div>

          {/* Nhóm lọc Pills */}
          <div className={styles.categoryFilterPills}>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory === 'all' ? styles['filterPill--active'] : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả ({config.criteria.length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory === 'industry' ? styles['filterPill--active'] : ''}`}
              onClick={() => setSelectedCategory('industry')}
            >
              🏢 Ngành nghề ({config.criteria.filter((c) => c.category === 'industry').length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory === 'company_size' ? styles['filterPill--active'] : ''}`}
              onClick={() => setSelectedCategory('company_size')}
            >
              👥 Quy mô ({config.criteria.filter((c) => c.category === 'company_size').length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory === 'lead_source' ? styles['filterPill--active'] : ''}`}
              onClick={() => setSelectedCategory('lead_source')}
            >
              🌐 Nguồn Lead ({config.criteria.filter((c) => c.category === 'lead_source').length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory === 'interest' ? styles['filterPill--active'] : ''}`}
              onClick={() => setSelectedCategory('interest')}
            >
              🎯 Nhu cầu quan tâm ({config.criteria.filter((c) => c.category === 'interest').length})
            </button>
          </div>
        </div>

        {/* Bảng tiêu chí */}
        <div className={styles.tableWrapper}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Nhóm Tiêu Chí</th>
                <th style={{ width: '28%' }}>Tên Tiêu Chí & Điều Kiện So Khớp</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Điểm Thưởng</th>
                <th style={{ width: '28%' }}>Mô Tả & Ý Nghĩa Nghiệp Vụ</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedCriteria.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Badge tone={c.category === 'industry' ? 'primary' : c.category === 'company_size' ? 'info' : c.category === 'interest' ? 'warning' : 'accent'}>
                      {c.categoryLabel}
                    </Badge>
                  </td>
                  <td>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A' }}>
                      {c.criterionName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Trường: <code>{c.conditionField}</code> {c.conditionOperator === 'equals' ? 'chính xác bằng' : 'chứa chuỗi'}: &quot;<strong>{c.conditionValue}</strong>&quot;
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={c.points >= 0 ? styles.pointBadgePositive : styles.pointBadgeNegative}>
                      {c.points > 0 ? `+${c.points}` : c.points} điểm
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: '#475569' }}>{c.description}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className={styles.switchLabel} title={c.isEnabled ? 'Đang kích hoạt' : 'Đang tạm dừng'}>
                      <input
                        type="checkbox"
                        className={styles.switchInput}
                        checked={c.isEnabled}
                        onChange={(e) => toggleCriterion(c.id, e.target.checked, c.criterionName)}
                      />
                      <span className={styles.switchSlider} />
                    </label>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditCriterion(c)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#475569' }}
                        title="Chỉnh sửa tiêu chí"
                        aria-label={`Chỉnh sửa tiêu chí ${c.criterionName}`}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingCriterionId(c.id);
                          setDeletingCriterionName(c.criterionName);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#EF4444' }}
                        title="Xóa tiêu chí"
                        aria-label={`Xóa tiêu chí ${c.criterionName}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang danh sách tiêu chí */}
        {filteredCriteria.length > 0 && (
          <div className={styles.paginationBar}>
            <span className={styles.paginationInfo}>
              Hiển thị {Math.min((criteriaPage - 1) * criteriaPerPage + 1, filteredCriteria.length)} - {Math.min(criteriaPage * criteriaPerPage, filteredCriteria.length)} trên tổng số {filteredCriteria.length} tiêu chí
            </span>
            <div className={styles.paginationControls}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={criteriaPage <= 1}
                onClick={() => setCriteriaPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className={styles.paginationPageText}>
                Trang {criteriaPage} / {totalCriteriaPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={criteriaPage >= totalCriteriaPages}
                onClick={() => setCriteriaPage((p) => Math.min(totalCriteriaPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Card 3: Trình Thử Nghiệm Chấm Điểm Trực Tiếp (Live Score Simulator) */}
      <section className={styles.simulatorCard}>
        <div className={styles.cardTitleWrap}>
          <Sparkles size={20} color="#8B5CF6" />
          <div>
            <h2 className={styles.cardTitle}>Bộ Thử Nghiệm Chấm Điểm Real-time (Score Simulator)</h2>
            <p className={styles.cardSubtitle}>
              Mô phỏng tức thì điểm số và phân loại Nóng/Ấm/Lạnh khi thông tin hồ sơ lead thay đổi
            </p>
          </div>
        </div>

        <div className={styles.simGrid}>
          {/* Controls */}
          <div className={styles.simControls}>
            <div className={styles.simField}>
              <label className={styles.simLabel}>1. Ngành nghề doanh nghiệp:</label>
              <select
                className={styles.simSelect}
                value={simIndustry}
                onChange={(e) => setSimIndustry(e.target.value)}
              >
                <option value="Công nghệ thông tin & Viễn thông">Công nghệ thông tin & Viễn thông (+25đ)</option>
                <option value="Tài chính - Ngân hàng - Bảo hiểm">Tài chính - Ngân hàng - Bảo hiểm (+25đ)</option>
                <option value="Bán lẻ, Thương mại & Logistics">Bán lẻ, Thương mại & Logistics (+20đ)</option>
                <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng (+15đ)</option>
                <option value="Khác">Ngành nghề khác (0đ)</option>
              </select>
            </div>

            <div className={styles.simField}>
              <label className={styles.simLabel}>2. Quy mô doanh nghiệp:</label>
              <select
                className={styles.simSelect}
                value={simCompanySize}
                onChange={(e) => setSimCompanySize(e.target.value)}
              >
                <option value="Enterprise (> 500 nhân sự)">Enterprise (&gt; 500 nhân sự) (+30đ)</option>
                <option value="Mid-Market (50 - 200 nhân sự)">Mid-Market (50 - 200 nhân sự) (+20đ)</option>
                <option value="SME / Startup (< 50 nhân sự)">SME / Startup (&lt; 50 nhân sự) (+10đ)</option>
              </select>
            </div>

            <div className={styles.simField}>
              <label className={styles.simLabel}>3. Nguồn phát sinh Lead:</label>
              <select
                className={styles.simSelect}
                value={simSource}
                onChange={(e) => setSimSource(e.target.value)}
              >
                <option value="Giới thiệu từ Đối tác">Giới thiệu từ Đối tác (Referral) (+30đ)</option>
                <option value="Sự Kiện Hội Thảo Tech">Sự Kiện Hội Thảo Tech (+25đ)</option>
                <option value="Website Landing Page">Website Landing Page (Webform) (+20đ)</option>
                <option value="Google Ads">Chiến Dịch Google Ads (+15đ)</option>
                <option value="Facebook Ads">Chiến Dịch Facebook Ads (+10đ)</option>
              </select>
            </div>

            <div className={styles.simField}>
              <label className={styles.simLabel}>4. Mức độ quan tâm:</label>
              <select
                className={styles.simSelect}
                value={simInterest}
                onChange={(e) => setSimInterest(e.target.value)}
              >
                <option value="enterprise_pricing">Báo giá Gói Enterprise (+30đ)</option>
                <option value="crm_consultation">Tư vấn CRM Doanh nghiệp (+25đ)</option>
                <option value="product_demo">Trải nghiệm Bản Demo (+20đ)</option>
                <option value="system_integration">Tích hợp API Webhook (+15đ)</option>
                <option value="partnership">Hợp tác Đại lý & Đối tác (+10đ)</option>
                <option value="other">Yêu cầu khác (+5đ)</option>
              </select>
            </div>
          </div>

          {/* Simulator Result Preview */}
          <div className={styles.simResultBox}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Điểm Tiềm Năng Mô Phỏng</div>
            <div className={styles.simBigScore}>{simulatedScoreDetail.score}đ</div>
            <LeadScoreBadge
              score={simulatedScoreDetail.score}
              temperature={simulatedScoreDetail.temp}
              size="lg"
              matchedCriteria={simulatedScoreDetail.matchedCriteria}
            />
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
              Khớp <strong>{simulatedScoreDetail.matchedCriteria.length}</strong> tiêu chí thang điểm
            </div>
          </div>
        </div>
      </section>

      {/* Card 4: Hàng Đợi Lead Ưu Tiên Liên Hệ (Prioritized Call Queue) */}
      <section className={styles.queueCard}>
        {/* Banner lưu ý bảo toàn dữ liệu */}
        <div className={styles.queueNoticeBanner}>
          <ShieldCheck size={18} color="#16A34A" style={{ flexShrink: 0 }} />
          <span>
            <strong className={styles.queueNoticeHighlight}>Nguyên tắc bảo toàn dữ liệu:</strong> Điểm số được dùng độc quyền để sắp xếp thứ tự ưu tiên gọi điện cho nhân viên kinh doanh, <strong>hoàn toàn không tự động loại bỏ bất kỳ lead nào</strong> khỏi danh sách.
          </span>
        </div>

        {/* Toolbar & Filter */}
        <div className={styles.queueFilterBar}>
          <div className={styles.categoryFilterPills}>
            <button
              type="button"
              className={`${styles.filterPill} ${queueTempFilter === 'all' ? styles['filterPill--active'] : ''}`}
              onClick={() => setQueueTempFilter('all')}
            >
              Tất cả Lead ({scoredLeads.length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${queueTempFilter === 'Hot' ? styles['filterPill--active'] : ''}`}
              onClick={() => setQueueTempFilter('Hot')}
              style={queueTempFilter === 'Hot' ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : {}}
            >
              🔥 Nóng ({stats.hotCount})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${queueTempFilter === 'Warm' ? styles['filterPill--active'] : ''}`}
              onClick={() => setQueueTempFilter('Warm')}
              style={queueTempFilter === 'Warm' ? { backgroundColor: '#D97706', borderColor: '#D97706' } : {}}
            >
              🌡️ Ấm ({stats.warmCount})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${queueTempFilter === 'Cold' ? styles['filterPill--active'] : ''}`}
              onClick={() => setQueueTempFilter('Cold')}
              style={queueTempFilter === 'Cold' ? { backgroundColor: '#2563EB', borderColor: '#2563EB' } : {}}
            >
              ❄️ Lạnh ({stats.coldCount})
            </button>
          </div>

          <div className={styles.queueSearchBox}>
            <Search size={16} className={styles.queueSearchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, doanh nghiệp, email, SĐT..."
              className={styles.queueSearchInput}
              value={queueSearchQuery}
              onChange={(e) => setQueueSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table hàng đợi ưu tiên */}
        <div className={styles.tableWrapper}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th style={{ width: '6%', textAlign: 'center' }}>Ưu Tiên</th>
                <th style={{ width: '22%' }}>Khách Hàng & Doanh Nghiệp</th>
                <th style={{ width: '18%' }}>Ngành Nghề & Quy Mô</th>
                <th style={{ width: '18%' }}>Kênh Nguồn & Nhu Cầu</th>
                <th style={{ width: '16%', textAlign: 'center' }}>Điểm & Phân Loại</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Hành Động Khuyến Nghị</th>
              </tr>
            </thead>
            <tbody>
              {pagedQueueLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    Không tìm thấy lead nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                pagedQueueLeads.map((lead, idx) => {
                  const globalRank = (queuePage - 1) * queuePerPage + idx + 1;
                  return (
                    <tr key={lead.id}>
                      {/* Rank Badge */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`${styles.rankBadge} ${
                            globalRank === 1
                              ? styles.rankBadgeTop1
                              : globalRank === 2
                              ? styles.rankBadgeTop2
                              : globalRank === 3
                              ? styles.rankBadgeTop3
                              : ''
                          }`}
                        >
                          #{globalRank}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>
                          {lead.fullName}
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {lead.company || 'Doanh nghiệp chưa khai báo'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: 2 }}>
                          {lead.phone} · {lead.email}
                        </div>
                      </td>

                      {/* Industry & Size */}
                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                          {lead.industry}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {lead.companySize}
                        </div>
                      </td>

                      {/* Source & Interest */}
                      <td>
                        <Badge tone="primary">{lead.leadSource || 'Webform'}</Badge>
                        <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 4 }}>
                          {lead.interest === 'enterprise_pricing'
                            ? 'Báo giá Enterprise'
                            : lead.interest === 'crm_consultation'
                            ? 'Tư vấn giải pháp CRM'
                            : lead.interest === 'product_demo'
                            ? 'Trải nghiệm Bản Demo'
                            : lead.interest === 'system_integration'
                            ? 'Tích hợp API Webhook'
                            : 'Yêu cầu tùy chỉnh'}
                        </div>
                      </td>

                      {/* Score Badge */}
                      <td style={{ textAlign: 'center' }}>
                        <LeadScoreBadge
                          score={lead.score}
                          temperature={lead.temperature}
                          size="md"
                          matchedCriteria={lead.scoreDetail?.matchedCriteria}
                          recommendedAction={lead.scoreDetail?.recommendedAction}
                        />
                      </td>

                      {/* Action buttons */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Button
                            type="button"
                            variant={lead.temperature === 'Hot' ? 'primary' : 'secondary'}
                            size="sm"
                            leftIcon={<PhoneCall size={13} />}
                            onClick={() => handleSimulateCall(lead)}
                          >
                            {lead.temperature === 'Hot' ? 'Gọi ngay' : 'Liên hệ'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            leftIcon={<Mail size={13} />}
                            onClick={() => showToast(`Gửi email tư vấn giải pháp tới ${lead.email}`, 'info', undefined, 2800)}
                            title="Gửi email tự động"
                          >
                            Email
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang hàng đợi lead ưu tiên */}
        {filteredQueueLeads.length > 0 && (
          <div className={styles.paginationBar}>
            <span className={styles.paginationInfo}>
              Hiển thị {Math.min((queuePage - 1) * queuePerPage + 1, filteredQueueLeads.length)} - {Math.min(queuePage * queuePerPage, filteredQueueLeads.length)} trên tổng số {filteredQueueLeads.length} Lead ưu tiên
            </span>
            <div className={styles.paginationControls}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={queuePage <= 1}
                onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className={styles.paginationPageText}>
                Trang {queuePage} / {totalQueuePages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={queuePage >= totalQueuePages}
                onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Modal Thêm / Chỉnh Sửa Tiêu Chí */}
      <Modal
        isOpen={isCriterionModalOpen}
        onClose={() => setIsCriterionModalOpen(false)}
        title={editingCriterion ? 'Chỉnh Sửa Tiêu Chí Chấm Điểm' : 'Thêm Tiêu Chí Chấm Điểm Mới'}
        subtitle="Thiết lập điều kiện khớp dữ liệu và số điểm cộng/trừ tương ứng"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitCriterion} className={styles.modalForm}>
          <div className={styles.formRow2}>
            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Nhóm tiêu chí:</label>
              <select
                className={styles.modalFieldControl}
                value={critCategory}
                onChange={(e) => setCritCategory(e.target.value as LeadScoringCategoryType)}
              >
                <option value="industry">🏢 Ngành nghề phù hợp</option>
                <option value="company_size">👥 Quy mô doanh nghiệp</option>
                <option value="lead_source">🌐 Kênh nguồn Lead</option>
                <option value="interest">🎯 Mức độ quan tâm</option>
                <option value="custom">⚙️ Tùy chỉnh khác</option>
              </select>
            </div>

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Điểm thưởng (+/-):</label>
              <input
                type="number"
                className={styles.modalFieldControl}
                value={critPoints}
                onChange={(e) => setCritPoints(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className={styles.modalFieldGroup}>
            <label className={styles.modalFieldLabel}>Tên tiêu chí hiển thị:</label>
            <input
              type="text"
              className={styles.modalFieldControl}
              value={critName}
              onChange={(e) => setCritName(e.target.value)}
              placeholder="Ví dụ: Công nghệ thông tin & Viễn thông"
              required
            />
          </div>

          <div className={styles.formRow2}>
            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Trường dữ liệu kiểm tra:</label>
              <select
                className={styles.modalFieldControl}
                value={critField}
                onChange={(e) =>
                  setCritField(
                    e.target.value as
                      | 'industry'
                      | 'companySize'
                      | 'leadSource'
                      | 'interest'
                      | 'company'
                      | 'custom'
                  )
                }
              >
                <option value="industry">industry (Ngành nghề)</option>
                <option value="companySize">companySize (Quy mô công ty)</option>
                <option value="leadSource">leadSource (Nguồn Lead)</option>
                <option value="interest">interest (Nhu cầu)</option>
                <option value="company">company (Tên công ty)</option>
              </select>
            </div>

            <div className={styles.modalFieldGroup}>
              <label className={styles.modalFieldLabel}>Phép toán so khớp:</label>
              <select
                className={styles.modalFieldControl}
                value={critOperator}
                onChange={(e) => setCritOperator(e.target.value as ConditionOperatorType)}
              >
                <option value="contains">Chứa chuỗi ký tự (contains)</option>
                <option value="equals">Chính xác bằng (equals)</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFieldGroup}>
            <label className={styles.modalFieldLabel}>Giá trị điều kiện khớp:</label>
            <input
              type="text"
              className={styles.modalFieldControl}
              value={critValue}
              onChange={(e) => setCritValue(e.target.value)}
              placeholder="Ví dụ: Công nghệ thông tin hoặc enterprise_pricing"
              required
            />
          </div>

          <div className={styles.modalFieldGroup}>
            <label className={styles.modalFieldLabel}>Mô tả ý nghĩa nghiệp vụ:</label>
            <input
              type="text"
              className={styles.modalFieldControl}
              value={critDescription}
              onChange={(e) => setCritDescription(e.target.value)}
              placeholder="Giải thích lý do cộng điểm này cho đội ngũ sales..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setIsCriterionModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" leftIcon={<CheckCircle2 size={16} />}>
              {editingCriterion ? 'Lưu thay đổi' : 'Thêm tiêu chí'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCriterionId)}
        onClose={() => setDeletingCriterionId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa tiêu chí thang điểm"
        message={`Bạn có chắc chắn muốn xóa tiêu chí "${deletingCriterionName}"? Thao tác này sẽ cập nhật lại điểm số của các lead liên quan.`}
        confirmText="Xác nhận xóa"
        variant="danger"
      />
    </div>
  );
};
