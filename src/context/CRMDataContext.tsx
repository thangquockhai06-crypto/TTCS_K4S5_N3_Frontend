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
import {
  CONTRACT_DEAL_UPDATED_EVENT,
  IContractDealUpdate,
} from '../interfaces/deal.interface';
import { MOCK_CUSTOMERS } from '../mock/customers';
import { INITIAL_NOTIFICATIONS } from '../mock/dashboard.mock';
import { INITIAL_DEALS } from '../mock/deals';
import { createAvatarSvgDataUri, toLocalDateInputValue } from '../utils/formatters';
import { showGlobalToast } from './ToastContext';

const DEALS_OVERRIDE_STORAGE_KEY = 'nexus_deals_override';

function isContractDealUpdate(value: unknown): value is IContractDealUpdate {
  if (typeof value !== 'object' || value === null) return false;
  const update = value as Partial<IContractDealUpdate>;
  return (
    typeof update.dealId === 'string' &&
    update.stage === 'Won' &&
    typeof update.value === 'number' &&
    Number.isFinite(update.value) &&
    update.probability === 100 &&
    typeof update.closeDate === 'string'
  );
}

function readDealOverrides(): Record<string, Omit<IContractDealUpdate, 'dealId'>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DEALS_OVERRIDE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Định dạng dữ liệu đồng bộ cơ hội không hợp lệ.');
    }

    const overrides: Record<string, Omit<IContractDealUpdate, 'dealId'>> = {};
    Object.entries(parsed).forEach(([dealId, value]) => {
      if (typeof value !== 'object' || value === null) return;
      const update = value as Partial<Omit<IContractDealUpdate, 'dealId'>>;
      if (
        update.stage === 'Won' &&
        typeof update.value === 'number' &&
        Number.isFinite(update.value) &&
        update.probability === 100 &&
        typeof update.closeDate === 'string'
      ) {
        overrides[dealId] = {
          stage: update.stage,
          value: update.value,
          probability: update.probability,
          closeDate: update.closeDate,
        };
      }
    });
    return overrides;
  } catch (error: unknown) {
    console.error('Không thể đọc dữ liệu đồng bộ cơ hội đã lưu:', error);
    return {};
  }
}

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
  const [deals, setDeals] = useState<IDeal[]>(() => {
    const overrides = readDealOverrides();
    return INITIAL_DEALS.map((deal) => {
      const override = overrides[deal.id];
      return override
        ? {
            ...deal,
            stage: override.stage,
            value: override.value,
            actualValue: override.value,
            probability: override.probability,
            closeDate: override.closeDate,
          }
        : deal;
    });
  });
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

  useEffect(() => {
    const handleContractDealUpdate = (event: Event): void => {
      if (!(event instanceof CustomEvent)) return;
      const detail: unknown = (event as CustomEvent<unknown>).detail;
      if (!isContractDealUpdate(detail)) return;
      const update = detail;
      setDeals((previous) =>
        previous.map((deal) =>
          deal.id === update.dealId
            ? {
                ...deal,
                stage: update.stage,
                value: update.value,
                actualValue: update.value,
                probability: update.probability,
                closeDate: update.closeDate,
              }
            : deal
        )
      );
    };

    window.addEventListener(CONTRACT_DEAL_UPDATED_EVENT, handleContractDealUpdate);
    return () => window.removeEventListener(CONTRACT_DEAL_UPDATED_EVENT, handleContractDealUpdate);
  }, []);

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
      createdAt: toLocalDateInputValue(),
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
    showGlobalToast(`Đã thêm mới khách hàng "${dto.company}" (${dto.fullName}) thành công!`, 'success');
    return newCustomer;
  }, []);

  const updateCustomerStatus = useCallback(
    (customerId: string, status: ICustomer['status']): void => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status, lastContactedAt: 'Vừa xong' } : c))
      );
      showGlobalToast(`Đã cập nhật trạng thái khách hàng sang "${status}".`, 'success');
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
      showGlobalToast('Đã thêm ghi chú mới cho khách hàng thành công.', 'success');
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
      showGlobalToast(`Đã thêm hoạt động mới: "${title}".`, 'success');
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
    showGlobalToast(`Đã chuyển giai đoạn cơ hội sang "${newStage}".`, 'success');
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
      showGlobalToast(`Đã thêm mới cơ hội bán hàng "${newDeal.title}" thành công!`, 'success');
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
