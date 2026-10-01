import { api } from './api';
import { DashboardData } from '../types/api';

export const dashboardService = {
  getDashboardData: () => api.get<DashboardData>('/Dashboard'),
};
