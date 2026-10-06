import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateContactDTO,
  IContact,
  IContactFilterState,
  IContactStats,
  IContactTransferHistory,
  TransferContactDTO,
  UpdateContactDTO,
} from '../interfaces/contact.interface';
import { contactService } from '../services/contactService';
import { useCRMData } from '../context/CRMDataContext';

const DEFAULT_FILTER_STATE: IContactFilterState = {
  searchQuery: '',
  customerId: 'all',
  roleInBuying: 'all',
  isPrimary: 'all',
  influenceLevel: 'all',
  sortField: 'fullName',
  sortDirection: 'asc',
  viewMode: 'grid',
};

export function useContacts(initialCustomerId?: string) {
  const { customers } = useCRMData();
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<IContactFilterState>({
    ...DEFAULT_FILTER_STATE,
    customerId: initialCustomerId || 'all',
  });

  const loadContacts = useCallback(() => {
    setIsLoading(true);
    try {
      const data = contactService.getAll();
      setContacts(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Filter by Customer
    if (filterState.customerId !== 'all') {
      result = result.filter((c) => c.customerId === filterState.customerId);
    }

    // Filter by Role in Buying
    if (filterState.roleInBuying !== 'all') {
      result = result.filter((c) => c.roleInBuying === filterState.roleInBuying);
    }

    // Filter by Primary status
    if (filterState.isPrimary === 'primary') {
      result = result.filter((c) => c.isPrimary);
    } else if (filterState.isPrimary === 'secondary') {
      result = result.filter((c) => !c.isPrimary);
    }

    // Filter by Influence Level
    if (filterState.influenceLevel !== 'all') {
      result = result.filter((c) => c.influenceLevel === filterState.influenceLevel);
    }

    // Filter by Search Query
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(query) ||
          c.jobTitle.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.companyName.toLowerCase().includes(query) ||
          c.department.toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (filterState.sortField === 'fullName') {
        comparison = a.fullName.localeCompare(b.fullName, 'vi');
      } else if (filterState.sortField === 'companyName') {
        comparison = a.companyName.localeCompare(b.companyName, 'vi');
      } else if (filterState.sortField === 'jobTitle') {
        comparison = a.jobTitle.localeCompare(b.jobTitle, 'vi');
      } else if (filterState.sortField === 'roleInBuying') {
        comparison = a.roleInBuying.localeCompare(b.roleInBuying);
      } else if (filterState.sortField === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return filterState.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contacts, filterState]);

  const stats: IContactStats = useMemo(() => {
    return contactService.getStats(filterState.customerId);
  }, [contacts, filterState.customerId]);

  const addContact = useCallback(
    (dto: CreateContactDTO): IContact => {
      const cust = customers.find((c) => c.id === dto.customerId);
      const customerName = cust ? cust.fullName : 'Khách hàng';
      const companyName = cust ? cust.company : 'Doanh nghiệp';

      const newContact = contactService.create(dto, customerName, companyName);
      loadContacts();
      return newContact;
    },
    [customers, loadContacts]
  );

  const updateContact = useCallback(
    (id: string, dto: UpdateContactDTO): IContact => {
      const updated = contactService.update(id, dto);
      loadContacts();
      return updated;
    },
    [loadContacts]
  );

  const deleteContact = useCallback(
    (id: string): boolean => {
      const success = contactService.delete(id);
      if (success) {
        loadContacts();
      }
      return success;
    },
    [loadContacts]
  );

  const setPrimaryContact = useCallback(
    (contactId: string, customerId: string): void => {
      contactService.setPrimary(contactId, customerId);
      loadContacts();
    },
    [loadContacts]
  );

  const transferContact = useCallback(
    (dto: TransferContactDTO): IContact => {
      const newCust = customers.find((c) => c.id === dto.newCustomerId);
      const newCustomerName = newCust ? newCust.fullName : 'Khách hàng mới';
      const newCompanyName = newCust ? newCust.company : 'Công ty mới';

      const updated = contactService.transferContact(dto, newCustomerName, newCompanyName);
      loadContacts();
      return updated;
    },
    [customers, loadContacts]
  );

  const getContactHistory = useCallback((contactId: string): IContactTransferHistory[] => {
    return contactService.getTransferHistory(contactId);
  }, []);

  const resetData = useCallback(() => {
    contactService.resetToMock();
    loadContacts();
  }, [loadContacts]);

  return {
    contacts: filteredContacts,
    allContacts: contacts,
    customers,
    stats,
    isLoading,
    filterState,
    setFilterState,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    transferContact,
    getContactHistory,
    resetData,
    refresh: loadContacts,
  };
}
