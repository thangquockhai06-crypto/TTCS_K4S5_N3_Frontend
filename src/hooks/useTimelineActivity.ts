import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ITimelineItem,
  ITimelineFilterState,
  ICreateTimelineItemDTO,
  ITimelineHandoverBrief,
  ITimelinePerformer,
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
  initialPageSize = 6,
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

  // Cơ chế cuộn vô hạn (Infinite Scroll): số lượng item đang hiển thị
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

  // Reset số lượng hiển thị khi đổi bộ lọc
  useEffect(() => {
    setVisibleCount(initialPageSize);
  }, [filters, initialPageSize]);

  // Lọc danh sách theo các tiêu chí (Loại hoạt động & Người thực hiện & Từ khóa)
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Lọc theo loại hoạt động
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }

      // 2. Lọc theo người thực hiện
      if (filters.performerId !== 'all') {
        if (item.performer.id !== filters.performerId && item.performer.name !== filters.performerId) {
          return false;
        }
      }

      // 3. Tìm kiếm theo từ khóa
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const searchTarget = `${item.title} ${item.description || ''} ${item.performer.name} ${item.typeLabel}`.toLowerCase();
        if (!searchTarget.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, filters]);

  // Các mục hiển thị hiện tại phục vụ cuộn vô hạn
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Còn dữ liệu để cuộn tiếp không
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
    // Giả lập tải bất đồng bộ mượt mà (smooth async loading)
    window.setTimeout(() => {
      setVisibleCount((prev) => prev + initialPageSize);
      setIsLoadingMore(false);
    }, 280);
  }, [isLoadingMore, hasMore, initialPageSize]);

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
              nextPinned ? 'Đã ghim tương tác lên đầu dòng thời gian' : 'Đã bỏ ghim tương tác',
              'info',
              undefined,
              2000
            );
            return { ...item, isPinned: nextPinned };
          }
          return item;
        });
        // Sắp xếp lại sau khi ghim
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
  }, []);

  return {
    allItems,
    filteredItems,
    visibleItems,
    hasMore,
    isLoadingMore,
    totalCount: filteredItems.length,
    visibleCount,
    filters,
    availablePerformers,
    handoverBrief,
    loadMore,
    addTouchpoint,
    togglePin,
    setTypeFilter,
    setPerformerFilter,
    setSearchQuery,
    resetFilters,
    reload,
  };
}
