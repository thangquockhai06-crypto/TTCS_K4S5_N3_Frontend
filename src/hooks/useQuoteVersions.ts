import { useState, useEffect, useCallback, useMemo } from 'react';
import { IQuote, IQuoteComparison } from '../interfaces/quote.interface';
import { quoteService } from '../services/quoteService';
import { showGlobalToast } from '../context/ToastContext';
import { useAuth } from './useAuth';
import { useAuthorization } from './useAuthorization';

export interface IUseQuoteVersionsOptions {
  dealId: string;
  currentQuoteId?: string;
}

export interface IUseQuoteVersionsResult {
  versions: IQuote[];
  activeVersion: IQuote | null;
  effectiveVersion: IQuote | null;
  isLoading: boolean;
  isCreatingVersion: boolean;
  loadVersions: () => void;
  selectVersion: (versionId: string) => IQuote | null;
  createNewVersion: (changeSummary: string) => Promise<IQuote | null>;
  setEffective: (versionId: string) => Promise<IQuote | null>;
  compareVersions: (baseId: string, targetId: string) => IQuoteComparison | null;
}

export function useQuoteVersions({
  dealId,
  currentQuoteId,
}: IUseQuoteVersionsOptions): IUseQuoteVersionsResult {
  const { user } = useAuth();
  const { role } = useAuthorization();

  const [versions, setVersions] = useState<IQuote[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    currentQuoteId || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingVersion, setIsCreatingVersion] = useState<boolean>(false);

  const loadVersions = useCallback(() => {
    if (!dealId) return;
    setIsLoading(true);
    try {
      const list = quoteService.getQuoteVersions(dealId);
      setVersions(list);

      // Nếu chưa chọn version, mặc định chọn version hiện tại hoặc effective hoặc version mới nhất
      setSelectedVersionId((prev) => {
        if (prev && list.some((v) => v.id === prev)) return prev;
        const effective = list.find((v) => v.isEffective);
        if (effective) return effective.id;
        return list.length > 0 ? list[list.length - 1].id : null;
      });
    } catch (err: unknown) {
      console.error('Lỗi tải danh sách phiên bản báo giá:', err);
      showGlobalToast('Không thể tải lịch sử phiên bản báo giá.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadVersions();
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === null || e.key.includes(dealId)) {
        loadVersions();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadVersions, dealId]);

  // Cập nhật selectedVersionId nếu currentQuoteId thay đổi từ bên ngoài
  useEffect(() => {
    if (currentQuoteId) {
      setSelectedVersionId(currentQuoteId);
    }
  }, [currentQuoteId]);

  const activeVersion = useMemo(() => {
    if (!selectedVersionId) return versions[versions.length - 1] || null;
    return versions.find((v) => v.id === selectedVersionId) || versions[versions.length - 1] || null;
  }, [selectedVersionId, versions]);

  const effectiveVersion = useMemo(() => {
    return versions.find((v) => v.isEffective) || null;
  }, [versions]);

  const selectVersion = useCallback(
    (versionId: string): IQuote | null => {
      const found = versions.find((v) => v.id === versionId);
      if (found) {
        setSelectedVersionId(versionId);
        return found;
      }
      return null;
    },
    [versions]
  );

  // Tạo phiên bản mới kế thừa từ phiên bản đang chọn hoặc phiên bản gốc
  const createNewVersion = useCallback(
    async (changeSummary: string): Promise<IQuote | null> => {
      if (!activeVersion) {
        showGlobalToast('Chưa chọn phiên bản báo giá gốc để tạo mới.', 'warning');
        return null;
      }

      const summary = changeSummary.trim();
      if (!summary) {
        showGlobalToast('Vui lòng nhập lý do tạo phiên bản mới.', 'warning');
        return null;
      }

      setIsCreatingVersion(true);
      try {
        const newVersion = quoteService.createNewVersion(
          activeVersion.id,
          summary,
          user?.fullName || activeVersion.createdBy,
          role || activeVersion.creatorRole
        );

        loadVersions();
        setSelectedVersionId(newVersion.id);

        showGlobalToast(
          `Đã tạo thành công Phiên bản v${newVersion.version}! Phiên bản cũ v${activeVersion.version} được giữ nguyên.`,
          'success',
          undefined,
          4000
        );
        return newVersion;
      } catch (err: unknown) {
        console.error('Lỗi tạo phiên bản mới:', err);
        showGlobalToast(
          err instanceof Error ? err.message : 'Không thể tạo phiên bản mới.',
          'error'
        );
        return null;
      } finally {
        setIsCreatingVersion(false);
      }
    },
    [activeVersion, user?.fullName, role, loadVersions]
  );

  // Đặt phiên bản làm phiên bản đang hiệu lực (Chỉ 1 phiên bản hiệu lực tại một thời điểm)
  const setEffective = useCallback(
    async (versionId: string): Promise<IQuote | null> => {
      if (!dealId) return null;
      try {
        const effective = quoteService.setEffectiveVersion(dealId, versionId);
        loadVersions();
        showGlobalToast(
          `Đã chuyển Phiên bản v${effective.version} thành phiên bản đang hiệu lực của báo giá.`,
          'success',
          undefined,
          3500
        );
        return effective;
      } catch (err: unknown) {
        console.error('Lỗi kích hoạt phiên bản hiệu lực:', err);
        showGlobalToast(
          err instanceof Error ? err.message : 'Không thể cập nhật phiên bản hiệu lực.',
          'error'
        );
        return null;
      }
    },
    [dealId, loadVersions]
  );

  // So sánh 2 phiên bản
  const compareVersions = useCallback(
    (baseId: string, targetId: string): IQuoteComparison | null => {
      const baseQuote = versions.find((v) => v.id === baseId);
      const targetQuote = versions.find((v) => v.id === targetId);

      if (!baseQuote || !targetQuote) return null;

      return quoteService.compareQuotes(baseQuote, targetQuote);
    },
    [versions]
  );

  return {
    versions,
    activeVersion,
    effectiveVersion,
    isLoading,
    isCreatingVersion,
    loadVersions,
    selectVersion,
    createNewVersion,
    setEffective,
    compareVersions,
  };
}
