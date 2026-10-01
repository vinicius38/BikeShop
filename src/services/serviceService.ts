import { api } from './api';
import { ServiceItem, PagedResult } from '../types/api';

export interface ServiceFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateServiceDto {
  name: string;
  description?: string | null;
  salePrice?: number;
  costPrice?: number;
  price?: number;
  cost?: number;
  estimatedTimeMinutes: number;
}

export const serviceService = {
  getAll: (filters: ServiceFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.isActive !== undefined) params.set('IsActive', filters.isActive.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<ServiceItem>>(`/Services${query}`);
  },

  getById: (id: number) => api.get<ServiceItem>(`/Services/${id}`),

  create: (data: CreateServiceDto) =>
    api.post<ServiceItem>('/Services', {
      name: data.name,
      description: data.description,
      salePrice: data.salePrice ?? data.price ?? 0,
      costPrice: data.costPrice ?? data.cost ?? 0,
      estimatedTimeMinutes: data.estimatedTimeMinutes,
    }),

  update: (id: number, data: Partial<CreateServiceDto>) =>
    api.put<ServiceItem>(`/Services/${id}`, {
      name: data.name,
      description: data.description,
      salePrice: data.salePrice ?? data.price,
      costPrice: data.costPrice ?? data.cost,
      estimatedTimeMinutes: data.estimatedTimeMinutes,
    }),

  delete: (id: number) => api.delete(`/Services/${id}`),
};
