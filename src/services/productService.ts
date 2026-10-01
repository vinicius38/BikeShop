import { api } from './api';
import { Product, ProductCategory, PagedResult } from '../types/api';

export interface ProductFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  isLowStock?: boolean;
  isActive?: boolean;
}

export interface CreateProductDto {
  code: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId: number;
  supplierId?: number | null;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStockQuantity: number;
  unit: string;
}

export const productService = {
  getAll: (filters: ProductFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    if (filters.categoryId) params.set('CategoryId', filters.categoryId.toString());
    if (filters.isLowStock !== undefined) params.set('IsLowStock', filters.isLowStock.toString());
    if (filters.isActive !== undefined) params.set('IsActive', filters.isActive.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<Product>>(`/Products${query}`);
  },

  getById: (id: number) => api.get<Product>(`/Products/${id}`),

  getNextCode: () => api.get<string>('/Products/next-code'),

  create: (data: CreateProductDto) => {
    const payload = {
      ...data,
      sku: data.code,
      code: data.code,
      productCategoryId: data.categoryId,
      categoryId: data.categoryId,
      initialStock: data.stockQuantity,
      stockQuantity: data.stockQuantity,
      minimumStock: data.minimumStockQuantity,
      minimumStockQuantity: data.minimumStockQuantity,
    };
    return api.post<Product>('/Products', payload);
  },

  update: (id: number, data: Partial<CreateProductDto>) => {
    const payload: any = { ...data };
    if (data.code) {
      payload.sku = data.code;
      payload.code = data.code;
    }
    if (data.categoryId) {
      payload.productCategoryId = data.categoryId;
      payload.categoryId = data.categoryId;
    }
    if (data.minimumStockQuantity !== undefined) {
      payload.minimumStock = data.minimumStockQuantity;
      payload.minimumStockQuantity = data.minimumStockQuantity;
    }
    return api.put<Product>(`/Products/${id}`, payload);
  },

  delete: (id: number) => api.delete(`/Products/${id}`),

  getCategories: () => api.get<ProductCategory[]>('/product-categories'),

  updateStock: (id: number, quantity: number, type: 'In' | 'Out' | 'Adjustment' | string, reason?: string) => {
    const qty = type === 'Out' ? -Math.abs(quantity) : type === 'In' ? Math.abs(quantity) : quantity;
    const movementType = type === 'In' ? 'Purchase' : type === 'Out' ? 'Loss' : 'Adjustment';
    const finalReason = reason?.trim() || (type === 'In' ? 'Entrada manual no estoque' : type === 'Out' ? 'Saída manual de estoque' : 'Ajuste de inventário');
    return api.post(`/Products/${id}/stock`, {
      productId: id,
      quantity: qty,
      type: movementType,
      reason: finalReason,
    });
  },
};
