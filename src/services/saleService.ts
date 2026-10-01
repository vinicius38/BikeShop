import { api } from './api';
import { Sale, PagedResult } from '../types/api';

export interface SaleFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateSaleItemDto {
  itemType?: number; // 1 = Product, 2 = Service
  productId?: number | null;
  serviceId?: number | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface PaymentMethodItem {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface CreateSalePaymentDto {
  paymentMethodId: number;
  paymentMethod?: string;
  amount: number;
  installments?: number;
  transactionCode?: string;
  transactionReference?: string;
}

export interface CreateSaleDto {
  customerId?: number | null;
  workOrderId?: number | null;
  discount?: number;
  additionalCharge?: number;
  notes?: string;
  items: CreateSaleItemDto[];
  payments: CreateSalePaymentDto[];
}

export const saleService = {
  getAll: (filters: SaleFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.customerId) params.set('CustomerId', filters.customerId.toString());
    if (filters.startDate) params.set('StartDate', filters.startDate);
    if (filters.endDate) params.set('EndDate', filters.endDate);
    if (filters.status) params.set('Status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<Sale>>(`/Sales${query}`);
  },

  getById: (id: number) => api.get<Sale>(`/Sales/${id}`),

  create: (data: CreateSaleDto) => api.post<Sale>('/Sales', data),

  cancel: (id: number, reason: string) => api.post<Sale>(`/Sales/${id}/cancel`, { reason }),

  getPrintData: (id: number) => api.get<any>(`/Sales/${id}/print`),

  getPaymentMethods: () => api.get<PaymentMethodItem[]>('/Sales/payment-methods'),
};
