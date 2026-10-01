import { api } from './api';
import { Customer, PagedResult } from '../types/api';

export interface CustomerFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  cpfCnpj?: string;
}

export interface CreateCustomerDto {
  name: string;
  cpfCnpj: string;
  phone?: string | null;
  cellPhone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  address?: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

export const customerService = {
  getAll: (filters: CustomerFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.isActive !== undefined) params.set('IsActive', filters.isActive.toString());
    if (filters.cpfCnpj) params.set('CpfCnpj', filters.cpfCnpj);

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<Customer>>(`/Customers${query}`);
  },

  getById: (id: number) => api.get<Customer>(`/Customers/${id}`),

  create: (data: CreateCustomerDto) => api.post<Customer>('/Customers', data),

  update: (id: number, data: Partial<CreateCustomerDto>) => api.put<Customer>(`/Customers/${id}`, data),

  delete: (id: number) => api.delete(`/Customers/${id}`),
};
