import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IQuote,
  IQuoteLineItem,
  IProductCatalogItem,
} from '../interfaces/quote.interface';
import { IDeal } from '../interfaces/deal.interface';
import { quoteService } from '../services/quoteService';
import { dealService } from '../services/dealService';
import { INITIAL_DEALS } from '../mock/deals';
import { showGlobalToast } from '../context/ToastContext';

interface IUseQuoteBuilderOptions {
  dealId?: string;
  quoteId?: string;
  initialDeal?: IDeal | null;
}

export function useQuoteBuilder({ dealId, quoteId, initialDeal }: IUseQuoteBuilderOptions) {
  const [deal, setDeal] = useState<IDeal | null>(initialDeal || null);
  const [quote, setQuote] = useState<IQuote | null>(null);
  const [versions, setVersions] = useState<IQuote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const productCatalog: IProductCatalogItem[] = useMemo(() => {
    return quoteService.getProductCatalog();
  }, []);

  const refreshVersions = useCallback((targetDealId: string) => {
    try {
      const list = quoteService.getQuoteVersions(targetDealId);
      setVersions(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  // Tải thông tin Deal và nạp Báo giá (kế thừa từ Deal hoặc nạp từ bản nháp đã lưu)
  const loadDealAndQuote = useCallback(async (targetDealId: string) => {
    setIsLoading(true);
    setLoadError(null);
    setQuote(null);
    try {
      // 1. Tải thông tin Deal trước khi kiểm tra bộ nhớ để tránh tạo trùng báo giá
      // khi React StrictMode chạy đồng thời hai lượt khởi tạo.
      let resolvedDeal: IDeal | null = initialDeal?.id === targetDealId ? initialDeal : null;
      if (!resolvedDeal) {
        // Nếu dealId là ID mock (deal-xxx), ưu tiên dùng dữ liệu mẫu thay vì gọi API
        const isMockId = targetDealId.startsWith('deal-');
        const mockDeal = INITIAL_DEALS.find((candidate) => candidate.id === targetDealId);

        if (isMockId && mockDeal) {
          resolvedDeal = mockDeal;
        } else {
          try {
            resolvedDeal = await dealService.getDeal(targetDealId);
          } catch (apiError: unknown) {
            if (mockDeal) {
              resolvedDeal = mockDeal;
              showGlobalToast(
                'Không kết nối được API cơ hội; đang sử dụng dữ liệu mẫu cho cơ hội này.',
                'warning'
              );
            } else {
              throw apiError;
            }
          }
        }
      }

      if (!resolvedDeal) {
        throw new Error('Không tìm thấy cơ hội bán hàng để tạo báo giá.');
      }

      setDeal(resolvedDeal);

      // Một lượt khởi tạo khác có thể đã lưu báo giá trong lúc chờ API Deal.
      const versionsList = quoteService.getQuoteVersions(targetDealId);
      const existingDraft = quoteService.getDraftByDealId(targetDealId);

      if (versionsList.length > 0) {
        // Đã có phiên bản: ưu tiên nạp phiên bản nháp đang sửa hoặc phiên bản hiệu lực
        const draftVer = versionsList.find((v) => v.status === 'draft');
        const effectiveVer = versionsList.find((v) => v.isEffective);
        const selectedVer = draftVer || effectiveVer || versionsList[versionsList.length - 1];
        setQuote(quoteService.recalculateQuote(selectedVer));
        setVersions(versionsList);
        setHasUnsavedChanges(false);
      } else if (existingDraft) {
        // Có bản nháp trước đó -> nạp lại để sửa tiếp và khởi tạo v1
        const v1: IQuote = {
          ...existingDraft,
          version: existingDraft.version || 1,
          isEffective: true,
          versionLabel: existingDraft.versionLabel || 'v1.0 (Ban đầu)',
        };
        quoteService.saveVersion(v1);
        setQuote(quoteService.recalculateQuote(v1));
        setVersions([v1]);
        setHasUnsavedChanges(false);
      } else if (resolvedDeal) {
        // Chưa có bản nháp -> Khởi tạo mới kế thừa dòng sản phẩm từ Deal (Phiên bản v1)
        const initialQuote = quoteService.createInitialQuoteFromDeal(resolvedDeal);
        initialQuote.isEffective = true;
        initialQuote.version = 1;
        initialQuote.versionLabel = 'v1.0 (Ban đầu)';
        quoteService.saveVersion(initialQuote);
        setQuote(initialQuote);
        setVersions([initialQuote]);
        setHasUnsavedChanges(false);
      }
    } catch (err: unknown) {
      console.error('Lỗi khởi tạo Báo giá:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể tải thông tin Cơ hội để tạo báo giá.';
      setLoadError(message);
      showGlobalToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [initialDeal]);

  useEffect(() => {
    if (quoteId) {
      const existingQuote = quoteService.getQuoteById(quoteId);
      if (existingQuote) {
        setQuote(existingQuote);
        const vers = quoteService.getQuoteVersions(existingQuote.dealId);
        setVersions(vers.length > 0 ? vers : [existingQuote]);
        const dealCandidate =
          INITIAL_DEALS.find((d) => d.id === existingQuote.dealId) || {
            id: existingQuote.dealId,
            title: existingQuote.dealTitle,
            customerId: existingQuote.customerId,
            customerName: existingQuote.customerName,
            company: existingQuote.customerCompany,
            stage: 'proposal',
            value: existingQuote.grandTotal,
            probability: 60,
            priority: 'Medium',
            expectedCloseDate: existingQuote.validUntil,
            ownerName: existingQuote.createdBy,
            createdAt: existingQuote.createdAt,
            updatedAt: existingQuote.updatedAt,
          };
        setDeal(dealCandidate as IDeal);
        setIsLoading(false);
        setHasUnsavedChanges(false);
        return;
      }
    }

    const targetDealId = dealId || initialDeal?.id || INITIAL_DEALS[0]?.id;
    if (targetDealId) {
      void loadDealAndQuote(targetDealId);
    } else {
      setIsLoading(false);
      setLoadError('Không có cơ hội bán hàng để tạo báo giá.');
    }
  }, [quoteId, dealId, initialDeal, loadDealAndQuote]);


  // Thêm dòng sản phẩm mới vào báo giá (từ danh mục hoặc nhập mới)
  const addLineItem = useCallback(
    (product?: IProductCatalogItem) => {
      if (!quote) return;
      if (quote.status !== 'draft') {
        showGlobalToast('Chỉ có thể chỉnh sửa báo giá đang ở trạng thái bản nháp.', 'warning');
        return;
      }

      const newItem: IQuoteLineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product?.id,
        productCode: product?.code || `SP-${Date.now().toString().slice(-4)}`,
        productName: product?.name || '',
        description: product?.description || '',
        quantity: 1,
        unit: product?.unit || 'Gói',
        unitPrice: product?.unitPrice ?? 0,
        floorPrice: product?.floorPrice,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        vatRate: product?.defaultVatRate || 10,
        vatAmount: 0,
        lineTotal: 0,
      };

      const calculated = quoteService.calculateLineItem(newItem);
      const updatedQuote: IQuote = {
        ...quote,
        items: [...quote.items, calculated],
        status: 'draft',
      };

      setQuote(quoteService.recalculateQuote(updatedQuote));
      setHasUnsavedChanges(true);
      showGlobalToast(`Đã thêm dòng sản phẩm "${calculated.productName}" vào báo giá`, 'info', undefined, 1800);
    },
    [quote]
  );

  // Cập nhật thông tin của một dòng sản phẩm (Số lượng, Đơn giá, Chiết khấu %, Số tiền, Thuế VAT...)
  const updateLineItem = useCallback(
    (itemId: string, updates: Partial<IQuoteLineItem>) => {
      if (!quote) return;
      if (quote.status !== 'draft') {
        showGlobalToast('Chỉ có thể chỉnh sửa báo giá đang ở trạng thái bản nháp.', 'warning');
        return;
      }

      const updatedItems = quote.items.map((item) => {
        if (item.id === itemId) {
          const merged = { ...item, ...updates };
          return quoteService.calculateLineItem(merged);
        }
        return item;
      });

      const updatedQuote: IQuote = {
        ...quote,
        items: updatedItems,
        status: 'draft',
      };

      setQuote(quoteService.recalculateQuote(updatedQuote));
      setHasUnsavedChanges(true);
    },
    [quote]
  );

  // Xóa một dòng sản phẩm khỏi báo giá
  const removeLineItem = useCallback(
    (itemId: string) => {
      if (!quote) return;
      if (quote.status !== 'draft') {
        showGlobalToast('Chỉ có thể chỉnh sửa báo giá đang ở trạng thái bản nháp.', 'warning');
        return;
      }
      if (quote.items.length <= 1) {
        showGlobalToast('Báo giá phải có ít nhất 01 dòng sản phẩm.', 'warning');
        return;
      }

      const updatedItems = quote.items.filter((item) => item.id !== itemId);
      const updatedQuote: IQuote = {
        ...quote,
        items: updatedItems,
        status: 'draft',
      };

      setQuote(quoteService.recalculateQuote(updatedQuote));
      setHasUnsavedChanges(true);
      showGlobalToast('Đã xóa dòng sản phẩm khỏi báo giá', 'info', undefined, 1500);
    },
    [quote]
  );

  // Cập nhật thông tin chung (Hiệu lực, Điều khoản thanh toán, Giao hàng, Ghi chú, Ngưỡng duyệt...)
  const updateQuoteMeta = useCallback(
    (updates: Partial<IQuote>) => {
      if (!quote) return;
      if (quote.status !== 'draft') {
        showGlobalToast('Chỉ có thể chỉnh sửa báo giá đang ở trạng thái bản nháp.', 'warning');
        return;
      }
      const updatedQuote: IQuote = {
        ...quote,
        ...updates,
        status: 'draft',
      };
      setQuote(quoteService.recalculateQuote(updatedQuote));
      setHasUnsavedChanges(true);
    },
    [quote]
  );

  // Lưu bản nháp (Lưu nháp và sửa tiếp được)
  const saveDraft = useCallback(async (): Promise<IQuote | null> => {
    if (!quote) return null;
    if (quote.status !== 'draft') {
      showGlobalToast('Chỉ có thể lưu báo giá đang ở trạng thái bản nháp.', 'warning');
      return null;
    }
    setIsSaving(true);
    try {
      const saved = quoteService.saveDraft(quote);
      quoteService.saveVersion(saved);
      if (quote.dealId) refreshVersions(quote.dealId);
      setQuote(saved);
      setHasUnsavedChanges(false);
      showGlobalToast(
        `Đã lưu bản nháp báo giá "${saved.quoteNumber}" (v${saved.version}) thành công! Dữ liệu được bảo toàn và có thể sửa tiếp bất kỳ lúc nào.`,
        'success',
        undefined,
        3000
      );
      return saved;
    } catch (err: unknown) {
      console.error('Lỗi khi lưu nháp:', err);
      showGlobalToast(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu nháp báo giá.',
        'error'
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [quote, refreshVersions]);

  // Gửi duyệt hoặc hoàn tất báo giá
  const submitQuote = useCallback(async (): Promise<IQuote | null> => {
    if (!quote) return null;
    if (quote.status !== 'draft') {
      showGlobalToast('Chỉ có thể gửi duyệt báo giá đang ở trạng thái bản nháp.', 'warning');
      return null;
    }
    const validationErrors = quoteService.validateForSubmission(quote);
    if (validationErrors.length > 0) {
      showGlobalToast(validationErrors.join(' '), 'warning', undefined, 5000);
      return null;
    }

    setIsSaving(true);
    try {
      const submitted = quoteService.submitQuote(quote);
      quoteService.saveVersion(submitted);
      if (quote.dealId) refreshVersions(quote.dealId);
      setQuote(submitted);
      setHasUnsavedChanges(false);

      if (submitted.requiresApproval) {
        const nextApprover =
          submitted.approvalLevel === 'director' ? 'Giám đốc Kinh doanh' : 'Trưởng nhóm kinh doanh';
        showGlobalToast(
          `Báo giá đã được chuyển sang trạng thái "Chờ ${nextApprover} phê duyệt".`,
          'warning',
          undefined,
          4500
        );
      } else {
        showGlobalToast(
          `Báo giá "${submitted.quoteNumber}" nằm trong ngưỡng và đã được hệ thống tự động duyệt.`,
          'success',
          undefined,
          3500
        );
      }
      return submitted;
    } catch (err: unknown) {
      console.error('Lỗi khi gửi báo giá:', err);
      showGlobalToast(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi báo giá.',
        'error'
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [quote, refreshVersions]);

  const sendQuote = useCallback(async (): Promise<IQuote | null> => {
    if (!quote) return null;
    setIsSaving(true);
    try {
      const sent = quoteService.sendApprovedQuote(
        quote.id,
        quote.createdBy,
        quote.creatorRole
      );
      quoteService.saveVersion(sent);
      if (quote.dealId) refreshVersions(quote.dealId);
      setQuote(sent);
      setHasUnsavedChanges(false);
      showGlobalToast(`Báo giá "${sent.quoteNumber}" (v${sent.version}) đã được phát hành cho khách hàng.`, 'success');
      return sent;
    } catch (err: unknown) {
      console.error('Lỗi khi phát hành báo giá:', err);
      showGlobalToast(
        err instanceof Error ? err.message : 'Không thể phát hành báo giá.',
        'error'
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [quote, refreshVersions]);

  // Đặt lại báo giá về trạng thái ban đầu kế thừa từ Deal
  const resetToInitial = useCallback(() => {
    if (!deal) return;
    if (quote && quote.status !== 'draft') {
      showGlobalToast('Chỉ có thể đặt lại báo giá đang ở trạng thái bản nháp.', 'warning');
      return;
    }
    const initial = quoteService.createInitialQuoteFromDeal(deal);
    setQuote({
      ...initial,
      id: quote?.id || initial.id,
      quoteNumber: quote?.quoteNumber || initial.quoteNumber,
      version: quote?.version || initial.version,
      createdAt: quote?.createdAt || initial.createdAt,
      status: 'draft',
    });
    setHasUnsavedChanges(true);
    showGlobalToast('Đã khôi phục các dòng sản phẩm ban đầu từ Cơ hội', 'info', undefined, 2000);
  }, [deal, quote]);

  // S7-03: Chuyển đổi xem phiên bản khác
  const switchVersion = useCallback((targetVer: IQuote) => {
    setQuote(quoteService.recalculateQuote(targetVer));
    setHasUnsavedChanges(false);
    showGlobalToast(`Đang hiển thị Phiên bản v${targetVer.version} (${targetVer.status === 'draft' ? 'Bản nháp' : targetVer.status === 'sent' ? 'Đã gửi' : 'Chỉ xem'})`, 'info', undefined, 2000);
  }, []);

  // S7-03: Tạo phiên bản mới (Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới, phiên bản cũ được giữ nguyên)
  const createNewVersion = useCallback(async (changeSummary: string): Promise<IQuote | null> => {
    if (!quote) return null;
    const summary = changeSummary.trim();
    if (!summary) {
      showGlobalToast('Vui lòng nhập lý do điều chỉnh để tạo phiên bản mới.', 'warning');
      return null;
    }

    setIsSaving(true);
    try {
      const newVersion = quoteService.createNewVersion(
        quote.id,
        summary,
        quote.createdBy,
        quote.creatorRole
      );
      if (quote.dealId) refreshVersions(quote.dealId);
      setQuote(newVersion);
      setHasUnsavedChanges(false);
      showGlobalToast(
        `Đã tạo thành công Phiên bản v${newVersion.version}! Phiên bản cũ v${quote.version} được giữ nguyên hoàn toàn.`,
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
      setIsSaving(false);
    }
  }, [quote, refreshVersions]);

  // S7-03: Đặt một phiên bản làm phiên bản đang hiệu lực (Chỉ một phiên bản ở trạng thái đang hiệu lực tại một thời điểm)
  const setEffectiveVersion = useCallback(async (versionId: string): Promise<IQuote | null> => {
    if (!deal) return null;
    try {
      const effective = quoteService.setEffectiveVersion(deal.id, versionId);
      refreshVersions(deal.id);
      if (quote && quote.id === versionId) {
        setQuote(effective);
      }
      showGlobalToast(
        `Phiên bản v${effective.version} hiện là phiên bản duy nhất đang có hiệu lực của báo giá này.`,
        'success',
        undefined,
        3500
      );
      return effective;
    } catch (err: unknown) {
      console.error('Lỗi gán phiên bản hiệu lực:', err);
      showGlobalToast(
        err instanceof Error ? err.message : 'Không thể cập nhật phiên bản hiệu lực.',
        'error'
      );
      return null;
    }
  }, [deal, quote, refreshVersions]);

  return {
    deal,
    quote,
    versions,
    loadError,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    productCatalog,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateQuoteMeta,
    saveDraft,
    submitQuote,
    sendQuote,
    resetToInitial,
    switchVersion,
    createNewVersion,
    setEffectiveVersion,
    refreshVersions,
    reload: loadDealAndQuote,
  };
}
