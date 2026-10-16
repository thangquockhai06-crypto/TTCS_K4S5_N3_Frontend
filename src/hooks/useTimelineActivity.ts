import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ITimelineItem,
  ITimelineFilterState,
  ICreateTimelineItemDTO,
  ITimelineHandoverBrief,
  ITimelinePerformer,
  ITimelinePaginationState,
  TimelineItemType,
} from '../interfaces/timeline.interface';
import { ICustomer360 } from '../interfaces/customer.interface';
import { timelineService } from '../services/timelineService';
import { showGlobalToast } from '../context/ToastContext';

interface IUseTimelineActivityOptions {
  customerId: string;
  customer360?: ICustomer360 | null;
  initialPageSize?: number;
}

export function useTimelineActivity({
  customerId,
  customer360,
  initialPageSize = 5,
}: IUseTimelineActivityOptions) {
  // Toàn bộ danh sách tương tác tổng hợp
  const [allItems, setAllItems] = useState<ITimelineItem[]>(() =>
    timelineService.getTimeline(customerId, customer360)
  );

  // Bộ lọc tương tác (loại hoạt động, người thực hiện, tìm kiếm từ khóa)
  const [filters, setFilters] = useState<ITimelineFilterState>({
    type: 'all',
    performerId: 'all',
    searchQuery: '',
  });

  // Phân trang chuẩn (Pagination)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Cơ chế cuộn vô hạn (Infinite Scroll fallback): số lượng item đang hiển thị
  const [visibleCount, setVisibleCount] = useState<number>(initialPageSize);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Tải lại dữ liệu khi customerId hoặc customer360 thay đổi
  const reload = useCallback(() => {
    if (!customerId) return;
    const items = timelineService.getTimeline(customerId, customer360);
    setAllItems(items);
  }, [customerId, customer360]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Reset trang và số lượng hiển thị khi đổi bộ lọc hoặc từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(pageSize);
  }, [filters, pageSize]);

  // Lọc danh sách theo các tiêu chí (Loại hoạt động & Người thực hiện & Từ khóa)
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Lọc theo loại hoạt động
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }

      // 2. Lọc theo người thực hiện
      if (filters.performerId !== 'all') {
        if (
          item.performer.id !== filters.performerId &&
          item.performer.name !== filters.performerId
        ) {
          return false;
        }
      }

      // 3. Tìm kiếm theo từ khóa đa trường
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const searchTarget = [
          item.title,
          item.description || '',
          item.performer.name,
          item.performer.role,
          item.typeLabel,
          item.metadata?.nextAction || '',
          item.metadata?.outcomeLabel || '',
          item.metadata?.attachmentName || '',
          item.metadata?.quoteNumber || '',
          item.metadata?.ticketId || '',
          item.metadata?.newStage || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!searchTarget.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, filters]);

  // Tổng số trang tính theo phân trang
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / pageSize));
  }, [filteredItems.length, pageSize]);

  // Đảm bảo currentPage không vượt quá totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Danh sách các mục cho trang hiện tại (Paginated Items)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Thông số phân trang chi tiết
  const pagination: ITimelinePaginationState = useMemo(() => {
    const totalItems = filteredItems.length;
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
    };
  }, [currentPage, pageSize, totalPages, filteredItems.length]);

  // Các mục hiển thị cho cơ chế cuộn vô hạn (backward compatibility)
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMore = useMemo(() => {
    return visibleCount < filteredItems.length;
  }, [visibleCount, filteredItems.length]);

  // Danh sách người thực hiện cho bộ lọc dropdown
  const availablePerformers: ITimelinePerformer[] = useMemo(() => {
    return timelineService.getAvailablePerformers(allItems);
  }, [allItems]);

  // Bảng tóm tắt bối cảnh bàn giao trong 5 phút
  const handoverBrief: ITimelineHandoverBrief = useMemo(() => {
    return timelineService.getHandoverBrief(customerId, allItems, customer360);
  }, [customerId, allItems, customer360]);

  // Hàm tải thêm tương tác (cuộn vô hạn)
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisibleCount((prev) => prev + pageSize);
      setIsLoadingMore(false);
    }, 280);
  }, [isLoadingMore, hasMore, pageSize]);

  // Các hàm điều hướng phân trang
  const goToPage = useCallback(
    (page: number) => {
      const target = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(target);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Thêm mới một lần chạm khách hàng
  const addTouchpoint = useCallback(
    (dto: ICreateTimelineItemDTO) => {
      const created = timelineService.addTouchpoint(customerId, dto);
      setAllItems((prev) => [created, ...prev]);
      showGlobalToast(
        `Đã ghi nhận tương tác mới "${dto.title}" thành công!`,
        'success',
        undefined,
        2800
      );
      return created;
    },
    [customerId]
  );

  // Ghim / Bỏ ghim tương tác quan trọng
  const togglePin = useCallback(
    (itemId: string) => {
      timelineService.togglePin(customerId, itemId);
      setAllItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id === itemId) {
            const nextPinned = !item.isPinned;
            showGlobalToast(
              nextPinned
                ? 'Đã ghim tương tác lên đầu dòng thời gian'
                : 'Đã bỏ ghim tương tác',
              'info',
              undefined,
              2000
            );
            return { ...item, isPinned: nextPinned };
          }
          return item;
        });
        return [...updated].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      });
    },
    [customerId]
  );

  // Cập nhật bộ lọc
  const setTypeFilter = useCallback((type: TimelineItemType | 'all') => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const setPerformerFilter = useCallback((performerId: string) => {
    setFilters((prev) => ({ ...prev, performerId }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      performerId: 'all',
      searchQuery: '',
    });
    setCurrentPage(1);
  }, []);

  return {
    allItems,
    filteredItems,
    paginatedItems,
    visibleItems,
    hasMore,
    isLoadingMore,
    totalCount: filteredItems.length,
    visibleCount,
    filters,
    pagination,
    currentPage,
    pageSize,
    totalPages,
    availablePerformers,
    handoverBrief,
    loadMore,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    addTouchpoint,
    togglePin,
    setTypeFilter,
    setPerformerFilter,
    setSearchQuery,
    resetFilters,
    reload,
  };
}
