import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onNavigate: (view: string) => void;
  hasNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifications,
  onNavigate,
  hasNotifications = false,
}) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B1424] border-b border-[#1F2E45] px-4 sm:px-6 flex items-center justify-between no-print">
      {/* Left: Mobile/Tablet Hamburger + Search Input */}
      <div className="flex items-center gap-4 grow max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-[#ACB0B0] hover:text-white hover:bg-[#18263A] transition-colors"
          title="Alternar Menu Lateral (☰)"
          aria-label="Abrir ou fechar menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input trigger */}
        <div
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg bg-[#121E30] hover:bg-[#18263A] border border-[#1F2E45] text-xs text-[#ACB0B0] cursor-pointer transition-colors"
        >
          <Search className="w-4 h-4 text-[#EF7410] shrink-0" />
          <span className="grow truncate">Pesquisar no sistema... (clientes, bicicletas, OS, produtos)</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-[#ACB0B0] bg-[#0B1424] border border-[#1F2E45] rounded">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Notifications + User Avatar / Dropdown */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-[#ACB0B0] hover:text-white hover:bg-[#18263A] transition-colors"
          title="Notificações"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF7410] ring-2 ring-[#0B1424]" />
          )}
        </button>

        <div className="h-6 w-px bg-[#1F2E45] mx-1" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A9581E] to-[#EF7410] flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NB'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#F8F8F8] leading-tight truncate max-w-[130px]">
                {user?.name || 'Administrador'}
              </div>
              <div className="text-[10px] text-[#ACB0B0] font-mono leading-none mt-0.5">
                {user?.roleName || 'Administrador'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#ACB0B0]" />
          </button>

          {/* User Dropdown */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-[#0B1424] border border-[#1F2E45] rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in-50 duration-150">
                <div className="px-4 py-2.5 border-b border-[#1F2E45]">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#ACB0B0] truncate font-mono">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('settings-workshop');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#ACB0B0] hover:text-white hover:bg-[#121E30] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#EF7410]" />
                    Configurações da Oficina
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('users');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#ACB0B0] hover:text-white hover:bg-[#121E30] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#3B82F6]" />
                    Gerenciar Usuários
                  </button>
                </div>

                <div className="pt-1 border-t border-[#1F2E45]">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
