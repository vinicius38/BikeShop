import React from 'react';
import {
  LayoutDashboard,
  Users,
  Bike,
  Package,
  Wrench,
  Truck,
  ClipboardList,
  Layers,
  ArrowLeftRight,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Building2,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkshop } from '../../context/WorkshopContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
  isCollapsed,
}) => {
  const { hasPermission } = useAuth();
  const { workshopName, tradeName, logoUrl } = useWorkshop();

  const menuGroups: MenuGroup[] = [
    {
      groupName: 'Dashboard',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          permission: 'Dashboard.View',
        },
      ],
    },
    {
      groupName: 'Cadastros',
      items: [
        {
          id: 'customers',
          label: 'Clientes',
          icon: Users,
          permission: 'Customers.View',
        },
        {
          id: 'bicycles',
          label: 'Bicicletas',
          icon: Bike,
          permission: 'Bicycles.View',
        },
        {
          id: 'products',
          label: 'Produtos',
          icon: Package,
          permission: 'Products.View',
        },
        {
          id: 'services',
          label: 'Serviços',
          icon: Wrench,
          permission: 'Services.View',
        },
        {
          id: 'suppliers',
          label: 'Fornecedores',
          icon: Truck,
          permission: 'Suppliers.View',
        },
      ],
    },
    {
      groupName: 'Oficina',
      items: [
        {
          id: 'work-orders',
          label: 'Ordens de Serviço',
          icon: ClipboardList,
          permission: 'WorkOrders.View',
        },
      ],
    },
    {
      groupName: 'Vendas',
      items: [
        {
          id: 'sales',
          label: 'Vendas',
          icon: ShoppingBag,
          permission: 'Sales.View',
        },
      ],
    },
    {
      groupName: 'Estoque',
      items: [
        {
          id: 'stock',
          label: 'Estoque',
          icon: Layers,
          permission: 'Stock.View',
        },
        {
          id: 'stock-movements',
          label: 'Movimentações',
          icon: ArrowLeftRight,
          permission: 'Stock.View',
        },
      ],
    },
    {
      groupName: 'Financeiro',
      items: [
        {
          id: 'financial',
          label: 'Financeiro',
          icon: DollarSign,
          permission: 'Sales.View',
        },
      ],
    },
    {
      groupName: 'Relatórios',
      items: [
        {
          id: 'reports',
          label: 'Relatórios',
          icon: BarChart3,
          permission: 'Reports.View',
        },
      ],
    },
    {
      groupName: 'Configurações',
      items: [
        {
          id: 'settings-workshop',
          label: 'Oficina',
          icon: Building2,
          permission: 'WorkshopSettings.View',
        },
        {
          id: 'users',
          label: 'Usuários',
          icon: UserCog,
          permission: 'Users.View',
        },
        {
          id: 'permissions',
          label: 'Permissões',
          icon: ShieldCheck,
          permission: 'Users.View',
        },
      ],
    },
  ];

  // Filter menu items by user permissions
  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0B1424] border-r border-[#1F2E45] flex flex-col transition-all duration-200 no-print
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarWidth}
        `}
      >
        {/* Top: Workshop Brand & Dynamic Logo */}
        <div className="h-16 px-4 border-b border-[#1F2E45] flex items-center justify-between bg-[#0B1424] shrink-0">
          <div
            className="flex items-center gap-3 overflow-hidden cursor-pointer"
            onClick={() => onNavigate('dashboard')}
          >
            {/* Workshop Logo from API */}
            <div className="w-10 h-10 rounded-lg bg-[#121E30] border border-[#1F2E45] overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={logoUrl}
                alt={workshopName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-icon flex items-center justify-center w-full h-full text-[#EF7410] font-black text-xs font-mono';
                    fallback.innerText = 'NB';
                    parent.appendChild(fallback);
                  }
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {!isCollapsed && (
              <div className="grow truncate">
                <span className="block text-sm font-extrabold text-[#F8F8F8] tracking-tight uppercase truncate">
                  {workshopName}
                </span>
                <span className="block text-[11px] text-[#ACB0B0] font-mono truncate">
                  {tradeName}
                </span>
              </div>
            )}
          </div>

          {/* Close drawer button on mobile */}
          <button
            onClick={onClose}
            className="p-1 rounded text-[#ACB0B0] hover:text-white hover:bg-[#18263A] lg:hidden"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="grow overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {filteredGroups.map((group) => (
            <div key={group.groupName}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ACB0B0]/70 font-mono">
                  {group.groupName}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-[#EF7410] text-white shadow-sm font-semibold'
                          : 'text-[#ACB0B0] hover:text-white hover:bg-[#121E30]'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-[#ACB0B0] group-hover:text-[#EF7410]'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom indicator */}
        <div className="p-3 border-t border-[#1F2E45] bg-[#070D1A] shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-[#ACB0B0]">
              <span className="font-mono text-[#EF7410]">v2.4 Pro</span>
              <span className="text-[10px] text-[#ACB0B0]/60">VS Dev</span>
            </div>
          ) : (
            <div className="text-center font-mono text-[10px] text-[#EF7410]">NB</div>
          )}
        </div>
      </aside>
    </>
  );
};
