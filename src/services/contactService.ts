import {
  CreateContactDTO,
  IContact,
  IContactStats,
  IContactTransferHistory,
  TransferContactDTO,
  UpdateContactDTO,
} from '../interfaces/contact.interface';
import { INITIAL_CONTACTS } from '../mock/contacts.mock';
import { createAvatarSvgDataUri } from '../utils/formatters';

const STORAGE_KEY = 'nexus_crm_contacts_data_v1';

class ContactService {
  private contacts: IContact[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.contacts = JSON.parse(stored) as IContact[];
      } else {
        this.contacts = [...INITIAL_CONTACTS];
        this.saveToStorage();
      }
    } catch {
      this.contacts = [...INITIAL_CONTACTS];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.contacts));
    } catch (err) {
      console.error('Failed to save contacts to localStorage:', err);
    }
  }

  public getAll(): IContact[] {
    return [...this.contacts];
  }

  public getByCustomerId(customerId: string): IContact[] {
    return this.contacts.filter((c) => c.customerId === customerId);
  }

  public getById(id: string): IContact | undefined {
    return this.contacts.find((c) => c.id === id);
  }

  public create(
    dto: CreateContactDTO,
    customerName: string,
    companyName: string
  ): IContact {
    const newId = `cnt-${Date.now()}`;
    const now = new Date().toISOString();

    // If marked as primary, unmark other contacts for this customer
    if (dto.isPrimary) {
      this.contacts = this.contacts.map((c) =>
        c.customerId === dto.customerId ? { ...c, isPrimary: false } : c
      );
    }

    const newContact: IContact = {
      id: newId,
      customerId: dto.customerId,
      customerName,
      companyName,
      fullName: dto.fullName,
      jobTitle: dto.jobTitle,
      email: dto.email,
      phone: dto.phone,
      department: dto.department || 'Chung',
      roleInBuying: dto.roleInBuying,
      influenceLevel: dto.influenceLevel || 'medium',
      isPrimary: dto.isPrimary ?? false,
      avatarUrl: createAvatarSvgDataUri(dto.fullName, Math.floor(Math.random() * 8)),
      notes: dto.notes || '',
      createdAt: now,
      updatedAt: now,
      transferHistory: [],
    };

    this.contacts.unshift(newContact);
    this.saveToStorage();
    return newContact;
  }

  public update(id: string, dto: UpdateContactDTO): IContact {
    const index = this.contacts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Contact with id ${id} not found.`);
    }

    const existing = this.contacts[index];

    // If updated isPrimary to true, unset others in the same company
    if (dto.isPrimary && !existing.isPrimary) {
      const targetCustId = dto.customerId || existing.customerId;
      this.contacts = this.contacts.map((c) =>
        c.customerId === targetCustId && c.id !== id ? { ...c, isPrimary: false } : c
      );
    }

    const updated: IContact = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.contacts[index] = updated;
    this.saveToStorage();
    return updated;
  }

  public delete(id: string): boolean {
    const prevLength = this.contacts.length;
    this.contacts = this.contacts.filter((c) => c.id !== id);
    const deleted = this.contacts.length < prevLength;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public setPrimary(contactId: string, customerId: string): void {
    this.contacts = this.contacts.map((c) => {
      if (c.customerId === customerId) {
        return {
          ...c,
          isPrimary: c.id === contactId,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    this.saveToStorage();
  }

  public transferContact(
    dto: TransferContactDTO,
    newCustomerName: string,
    newCompanyName: string
  ): IContact {
    const index = this.contacts.findIndex((c) => c.id === dto.contactId);
    if (index === -1) {
      throw new Error(`Contact with id ${dto.contactId} not found.`);
    }

    const current = this.contacts[index];

    const historyRecord: IContactTransferHistory = {
      id: `tfh-${Date.now()}`,
      contactId: current.id,
      transferDate: new Date().toISOString().slice(0, 10),
      fromCustomerId: current.customerId,
      fromCompanyName: current.companyName,
      toCustomerId: dto.newCustomerId,
      toCompanyName: newCompanyName,
      oldJobTitle: current.jobTitle,
      newJobTitle: dto.newJobTitle,
      oldRole: current.roleInBuying,
      newRole: dto.newRoleInBuying,
      reason: dto.reason,
      transferredBy: dto.transferredBy || 'Quản Trị Viên Hệ Thống',
    };

    // If new contact will be primary in the new customer, reset existing primary in that customer
    if (dto.isPrimaryInNewCompany) {
      this.contacts = this.contacts.map((c) =>
        c.customerId === dto.newCustomerId ? { ...c, isPrimary: false } : c
      );
    }

    const updatedContact: IContact = {
      ...current,
      customerId: dto.newCustomerId,
      customerName: newCustomerName,
      companyName: newCompanyName,
      jobTitle: dto.newJobTitle,
      roleInBuying: dto.newRoleInBuying,
      department: dto.newDepartment || current.department,
      isPrimary: dto.isPrimaryInNewCompany ?? false,
      updatedAt: new Date().toISOString(),
      transferHistory: [historyRecord, ...(current.transferHistory || [])],
    };

    this.contacts[index] = updatedContact;
    this.saveToStorage();
    return updatedContact;
  }

  public getTransferHistory(contactId: string): IContactTransferHistory[] {
    const contact = this.getById(contactId);
    return contact?.transferHistory || [];
  }

  public getStats(customerId?: string): IContactStats {
    const list = customerId && customerId !== 'all'
      ? this.contacts.filter((c) => c.customerId === customerId)
      : this.contacts;

    return {
      totalContacts: list.length,
      decisionMakersCount: list.filter((c) => c.roleInBuying === 'decision_maker').length,
      influencersCount: list.filter((c) => c.roleInBuying === 'influencer').length,
      endUsersCount: list.filter((c) => c.roleInBuying === 'end_user').length,
      blockersCount: list.filter((c) => c.roleInBuying === 'blocker').length,
      primaryContactsCount: list.filter((c) => c.isPrimary).length,
      transferredCount: list.filter((c) => (c.transferHistory?.length || 0) > 0).length,
    };
  }

  public resetToMock(): void {
    this.contacts = [...INITIAL_CONTACTS];
    this.saveToStorage();
  }
}

export const contactService = new ContactService();
