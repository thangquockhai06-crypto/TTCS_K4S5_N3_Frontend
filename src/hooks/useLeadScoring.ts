import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ILeadScoringConfig,
  ILeadScoreThresholds,
  ICreateCriterionDTO,
  UpdateCriterionDTO,
  IScoredLead,
  ILeadScoringStats,
} from '../interfaces/lead-scoring.interface';
import { leadScoringService } from '../services/leadScoringService';
import { leadCaptureService } from '../services/leadCaptureService';
import { useToast } from '../context/ToastContext';

export function useLeadScoring() {
  const { showToast } = useToast();

  const [config, setConfig] = useState<ILeadScoringConfig>(() =>
    leadScoringService.getConfig()
  );

  const [scoredLeads, setScoredLeads] = useState<IScoredLead[]>(() =>
    leadScoringService.scoreAllLeads(undefined, leadScoringService.getConfig())
  );

  // Tự động tính toán lại điểm Lead khi config hoặc submissions thay đổi
  const refreshScores = useCallback(
    (customCfg?: ILeadScoringConfig) => {
      const activeCfg = customCfg || config;
      const allSubmissions = leadCaptureService.getSubmissions();
      const updated = leadScoringService.scoreAllLeads(allSubmissions, activeCfg);
      setScoredLeads(updated);
    },
    [config]
  );

  useEffect(() => {
    refreshScores(config);
  }, [config, refreshScores]);

  // Thống kê tổng quan về các dải nhiệt độ Lead
  const stats: ILeadScoringStats = useMemo(() => {
    const totalLeads = scoredLeads.length;
    let hotCount = 0;
    let warmCount = 0;
    let coldCount = 0;
    let totalScoreSum = 0;

    for (const lead of scoredLeads) {
      totalScoreSum += lead.score;
      if (lead.temperature === 'Hot') hotCount++;
      else if (lead.temperature === 'Warm') warmCount++;
      else coldCount++;
    }

    return {
      totalLeads,
      hotCount,
      warmCount,
      coldCount,
      averageScore: totalLeads > 0 ? Math.round(totalScoreSum / totalLeads) : 0,
    };
  }, [scoredLeads]);

  const updateThresholds = useCallback(
    (newThresholds: Partial<ILeadScoreThresholds>) => {
      const updated = leadScoringService.updateThresholds(newThresholds);
      setConfig(updated);
      refreshScores(updated);
      showToast('Đã lưu cấu hình ngưỡng điểm phân loại Nóng / Ấm / Lạnh thành công!', 'success', undefined, 2800);
    },
    [refreshScores, showToast]
  );

  const addCriterion = useCallback(
    (dto: ICreateCriterionDTO) => {
      const updated = leadScoringService.addCriterion(dto);
      setConfig(updated);
      refreshScores(updated);
      showToast(`Đã thêm tiêu chí "${dto.criterionName}" (+${dto.points} điểm)`, 'success', undefined, 2800);
    },
    [refreshScores, showToast]
  );

  const updateCriterion = useCallback(
    (id: string, dto: UpdateCriterionDTO) => {
      const updated = leadScoringService.updateCriterion(id, dto);
      setConfig(updated);
      refreshScores(updated);
      showToast('Đã cập nhật tiêu chí chấm điểm thành công!', 'success', undefined, 2800);
    },
    [refreshScores, showToast]
  );

  const deleteCriterion = useCallback(
    (id: string, name: string) => {
      const updated = leadScoringService.deleteCriterion(id);
      setConfig(updated);
      refreshScores(updated);
      showToast(`Đã xóa tiêu chí "${name}" khỏi thang điểm!`, 'info', undefined, 2500);
    },
    [refreshScores, showToast]
  );

  const toggleCriterion = useCallback(
    (id: string, isEnabled: boolean, name: string) => {
      const updated = leadScoringService.toggleCriterion(id, isEnabled);
      setConfig(updated);
      refreshScores(updated);
      showToast(
        isEnabled ? `Đã kích hoạt tiêu chí "${name}"` : `Đã tạm ngưng tiêu chí "${name}"`,
        'info',
        undefined,
        2000
      );
    },
    [refreshScores, showToast]
  );

  const recalculateAll = useCallback(() => {
    const activeCfg = leadScoringService.getConfig();
    setConfig(activeCfg);
    refreshScores(activeCfg);
    showToast(
      `Đã tính toán lại điểm số tự động cho toàn bộ ${scoredLeads.length} Lead theo cấu hình mới!`,
      'success',
      undefined,
      2800
    );
  }, [refreshScores, scoredLeads.length, showToast]);

  const resetToDefault = useCallback(() => {
    const resetCfg = leadScoringService.resetToDefault();
    setConfig(resetCfg);
    refreshScores(resetCfg);
    showToast('Đã khôi phục cấu hình thang điểm về mặc định chuẩn SaaS!', 'success', undefined, 2800);
  }, [refreshScores, showToast]);

  return {
    config,
    scoredLeads,
    stats,
    updateThresholds,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    toggleCriterion,
    recalculateAll,
    resetToDefault,
  };
}
