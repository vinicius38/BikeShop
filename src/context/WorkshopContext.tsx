import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkshopSettings } from '../types/api';
import { workshopService } from '../services/workshopService';
import { useAuth } from './AuthContext';

interface WorkshopContextType {
  settings: WorkshopSettings | null;
  isLoading: boolean;
  logoUrl: string;
  workshopName: string;
  tradeName: string;
  refreshSettings: () => Promise<void>;
  updateSettings: (data: Partial<WorkshopSettings>) => Promise<void>;
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await workshopService.getSettings();
      setSettings(data);
    } catch (err) {
      console.warn('Could not load workshop settings', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = async (data: Partial<WorkshopSettings>) => {
    const updated = await workshopService.updateSettings(data);
    setSettings(updated);
  };

  const workshopName = settings?.companyName || 'Nilson Bikes';
  const tradeName = settings?.tradeName || 'Oficina Especializada';
  // Logo URL from backend API endpoint
  const logoUrl = settings?.hasLogo && settings?.logoUrl ? settings.logoUrl : '/api/workshop-settings/logo';

  return (
    <WorkshopContext.Provider
      value={{
        settings,
        isLoading,
        logoUrl,
        workshopName,
        tradeName,
        refreshSettings,
        updateSettings,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
