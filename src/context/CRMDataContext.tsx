import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CreateCustomerDTO,
  DealStageType,
  IAppearanceSettings,
  ICustomer,
  ICustomerActivity,
  ICustomerNote,
  IDeal,
} from '../interfaces';
import { MOCK_CUSTOMERS } from '../mock/customers';
import { INITIAL_DEALS } from '../mock/deals';
import { createAvatarSvgDataUri } from '../utils/formatters';
import { INotificationItem } from '../interfaces/documents.interface';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

export interface ICRMDataContext {
  customers: ICustomer[];
  deals: IDeal[];
  notifications: INotificationItem[];
  unreadNotificationCount: number;
  notificationsError: string | null;
  appearance: IAppearanceSettings;
  addCustomer: (dto: CreateCustomerDTO) => ICustomer;
  updateCustomerStatus: (customerId: string, status: ICustomer['status']) => void;
  addCustomerNote: (customerId: string, content: string, authorName: string) => void;
  addCustomerActivity: (
    customerId: string,
    title: string,
    description: string,
    type: ICustomerActivity['type'],
    authorName: string
  ) => void;
  moveDealStage: (dealId: string, newStage: DealStageType) => void;
  addDeal: (newDeal: Omit<IDeal, 'id' | 'companyAvatar' | 'ownerAvatar' | 'daysInStage'>) => void;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updateAppearance: (partial: Partial<IAppearanceSettings>) => void;
}

const CRMDataContext = createContext<ICRMDataContext | undefined>(undefined);

interface ICRMDataProviderProps {
  children: React.ReactNode;
}

export const CRMDataProvider: React.FC<ICRMDataProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>(() => MOCK_CUSTOMERS);
  const [deals, setDeals] = useState<IDeal[]>(() => INITIAL_DEALS);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const notificationRequestId = useRef(0);
  const [appearance, setAppearance] = useState<IAppearanceSettings>({
    theme: 'light',
    density: 'comfortable',
    accentColor: '#2563EB',
    reducedMotion: false,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance.theme);
    document.documentElement.setAttribute('data-density', appearance.density);
    document.documentElement.style.setProperty('--color-primary', appearance.accentColor);
  }, [appearance]);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      setNotificationsError(null);
      return;
    }

    const requestId = ++notificationRequestId.current;
    try {
      const response = await notificationService.getNotifications();
      if (requestId !== notificationRequestId.current) return;
      setNotifications(response.items);
      setUnreadNotificationCount(response.unreadCount);
      setNotificationsError(null);
    } catch (error) {
      if (requestId !== notificationRequestId.current) return;
      console.error('Không thể tải thông báo từ máy chủ.', error);
      setNotificationsError('Không thể tải thông báo. Vui lòng thử lại.');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      notificationRequestId.current += 1;
      setNotifications([]);
      setUnreadNotificationCount(0);
      setNotificationsError(null);
      return;
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30_000);
    return () => {
      window.clearInterval(intervalId);
      notificationRequestId.current += 1;
    };
  }, [isAuthenticated, refreshNotifications]);

  const addCustomer = useCallback((dto: CreateCustomerDTO): ICustomer => {
    const newId = `cust-${String(Date.now()).slice(-4)}`;
    const ownerName = dto.ownerName || 'Quản Trị Viên Hệ Thống';
    const newCustomer: ICustomer = {
      id: newId,
      fullName: dto.fullName,
      role: dto.role,
      email: dto.email,
      phone: dto.phone,
      avatarUrl: createAvatarSvgDataUri(dto.fullName, Math.floor(Math.random() * 8)),
      company: dto.company,
      companyDomain: dto.companyDomain || `${dto.company.toLowerCase().replace(/\s+/g, '')}.com`,
      industry: dto.industry,
      location: dto.location,
      tier: dto.tier,
      status: dto.status,
      dealValue: dto.dealValue,
      arrProbability: dto.status === 'Active' ? 95 : dto.status === 'Negotiation' ? 75 : 50,
      healthScore: 90,
      tags: dto.tags.length > 0 ? dto.tags : ['Khách hàng mới', dto.tier],
      owner: {
        id: 'own-01',
        name: ownerName,
        avatarUrl: createAvatarSvgDataUri(ownerName, 0),
        email: 'admin@nexuscrm.vn',
      },
      createdAt: new Date().toISOString().slice(0, 10),
      lastContactedAt: 'Vừa xong',
      nextFollowUp: '15/10/2026',
      summary:
        dto.summary ||
        `${dto.company} được khởi tạo ở phân khúc ${dto.tier} trong lĩnh vực ${dto.industry}. Người liên hệ chính: ${dto.fullName}.`,
      activities: [
        {
          id: `${newId}-act-init`,
          customerId: newId,
          customerName: dto.fullName,
          companyName: dto.company,
          type: 'deal_update',
          title: `Khởi tạo hồ sơ khách hàng & phân công cho ${ownerName}`,
          description: `Giá trị hợp đồng dự kiến ban đầu được thiết lập ở mức $${dto.dealValue.toLocaleString()} ARR.`,
          timestamp: new Date().toISOString(),
          relativeTime: 'Vừa xong',
          performedBy: {
            name: ownerName,
            avatarUrl: createAvatarSvgDataUri(ownerName, 0),
            role: 'Quản trị viên',
          },
        },
      ],
      notes: [],
      files: [],
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  }, []);

  const updateCustomerStatus = useCallback(
    (customerId: string, status: ICustomer['status']): void => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status, lastContactedAt: 'Vừa xong' } : c))
      );
    },
    []
  );

  const addCustomerNote = useCallback(
    (customerId: string, content: string, authorName: string): void => {
      const newNote: ICustomerNote = {
        id: `note-${Date.now()}`,
        authorName,
        authorAvatar: createAvatarSvgDataUri(authorName, 1),
        createdAt: 'Vừa xong',
        content,
        isPinned: false,
      };
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, notes: [newNote, ...c.notes], lastContactedAt: 'Vừa xong' }
            : c
        )
      );
    },
    []
  );

  const addCustomerActivity = useCallback(
    (
      customerId: string,
      title: string,
      description: string,
      type: ICustomerActivity['type'],
      authorName: string
    ): void => {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== customerId) return c;
          const nextActivity: ICustomerActivity = {
            id: `act-${Date.now()}`,
            customerId,
            customerName: c.fullName,
            companyName: c.company,
            type,
            title,
            description,
            timestamp: new Date().toISOString(),
            relativeTime: 'Vừa xong',
            performedBy: {
              name: authorName,
              avatarUrl: createAvatarSvgDataUri(authorName, 0),
              role: 'Quản trị viên',
            },
          };
          return {
            ...c,
            lastContactedAt: 'Vừa xong',
            activities: [nextActivity, ...c.activities],
          };
        })
      );
    },
    []
  );

  const moveDealStage = useCallback((dealId: string, newStage: DealStageType): void => {
    const stageProbabilities: Record<DealStageType, number> = {
      New: 35,
      Contacted: 60,
      Negotiation: 82,
      Won: 100,
    };

    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage: newStage,
              probability: stageProbabilities[newStage],
              daysInStage: 1,
            }
          : deal
      )
    );
  }, []);

  const addDeal = useCallback(
    (newDeal: Omit<IDeal, 'id' | 'companyAvatar' | 'ownerAvatar' | 'daysInStage'>): void => {
      const created: IDeal = {
        ...newDeal,
        id: `deal-${Date.now()}`,
        companyAvatar: createAvatarSvgDataUri(newDeal.company, 2),
        ownerAvatar: createAvatarSvgDataUri(newDeal.ownerName, 0),
        daysInStage: 1,
      };
      setDeals((prev) => [created, ...prev]);
    },
    []
  );

  const markAllNotificationsRead = useCallback(async (): Promise<void> => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
      setNotificationsError(null);
    } catch (error) {
      console.error('Không thể đánh dấu thông báo đã đọc.', error);
      setNotificationsError('Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.');
    }
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const updated = await notificationService.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, isRead: true } : item))
      );
      if (notifications.some((item) => item.id === updated.id && !item.isRead)) {
        setUnreadNotificationCount((count) => Math.max(0, count - 1));
      }
      setNotificationsError(null);
    } catch (error) {
      console.error('Không thể đánh dấu thông báo đã đọc.', error);
      setNotificationsError('Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.');
    }
  }, [notifications]);

  const updateAppearance = useCallback((partial: Partial<IAppearanceSettings>): void => {
    setAppearance((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo<ICRMDataContext>(
    () => ({
      customers,
      deals,
      notifications,
      unreadNotificationCount,
      notificationsError,
      appearance,
      addCustomer,
      updateCustomerStatus,
      addCustomerNote,
      addCustomerActivity,
      moveDealStage,
      addDeal,
      markAllNotificationsRead,
      markNotificationRead,
      refreshNotifications,
      updateAppearance,
    }),
    [
      customers,
      deals,
      notifications,
      unreadNotificationCount,
      notificationsError,
      appearance,
      addCustomer,
      updateCustomerStatus,
      addCustomerNote,
      addCustomerActivity,
      moveDealStage,
      addDeal,
      markAllNotificationsRead,
      markNotificationRead,
      refreshNotifications,
      updateAppearance,
    ]
  );

  return <CRMDataContext.Provider value={value}>{children}</CRMDataContext.Provider>;
};

export function useCRMData(): ICRMDataContext {
  const ctx = useContext(CRMDataContext);
  if (!ctx) {
    throw new Error('useCRMData must be used inside a CRMDataProvider');
  }
  return ctx;
}
