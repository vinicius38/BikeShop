import React, { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { DashboardData } from '../../types/api';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (isOpen) {
      dashboardService.getDashboardData().then(setData).catch(console.warn);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lowStockCount = data?.lowStockProductsCount || 0;
  const pendingOrdersCount =
    (data?.waitingApprovalWorkOrders || 0) + (data?.waitingPartsWorkOrders || 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0B1424] border-l border-[#1F2E45] h-full flex flex-col text-[#F8F8F8] shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1F2E45] bg-[#121E30]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#EF7410]" />
            <h3 className="font-semibold text-sm">Notificações da Oficina</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#ACB0B0] hover:text-white hover:bg-[#18263A] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto grow custom-scrollbar space-y-4">
          {/* Low stock alerts */}
          {lowStockCount > 0 ? (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#EF4444] mb-1">
                <AlertTriangle className="w-4 h-4" />
                Alerta de Estoque Baixo ({lowStockCount})
              </div>
              <p className="text-xs text-[#ACB0B0] mb-3">
                Existem itens que atingiram ou estão abaixo do estoque mínimo de segurança.
              </p>
              <button
                onClick={() => {
                  onNavigate('stock');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-[#EF4444]/80 hover:bg-[#EF4444] rounded transition-colors"
              >
                Ver Estoque <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Pending work orders */}
          {pendingOrdersCount > 0 ? (
            <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B] mb-1">
                <Clock className="w-4 h-4" />
                OS Aguardando Atenção ({pendingOrdersCount})
              </div>
              <p className="text-xs text-[#ACB0B0] mb-3">
                Há ordens de serviço aguardando aprovação do cliente ou chegada de peças.
              </p>
              <button
                onClick={() => {
                  onNavigate('work-orders');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-[#F59E0B]/80 hover:bg-[#F59E0B] rounded transition-colors"
              >
                Ver Ordens de Serviço <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {lowStockCount === 0 && pendingOrdersCount === 0 && (
            <div className="py-12 text-center text-xs text-[#ACB0B0]">
              <Bell className="w-8 h-8 text-[#1F2E45] mx-auto mb-2" />
              Tudo em dia! Nenhuma notificação pendente no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
