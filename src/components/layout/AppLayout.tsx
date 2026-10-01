import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { dashboardService } from '../../services/dashboardService';
import { NotificationsDrawer } from './NotificationsDrawer';
import { DashboardData } from '../../types/api';

interface AppLayoutProps {
  currentView: string;
  onNavigate: (view: string, itemId?: number) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const previousData = useRef<DashboardData | null>(null);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const data = await dashboardService.getDashboardData();
        const pendingCount = (data?.lowStockProductsCount || 0) + 
                             (data?.waitingApprovalWorkOrders || 0) + 
                             (data?.waitingPartsWorkOrders || 0);
        
        const prevData = previousData.current;
        if (!prevData) {
          // First load: show dot if there are any pending
          if (pendingCount > 0) {
            setHasUnreadNotifications(true);
          }
        } else {
          // Check if any specific notification type increased
          if (
            (data?.lowStockProductsCount || 0) > (prevData.lowStockProductsCount || 0) ||
            (data?.waitingApprovalWorkOrders || 0) > (prevData.waitingApprovalWorkOrders || 0) ||
            (data?.waitingPartsWorkOrders || 0) > (prevData.waitingPartsWorkOrders || 0)
          ) {
            setHasUnreadNotifications(true);
          }
        }
        
        previousData.current = data;
      } catch (error) {
        console.warn('Failed to check notifications:', error);
      }
    };

    // Check immediately
    checkNotifications();

    // Then check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const contentMarginClass = isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64';

  return (
    <div className="min-h-screen bg-[#040915] text-[#F8F8F8] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`flex flex-col grow transition-all duration-200 ${contentMarginClass}`}>
        <Header
          onToggleSidebar={() => {
            if (window.innerWidth >= 1024) {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            } else {
              setIsSidebarOpen(!isSidebarOpen);
            }
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => {
            setIsNotificationsOpen(true);
            setHasUnreadNotifications(false);
          }}
          onNavigate={onNavigate}
          hasNotifications={hasUnreadNotifications}
        />

        <main className="grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
