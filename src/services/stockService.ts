import { api } from './api';
import { StockMovement, PagedResult } from '../types/api';

export interface StockMovementFilter {
  page?: number;
  pageSize?: number;
  productId?: number;
  type?: string;
  movementType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdjustStockDto {
  productId: number;
  quantity?: number;
  newQuantity?: number;
  type?: string;
  unitCost?: number;
  reason: string;
}

export const stockService = {
  getMovements: (filters: StockMovementFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.productId) params.set('ProductId', filters.productId.toString());
    const movementType = filters.type || filters.movementType;
    if (movementType) params.set('type', movementType);
    if (filters.startDate) params.set('StartDate', filters.startDate);
    if (filters.endDate) params.set('EndDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<StockMovement>>(`/Stock/movements${query}`);
  },

  adjustStock: (data: AdjustStockDto) => {
    const qty = data.quantity !== undefined ? data.quantity : (data.newQuantity ?? 0);
    return api.post<StockMovement>('/Stock/adjust', {
      productId: data.productId,
      quantity: qty,
      type: data.type || 'Adjustment',
      unitCost: data.unitCost,
      reason: data.reason?.trim() || 'Ajuste manual de estoque',
    });
  },
};
