import { api } from './api';
import { WorkOrder, PagedResult, WorkOrderStatus, Sale } from '../types/api';

export interface WorkOrderFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: number;
  bicycleId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AddWorkOrderItemDto {
  itemType: 'Product' | 'Service';
  productId?: number | null;
  serviceId?: number | null;
  description?: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface UpdateWorkOrderItemDto {
  quantity: number;
  unitPrice: number;
  discount: number;
  description?: string;
}

export interface CreateWorkOrderDto {
  customerId: number;
  bicycleId: number;
  description: string;
  customerComplaint?: string;
  technicalEvaluation?: string;
  technicalNotes?: string;
  expectedDate?: string | null;
  discount?: number;
  additionalCharge?: number;
  assignedToUserId?: number | null;
  items?: AddWorkOrderItemDto[];
}

export interface UpdateWorkOrderDto {
  expectedDate?: string | null;
  description?: string;
  customerComplaint?: string;
  technicalEvaluation?: string;
  technicalNotes?: string;
  assignedToUserId?: number | null;
  discount?: number;
  additionalCharge?: number;
}

export interface ChangeWorkOrderStatusDto {
  status: WorkOrderStatus | string;
  reason?: string;
  isAdministrativeOverride?: boolean;
}

export interface ConvertWorkOrderPaymentDto {
  paymentMethodId: number;
  paymentMethod?: string;
  amount: number;
  installments?: number;
  transactionCode?: string;
}

export interface ConvertWorkOrderToSaleDto {
  discount?: number;
  additionalDiscount?: number;
  additionalCharge?: number;
  payments?: ConvertWorkOrderPaymentDto[];
}

export const workOrderService = {
  getAll: (filters: WorkOrderFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.status) params.set('Status', filters.status);
    if (filters.customerId) params.set('CustomerId', filters.customerId.toString());
    if (filters.bicycleId) params.set('BicycleId', filters.bicycleId.toString());
    if (filters.startDate) params.set('StartDate', filters.startDate);
    if (filters.endDate) params.set('EndDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<WorkOrder>>(`/work-orders${query}`);
  },

  getById: (id: number) => api.get<WorkOrder>(`/work-orders/${id}`),

  create: (data: CreateWorkOrderDto) => api.post<WorkOrder>('/work-orders', data),

  update: (id: number, data: UpdateWorkOrderDto) => api.put<WorkOrder>(`/work-orders/${id}`, data),

  addItem: (workOrderId: number, item: AddWorkOrderItemDto) =>
    api.post<WorkOrder>(`/work-orders/${workOrderId}/items`, item),

  updateItem: (workOrderId: number, itemId: number, item: UpdateWorkOrderItemDto) =>
    api.put<WorkOrder>(`/work-orders/${workOrderId}/items/${itemId}`, item),

  removeItem: (workOrderId: number, itemId: number) =>
    api.delete<WorkOrder>(`/work-orders/${workOrderId}/items/${itemId}`),

  updateStatus: (id: number, status: string, reason?: string, isAdministrativeOverride: boolean = true) =>
    api.post<WorkOrder>(`/work-orders/${id}/status`, { status, reason, isAdministrativeOverride }),

  approve: (id: number, notes?: string) =>
    api.post<WorkOrder>(`/work-orders/${id}/approve`, { approved: true, approvalNotes: notes }),

  cancel: (id: number, reason: string) =>
    api.post<WorkOrder>(`/work-orders/${id}/cancel`, { reason }),

  convertToSale: (id: number, data?: ConvertWorkOrderToSaleDto) => {
    const payload = data
      ? {
          ...data,
          additionalDiscount: data.additionalDiscount ?? data.discount ?? 0,
          discount: data.discount ?? data.additionalDiscount ?? 0,
        }
      : {};
    return api.post<Sale>(`/work-orders/${id}/convert-to-sale`, payload);
  },

  getPrintData: (id: number) => api.get<any>(`/work-orders/${id}/print`),
};
