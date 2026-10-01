import { api } from './api';
import { Bicycle, PagedResult } from '../types/api';

export interface BicycleFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: number;
  isActive?: boolean;
}

export interface CreateBicycleDto {
  customerId: number;
  brand: string;
  model: string;
  color: string;
  frameSize?: string | null;
  serialNumber?: string | null;
  type: string;
  notes?: string | null;
}

export const bicycleService = {
  getAll: (filters: BicycleFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.customerId) params.set('CustomerId', filters.customerId.toString());
    if (filters.isActive !== undefined) params.set('IsActive', filters.isActive.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<Bicycle>>(`/Bicycles${query}`);
  },

  getById: (id: number) => api.get<Bicycle>(`/Bicycles/${id}`),

  create: (data: CreateBicycleDto) => api.post<Bicycle>('/Bicycles', data),

  update: (id: number, data: Partial<CreateBicycleDto>) => api.put<Bicycle>(`/Bicycles/${id}`, data),

  delete: (id: number) => api.delete(`/Bicycles/${id}`),
};
