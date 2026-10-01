import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { workOrderService } from '../../services/workOrderService';
import { WorkOrder, WorkOrderStatus } from '../../types/api';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { EmptyState } from '../common/EmptyState';
import { WorkOrderWizardModal } from './WorkOrderWizardModal';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';
import { WorkOrderPrintModal } from './WorkOrderPrintModal';

interface WorkOrdersListViewProps {
  initialWorkOrderId?: number | null;
  onNavigateToSale?: (saleId: number) => void;
}

export const WorkOrdersListView: React.FC<WorkOrdersListViewProps> = ({
  initialWorkOrderId,
  onNavigateToSale,
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(
    initialWorkOrderId || null
  );
  const [printWorkOrder, setPrintWorkOrder] = useState<WorkOrder | null>(null);

  const loadWorkOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await workOrderService.getAll({
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setWorkOrders(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar Ordens de Serviço:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  useEffect(() => {
    if (initialWorkOrderId) {
      setSelectedDetailId(initialWorkOrderId);
    }
  }, [initialWorkOrderId]);

  return (
    <div className="space-y-5">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Ordens de Serviço (OS)
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Gerenciamento de diagnósticos, manutenções, peças e aprovações
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova OS
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#ACB0B0] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Pesquisar por número, cliente ou bike..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
          >
            <option value="">Todos os Status</option>
            <option value="Open">Aberta</option>
            <option value="WaitingApproval">Aguardando Aprovação</option>
            <option value="Approved">Aprovada</option>
            <option value="InProgress">Em Andamento</option>
            <option value="WaitingParts">Aguardando Peças</option>
            <option value="Ready">Pronta</option>
            <option value="Delivered">Entregue</option>
            <option value="Cancelled">Cancelada</option>
          </select>
        </div>

        {/* Date Start */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
            title="Data Inicial"
          />
        </div>

        {/* Date End */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
            title="Data Final"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-[#1F2E45] bg-[#0B1424] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#121E30]/70 text-[11px] font-semibold uppercase tracking-wider text-[#ACB0B0]">
                <th className="py-3 px-4">Nº</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Bicicleta</th>
                <th className="py-3 px-4">Data Abertura</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#ACB0B0]">
                    <span className="w-5 h-5 border-2 border-[#EF7410] border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Carregando Ordens de Serviço...
                  </td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={ClipboardList}
                      title="Nenhuma Ordem de Serviço encontrada"
                      description="Abra uma nova Ordem de Serviço para iniciar o atendimento ou ajuste os filtros de busca."
                      actionText="Nova Ordem de Serviço"
                      onAction={() => setIsWizardOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                workOrders.map((os) => (
                  <tr
                    key={os.id}
                    className="hover:bg-[#121E30]/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDetailId(os.id)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-[#EF7410] transition-colors">
                      {os.number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{os.customerName}</div>
                      <div className="text-[11px] text-[#ACB0B0] font-mono">{os.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">
                        {os.bicycleBrand} {os.bicycleModel}
                      </div>
                      <div className="text-[11px] text-[#ACB0B0] font-mono truncate max-w-[200px]">
                        {os.bicycleSerialNumber || 'Sem nº série'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#ACB0B0] font-mono text-[11px]">
                      {new Date(os.openingDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-flex items-center group/status">
                        <select
                          value={os.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (newStatus && newStatus !== os.status) {
                              try {
                                await workOrderService.updateStatus(os.id, newStatus, 'Alteração rápida na listagem');
                                loadWorkOrders();
                              } catch (err: any) {
                                alert(err.message || 'Erro ao alterar status da OS');
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          title="Clique para selecionar qualquer status para esta OS"
                        >
                          <option value="Open">Aberta</option>
                          <option value="WaitingApproval">Aguardando Aprovação</option>
                          <option value="Approved">Aprovada</option>
                          <option value="InProgress">Em Andamento</option>
                          <option value="WaitingParts">Aguardando Peças</option>
                          <option value="Ready">Pronta</option>
                          <option value="Delivered">Entregue</option>
                          <option value="Cancelled">Cancelada</option>
                        </select>
                        <div className="flex items-center gap-1 cursor-pointer group-hover/status:opacity-85 transition-opacity">
                          <Badge status={os.status} size="sm">
                            {os.statusName || os.status}
                          </Badge>
                          <span className="text-[9px] text-[#ACB0B0] group-hover/status:text-white transition-colors">▾</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      R$ {Number(os.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedDetailId(os.id)}
                          className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-white hover:bg-[#18263A] transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPrintWorkOrder(os)}
                          className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#18263A] transition-colors"
                          title="Imprimir OS"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* New OS 7-Step Wizard Modal */}
      <WorkOrderWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(created) => {
          loadWorkOrders();
          setSelectedDetailId(created.id);
        }}
      />

      {/* OS Details Modal with Timeline & Convert to Sale */}
      <WorkOrderDetailModal
        workOrderId={selectedDetailId}
        isOpen={!!selectedDetailId}
        onClose={() => setSelectedDetailId(null)}
        onRefresh={loadWorkOrders}
        onPrint={(wo) => setPrintWorkOrder(wo)}
        onConvertedToSale={(saleId) => {
          if (onNavigateToSale) {
            onNavigateToSale(saleId);
          }
        }}
      />

      {/* OS Printable Document Modal */}
      <WorkOrderPrintModal
        isOpen={!!printWorkOrder}
        onClose={() => setPrintWorkOrder(null)}
        workOrder={printWorkOrder}
      />
    </div>
  );
};
