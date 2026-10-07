import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSalesCatalogErrorMessage,
  isSalesCatalogReferenceError,
  salesCatalogService,
} from '../services/SalesCatalogService';
import {
  ISalesCatalogFormValues,
  ISalesCatalogItem,
  SalesCatalogType,
} from '../types/SalesCatalog.types';

interface ISalesCatalogMessage {
  type: 'success' | 'error';
  text: string;
}

interface IUseSalesCatalogResult {
  activeType: SalesCatalogType;
  categories: ISalesCatalogItem[];
  error: string | null;
  isInitialLoading: boolean;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  deletingId: string | null;
  isReordering: boolean;
  message: ISalesCatalogMessage | null;
  setActiveType: (type: SalesCatalogType) => void;
  clearMessage: () => void;
  reload: () => Promise<void>;
  createCategory: (values: ISalesCatalogFormValues) => Promise<boolean>;
  updateCategory: (
    id: string,
    values: ISalesCatalogFormValues
  ) => Promise<boolean>;
  deleteCategory: (item: ISalesCatalogItem) => Promise<boolean>;
  moveCategory: (index: number, direction: 'up' | 'down') => Promise<void>;
}

const sortByOrder = (items: ISalesCatalogItem[]): ISalesCatalogItem[] =>
  [...items].sort((left, right) => left.order_index - right.order_index);

export const useSalesCatalog = (): IUseSalesCatalogResult => {
  const [activeType, setActiveType] = useState<SalesCatalogType>('industry');
  const [categories, setCategories] = useState<ISalesCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<ISalesCatalogMessage | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const requestVersion = useRef(0);
  const loadedTypes = useRef(new Set<SalesCatalogType>());
  const mutationLock = useRef(false);

  const loadCatalog = useCallback(async (type: SalesCatalogType): Promise<void> => {
    const version = ++requestVersion.current;
    setError(null);
    setMessage(null);
    setIsLoading(true);
    setIsInitialLoading(!loadedTypes.current.has(type));
    setCategories([]);

    try {
      const result = await salesCatalogService.getCatalog(type);
      if (version !== requestVersion.current) {
        return;
      }
      setCategories(sortByOrder(result));
      loadedTypes.current.add(type);
    } catch (loadError: unknown) {
      if (version === requestVersion.current) {
        setError(
          getSalesCatalogErrorMessage(loadError, 'Không thể tải danh mục. Vui lòng thử lại.')
        );
      }
    } finally {
      if (version === requestVersion.current) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCatalog(activeType);
    return () => {
      requestVersion.current += 1;
    };
  }, [activeType, loadCatalog]);

  const clearMessage = useCallback((): void => {
    setError(null);
    setMessage(null);
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    await loadCatalog(activeType);
  }, [activeType, loadCatalog]);

  const validateValues = useCallback(
    (values: ISalesCatalogFormValues): ISalesCatalogFormValues | null => {
      const normalized = {
        name: values.name.trim(),
        code: values.code.trim(),
      };
      if (!normalized.name) {
        setError('Tên danh mục là bắt buộc và không được chỉ gồm khoảng trắng.');
        return null;
      }
      if (!normalized.code) {
        setError('Mã danh mục là bắt buộc và không được chỉ gồm khoảng trắng.');
        return null;
      }
      return normalized;
    },
    []
  );

  const createCategory = useCallback(
    async (values: ISalesCatalogFormValues): Promise<boolean> => {
      const normalized = validateValues(values);
      if (
        !normalized ||
        mutationLock.current ||
        isCreating ||
        isUpdating ||
        deletingId ||
        isReordering
      ) {
        return false;
      }

      mutationLock.current = true;
      setError(null);
      setMessage(null);
      setIsCreating(true);
      try {
        const created = await salesCatalogService.createCatalog({
          ...normalized,
          type: activeType,
          order_index:
            Math.max(-1, ...categories.map(({ order_index }) => order_index)) + 1,
        });
        setCategories((current) => sortByOrder([...current, created]));
        setMessage({ type: 'success', text: 'Đã thêm danh mục thành công.' });
        return true;
      } catch (createError: unknown) {
        setError(
          getSalesCatalogErrorMessage(
            createError,
            'Không thể tạo danh mục. Vui lòng kiểm tra dữ liệu và thử lại.'
          )
        );
        return false;
      } finally {
        mutationLock.current = false;
        setIsCreating(false);
      }
    },
    [activeType, categories, deletingId, isCreating, isReordering, isUpdating, validateValues]
  );

  const updateCategory = useCallback(
    async (id: string, values: ISalesCatalogFormValues): Promise<boolean> => {
      const normalized = validateValues(values);
      if (
        !normalized ||
        mutationLock.current ||
        isCreating ||
        isUpdating ||
        deletingId ||
        isReordering
      ) {
        return false;
      }

      mutationLock.current = true;
      setError(null);
      setMessage(null);
      setIsUpdating(true);
      try {
        const updated = await salesCatalogService.updateCatalog(id, normalized);
        setCategories((current) =>
          current.map((category) => (category.id === id ? updated : category))
        );
        setMessage({ type: 'success', text: 'Đã cập nhật danh mục thành công.' });
        return true;
      } catch (updateError: unknown) {
        setError(
          getSalesCatalogErrorMessage(
            updateError,
            'Không thể cập nhật danh mục. Vui lòng kiểm tra dữ liệu và thử lại.'
          )
        );
        return false;
      } finally {
        mutationLock.current = false;
        setIsUpdating(false);
      }
    },
    [deletingId, isCreating, isReordering, isUpdating, validateValues]
  );

  const deleteCategory = useCallback(
    async (item: ISalesCatalogItem): Promise<boolean> => {
      if (item.usage_count > 0) {
        setError(
          `Không thể xóa “${item.name}” vì đang được tham chiếu (${item.usage_count}).`
        );
        return false;
      }
      if (
        mutationLock.current ||
        isCreating ||
        isUpdating ||
        deletingId ||
        isReordering
      ) {
        return false;
      }

      mutationLock.current = true;
      setError(null);
      setMessage(null);
      setDeletingId(item.id);
      try {
        await salesCatalogService.deleteCatalog(item.id);
        setCategories((current) => current.filter(({ id }) => id !== item.id));
        setMessage({ type: 'success', text: 'Đã xóa danh mục thành công.' });
        return true;
      } catch (deleteError: unknown) {
        setError(
          isSalesCatalogReferenceError(deleteError)
            ? `Không thể xóa “${item.name}” vì danh mục đang được tham chiếu.`
            : getSalesCatalogErrorMessage(
                deleteError,
                'Không thể xóa danh mục. Vui lòng thử lại.'
              )
        );
        return false;
      } finally {
        mutationLock.current = false;
        setDeletingId(null);
      }
    },
    [deletingId, isCreating, isReordering, isUpdating]
  );

  const moveCategory = useCallback(
    async (index: number, direction: 'up' | 'down'): Promise<void> => {
      if (
        mutationLock.current ||
        isCreating ||
        isUpdating ||
        deletingId ||
        isReordering
      ) {
        return;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= categories.length) {
        return;
      }

      const previous = categories;
      const reordered = [...categories];
      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];
      setCategories(reordered);
      mutationLock.current = true;
      setError(null);
      setMessage(null);
      setIsReordering(true);

      try {
        await salesCatalogService.reorderCatalog(reordered.map(({ id }) => id));
        setCategories(
          reordered.map((category, order_index) => ({ ...category, order_index }))
        );
        setMessage({ type: 'success', text: 'Đã lưu thứ tự danh mục.' });
      } catch (reorderError: unknown) {
        setCategories(previous);
        setError(
          getSalesCatalogErrorMessage(
            reorderError,
            'Không thể lưu thứ tự danh mục. Thứ tự cũ đã được khôi phục.'
          )
        );
      } finally {
        mutationLock.current = false;
        setIsReordering(false);
      }
    },
    [categories, deletingId, isCreating, isReordering, isUpdating]
  );

  return {
    activeType,
    categories,
    error,
    isInitialLoading,
    isLoading,
    isCreating,
    isUpdating,
    deletingId,
    isReordering,
    message,
    setActiveType,
    clearMessage,
    reload,
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
  };
};
