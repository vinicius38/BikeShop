import { api } from './api';
import { User, Role, Permission, PagedResult } from '../types/api';

export interface UserFilter {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CreateUserDto {
  name: string;
  username: string;
  email: string;
  password?: string;
  roleId: number;
}

export const userService = {
  getAll: (filters: UserFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('Page', filters.page.toString());
    if (filters.pageSize) params.set('PageSize', filters.pageSize.toString());
    if (filters.search) params.set('Search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<PagedResult<User>>(`/Users${query}`);
  },
  getById: (id: number) => api.get<User>(`/Users/${id}`),
  create: (data: CreateUserDto) => api.post<User>('/Users', data),
  update: (id: number, data: Partial<CreateUserDto>) => api.put<User>(`/Users/${id}`, data),
  activate: (id: number) => api.patch(`/Users/${id}/activate`, {}),
  deactivate: (id: number) => api.patch(`/Users/${id}/deactivate`, {}),
  getRoles: () => api.get<Role[]>('/Users/roles'),
  getPermissions: () => api.get<Permission[]>('/Users/permissions'),
  updateRolePermissions: (roleId: number, permissions: string[]) => api.put<Role>(`/Users/roles/${roleId}/permissions`, { permissions }),
};
