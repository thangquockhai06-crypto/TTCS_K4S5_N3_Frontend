import { AxiosError } from 'axios';
import { axiosInstance } from '../../../utils/axiosInstance';
import {
  ICreateSalesCatalogRequest,
  ISalesCatalogItem,
  IUpdateSalesCatalogRequest,
  SalesCatalogType,
} from '../types/SalesCatalog.types';

interface IReorderSalesCatalogRequest {
  ordered_ids: string[];
}

const getApiErrorMessage = (data: unknown): string | undefined => {
  if (typeof data === 'string') {
    return data;
  }

  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  const payload = data as Record<string, unknown>;
  if (typeof payload.detail === 'string') {
    return payload.detail;
  }
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  return undefined;
};

export const getSalesCatalogErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof AxiosError) {
    return getApiErrorMessage(error.response?.data) ?? fallback;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

export const isSalesCatalogReferenceError = (error: unknown): boolean => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const message = getApiErrorMessage(error.response?.data) ?? '';
  return /referenc|usage[_\s]?count|in use|being used|currently used|đang được sử dụng|đang sử dụng|tham chiếu/i.test(
    message
  );
};

class SalesCatalogService {
  async getCatalog(type: SalesCatalogType): Promise<ISalesCatalogItem[]> {
    const response = await axiosInstance.get<ISalesCatalogItem[]>('/categories', {
      params: { type },
    });
    return response.data;
  }

  async createCatalog(
    payload: ICreateSalesCatalogRequest
  ): Promise<ISalesCatalogItem> {
    const response = await axiosInstance.post<ISalesCatalogItem>(
      '/categories',
      payload
    );
    return response.data;
  }

  async updateCatalog(
    id: string,
    payload: IUpdateSalesCatalogRequest
  ): Promise<ISalesCatalogItem> {
    const response = await axiosInstance.put<ISalesCatalogItem>(
      `/categories/${id}`,
      payload
    );
    return response.data;
  }

  async deleteCatalog(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(
      `/categories/${id}`
    );
    return response.data;
  }

  async reorderCatalog(
    orderedIds: string[]
  ): Promise<{ message: string }> {
    const payload: IReorderSalesCatalogRequest = { ordered_ids: orderedIds };
    const response = await axiosInstance.post<{ message: string }>(
      '/categories/reorder',
      payload
    );
    return response.data;
  }
}

export const salesCatalogService = new SalesCatalogService();
