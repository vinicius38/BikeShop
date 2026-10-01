import { api } from './api';
import { Supplier, PagedResult } from '../types/api';

export interface SupplierFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateSupplierDto {
  corporateName: string;
  tradeName: string;
  cnpj: string;
  email?: string | null;
  phone?: string | null;
  cellPhone?: string | null;
  contactPerson?: string | null;
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

export const supplierService = {
  getAll: (filters: SupplierFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.isActive !== undefined) params.set('IsActive', filters.isActive.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<Supplier>>(`/Suppliers${query}`);
  },

  getById: (id: number) => api.get<Supplier>(`/Suppliers/${id}`),

  create: (data: CreateSupplierDto) => api.post<Supplier>('/Suppliers', data),

  update: (id: number, data: Partial<CreateSupplierDto>) => api.put<Supplier>(`/Suppliers/${id}`, data),

  delete: (id: number) => api.delete(`/Suppliers/${id}`),
};
