import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CreateCustomerDTO,
  DealStageType,
  IAppearanceSettings,
  ICustomer,
  ICustomerActivity,
  ICustomerNote,
  IDeal,
  INotificationItem,
} from '../interfaces';
import { MOCK_CUSTOMERS } from '../mock/customers';
import { INITIAL_NOTIFICATIONS } from '../mock/dashboard.mock';
import { INITIAL_DEALS } from '../mock/deals';
import { createAvatarSvgDataUri } from '../utils/formatters';

export interface ICRMDataContext {
  customers: ICustomer[];
  deals: IDeal[];
  notifications: INotificationItem[];
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
  markAllNotificationsRead: () => void;
  updateAppearance: (partial: Partial<IAppearanceSettings>) => void;
}

const CRMDataContext = createContext<ICRMDataContext | undefined>(undefined);

interface ICRMDataProviderProps {
  children: React.ReactNode;
}

export const CRMDataProvider: React.FC<ICRMDataProviderProps> = ({ children }) => {
  const [customers, setCustomers] = useState<ICustomer[]>(() => MOCK_CUSTOMERS);
  const [deals, setDeals] = useState<IDeal[]>(() => INITIAL_DEALS);
  const [notifications, setNotifications] = useState<INotificationItem[]>(
    () => [...INITIAL_NOTIFICATIONS]
  );
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

  const markAllNotificationsRead = useCallback((): void => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const updateAppearance = useCallback((partial: Partial<IAppearanceSettings>): void => {
    setAppearance((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo<ICRMDataContext>(
    () => ({
      customers,
      deals,
      notifications,
      appearance,
      addCustomer,
      updateCustomerStatus,
      addCustomerNote,
      addCustomerActivity,
      moveDealStage,
      addDeal,
      markAllNotificationsRead,
      updateAppearance,
    }),
    [
      customers,
      deals,
      notifications,
      appearance,
      addCustomer,
      updateCustomerStatus,
      addCustomerNote,
      addCustomerActivity,
      moveDealStage,
      addDeal,
      markAllNotificationsRead,
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
