import { MOCK_LEADS } from '../mocks/leads.mock';
import { ILead, ILeadFilter, ISavedLeadFilter } from '../types/Lead.types';
import { cloneLeadFilter } from '../utils/leadFilters';

export interface ILeadManagementService {
  getLeads(): Promise<ILead[]>;
  getSavedFilters(): Promise<ISavedLeadFilter[]>;
  createSavedFilter(name: string, filters: ILeadFilter): Promise<ISavedLeadFilter>;
  renameSavedFilter(id: string, name: string): Promise<ISavedLeadFilter>;
  deleteSavedFilter(id: string): Promise<void>;
}

class MockLeadManagementService implements ILeadManagementService {
  private savedFilters: ISavedLeadFilter[] = [];
  private nextPresetId = 1;

  async getLeads(): Promise<ILead[]> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 180));
    return MOCK_LEADS.map((lead) => ({ ...lead, owner: { ...lead.owner } }));
  }

  async getSavedFilters(): Promise<ISavedLeadFilter[]> {
    return this.savedFilters.map((preset) => ({
      ...preset,
      filters: cloneLeadFilter(preset.filters),
    }));
  }

  async createSavedFilter(name: string, filters: ILeadFilter): Promise<ISavedLeadFilter> {
    const normalizedName = name.trim();
    this.assertNameAvailable(normalizedName);

    const preset: ISavedLeadFilter = {
      id: `lead-filter-${this.nextPresetId}`,
      name: normalizedName,
      filters: cloneLeadFilter(filters),
    };
    this.nextPresetId += 1;
    this.savedFilters = [preset, ...this.savedFilters];
    return { ...preset, filters: cloneLeadFilter(preset.filters) };
  }

  async renameSavedFilter(id: string, name: string): Promise<ISavedLeadFilter> {
    const preset = this.savedFilters.find((item) => item.id === id);
    if (!preset) {
      throw new Error('Không tìm thấy bộ lọc cần đổi tên.');
    }

    const normalizedName = name.trim();
    this.assertNameAvailable(normalizedName, id);
    const updatedPreset = { ...preset, name: normalizedName };
    this.savedFilters = this.savedFilters.map((item) =>
      item.id === id ? updatedPreset : item
    );
    return { ...updatedPreset, filters: cloneLeadFilter(updatedPreset.filters) };
  }

  async deleteSavedFilter(id: string): Promise<void> {
    if (!this.savedFilters.some((item) => item.id === id)) {
      throw new Error('Không tìm thấy bộ lọc cần xóa.');
    }
    this.savedFilters = this.savedFilters.filter((item) => item.id !== id);
  }

  private assertNameAvailable(name: string, excludedId?: string): void {
    if (!name) {
      throw new Error('Tên bộ lọc không được để trống.');
    }
    const duplicate = this.savedFilters.some(
      (preset) =>
        preset.id !== excludedId &&
        preset.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (duplicate) {
      throw new Error('Tên bộ lọc này đã được sử dụng.');
    }
  }
}

export const leadManagementService: ILeadManagementService =
  new MockLeadManagementService();
