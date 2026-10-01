import { api } from './api';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
}

export const reportService = {
  getSalesReport: (filter: ReportFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('StartDate', filter.startDate);
    if (filter.endDate) params.set('EndDate', filter.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<any>(`/reports/sales${query}`);
  },

  getWorkOrdersReport: (filter: ReportFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('StartDate', filter.startDate);
    if (filter.endDate) params.set('EndDate', filter.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<any>(`/reports/work-orders${query}`);
  },

  getStockReport: () => api.get<any>('/reports/stock'),

  getFinancialReport: (filter: ReportFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('StartDate', filter.startDate);
    if (filter.endDate) params.set('EndDate', filter.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<any>(`/reports/financial${query}`);
  },

  getCustomersReport: (filter: ReportFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('StartDate', filter.startDate);
    if (filter.endDate) params.set('EndDate', filter.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<any>(`/reports/customers${query}`);
  },
};
