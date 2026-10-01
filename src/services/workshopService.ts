import { api } from './api';
import { WorkshopSettings } from '../types/api';

export const workshopService = {
  getSettings: () => api.get<WorkshopSettings>('/workshop-settings'),
  updateSettings: (data: Partial<WorkshopSettings>) => api.put<WorkshopSettings>('/workshop-settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ fileName: string; logoUrl: string }>('/workshop-settings/logo', formData);
  },
  deleteLogo: () => api.delete('/workshop-settings/logo'),
};
