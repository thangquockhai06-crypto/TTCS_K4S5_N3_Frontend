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
  initialDeal?: IDeal | null;
}

export function useQuoteBuilder({ dealId, initialDeal }: IUseQuoteBuilderOptions) {
  const [deal, setDeal] = useState<IDeal | null>(initialDeal || null);
  const [quote, setQuote] = useState<IQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const productCatalog: IProductCatalogItem[] = useMemo(() => {
    return quoteService.getProductCatalog();
  }, []);

  // Tải thông tin Deal và nạp Báo giá (kế thừa từ Deal hoặc nạp từ bản nháp đã lưu)
  const loadDealAndQuote = useCallback(async (targetDealId: string) => {
    setIsLoading(true);
    setLoadError(null);
    setQuote(null);
    try {
      // 1. Kiểm tra xem đã có bản nháp lưu trong localStorage chưa
      const existingDraft = quoteService.getDraftByDealId(targetDealId);

      // 2. Tải thông tin Deal
      let resolvedDeal: IDeal | null = initialDeal?.id === targetDealId ? initialDeal : null;
      if (!resolvedDeal) {
        try {
          resolvedDeal = await dealService.getDeal(targetDealId);
        } catch (apiError: unknown) {
          const mockDeal = INITIAL_DEALS.find((candidate) => candidate.id === targetDealId);
          if (!mockDeal) {
            throw apiError;
          }
          resolvedDeal = mockDeal;
          showGlobalToast(
            'Không kết nối được API cơ hội; đang sử dụng dữ liệu mẫu cho cơ hội này.',
            'warning'
          );
        }
      }

      if (!resolvedDeal) {
        throw new Error('Không tìm thấy cơ hội bán hàng để tạo báo giá.');
      }

      setDeal(resolvedDeal);

      if (existingDraft) {
        // Có bản nháp trước đó -> nạp lại để sửa tiếp
        setQuote(quoteService.recalculateQuote(existingDraft));
        setHasUnsavedChanges(false);
      } else if (resolvedDeal) {
        // Chưa có bản nháp -> Khởi tạo mới kế thừa dòng sản phẩm từ Deal
        const initialQuote = quoteService.createInitialQuoteFromDeal(resolvedDeal);
        setQuote(initialQuote);
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
    const targetDealId = dealId || initialDeal?.id || INITIAL_DEALS[0]?.id;
    if (targetDealId) {
      void loadDealAndQuote(targetDealId);
    } else {
      setIsLoading(false);
      setLoadError('Không có cơ hội bán hàng để tạo báo giá.');
    }
  }, [dealId, initialDeal, loadDealAndQuote]);

  // Thêm dòng sản phẩm mới vào báo giá (từ danh mục hoặc nhập mới)
  const addLineItem = useCallback(
    (product?: IProductCatalogItem) => {
      if (!quote) return;

      const newItem: IQuoteLineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product?.id,
        productCode: product?.code || `SP-${Date.now().toString().slice(-4)}`,
        productName: product?.name || '',
        description: product?.description || '',
        quantity: 1,
        unit: product?.unit || 'Gói',
        unitPrice: product?.unitPrice ?? 0,
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
    setIsSaving(true);
    try {
      const saved = quoteService.saveDraft(quote);
      setQuote(saved);
      setHasUnsavedChanges(false);
      showGlobalToast(
        `Đã lưu bản nháp báo giá "${saved.quoteNumber}" thành công! Dữ liệu được bảo toàn và có thể sửa tiếp bất kỳ lúc nào.`,
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
  }, [quote]);

  // Gửi duyệt hoặc hoàn tất báo giá
  const submitQuote = useCallback(async (): Promise<IQuote | null> => {
    if (!quote) return null;
    const validationErrors = quoteService.validateForSubmission(quote);
    if (validationErrors.length > 0) {
      showGlobalToast(validationErrors.join(' '), 'warning', undefined, 5000);
      return null;
    }

    setIsSaving(true);
    try {
      const submitted = quoteService.submitQuote(quote);
      setQuote(submitted);
      setHasUnsavedChanges(false);

      if (submitted.requiresApproval) {
        showGlobalToast(
          `CẢNH BÁO: Mức chiết khấu (${submitted.totalDiscountPercent}%) đã đạt hoặc vượt ngưỡng ${submitted.discountThresholdPercent}%. Báo giá đã được chuyển sang trạng thái "Chờ Giám đốc Kinh doanh phê duyệt"!`,
          'warning',
          undefined,
          4500
        );
      } else {
        showGlobalToast(
          `Báo giá "${submitted.quoteNumber}" hợp lệ và đã sẵn sàng gửi cho khách hàng!`,
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
  }, [quote]);

  // Đặt lại báo giá về trạng thái ban đầu kế thừa từ Deal
  const resetToInitial = useCallback(() => {
    if (!deal) return;
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

  return {
    deal,
    quote,
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
    resetToInitial,
    reload: loadDealAndQuote,
  };
}
