import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, Search, Filter, Calendar } from 'lucide-react';
import { stockService } from '../../services/stockService';
import { StockMovement } from '../../types/api';
import { Pagination } from '../common/Pagination';
import { Badge } from '../common/Badge';

export const StockMovementsView: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await stockService.getMovements({
        page,
        pageSize,
        movementType: movementType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setMovements(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar movimentações:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, movementType, startDate, endDate]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
          Histórico de Movimentações de Estoque
        </h2>
        <p className="text-xs text-[#ACB0B0]">
          Rastreabilidade completa de entradas por compras, saídas por vendas, baixas em OS e ajustes de balanço
        </p>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
          >
            <option value="">Todos os Tipos de Movimentação</option>
            <option value="Purchase">Entrada / Compra (+)</option>
            <option value="Sale">Baixa por Venda Direta (-)</option>
            <option value="WorkOrder">Baixa por Ordem de Serviço (-)</option>
            <option value="Adjustment">Ajuste de Balanço / Inventário</option>
            <option value="InitialStock">Carga Inicial de Estoque (+)</option>
            <option value="Loss">Perda / Avaria / Descarte (-)</option>
            <option value="Return">Devolução (+)</option>
            <option value="Cancellation">Estorno / Cancelamento</option>
          </select>
        </div>

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

      {/* Table */}
      <div className="rounded-xl border border-[#1F2E45] bg-[#0B1424] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#121E30]/70 text-[11px] font-semibold uppercase tracking-wider text-[#ACB0B0]">
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-center">Qtd Movimentada</th>
                <th className="py-3 px-4 text-center">Saldo Anterior</th>
                <th className="py-3 px-4 text-center">Novo Saldo</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Motivo / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#ACB0B0]">
                    Carregando histórico...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#ACB0B0]">
                    Nenhuma movimentação de estoque registrada.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isIn = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-[#121E30]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#ACB0B0]">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')}{' '}
                        {new Date(m.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{m.productCode}</td>
                      <td className="py-3 px-4 font-semibold text-white">{m.productName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            isIn
                              ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          }`}
                        >
                          {m.movementTypeName || m.movementType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={isIn ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                          {isIn ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#ACB0B0]">
                        {m.previousStock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {m.newStock}
                      </td>
                      <td className="py-3 px-4 text-[#ACB0B0] font-mono text-[11px]">
                        {m.createdByUserName}
                      </td>
                      <td className="py-3 px-4 text-[#ACB0B0] truncate max-w-[200px]">
                        {m.reason || (m.referenceType ? `${m.referenceType} #${m.referenceId}` : 'Operação direta')}
                      </td>
                    </tr>
                  );
                })
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
    </div>
  );
};
