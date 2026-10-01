import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertTriangle,
  XCircle,
  DollarSign,
  ArrowUpDown,
  Search,
  Plus,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { reportService } from '../../services/reportService';
import { Product } from '../../types/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface StockDashboardViewProps {
  onNavigateToMovements: () => void;
  onNavigateToProducts: () => void;
}

export const StockDashboardView: React.FC<StockDashboardViewProps> = ({
  onNavigateToMovements,
  onNavigateToProducts,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      productService.getAll({ pageSize: 100 }),
      reportService.getStockReport(),
    ]).then(([pRes, sRes]) => {
      if (pRes.status === 'fulfilled') setProducts(pRes.value.items);
      if (sRes.status === 'fulfilled') setStockSummary(sRes.value);
      setIsLoading(false);
    });
  }, []);

  const totalRegistered = products.length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minimumStockQuantity && p.stockQuantity > 0);
  const outOfStockProducts = products.filter((p) => p.stockQuantity <= 0);
  const totalStockValue = products.reduce((acc, p) => acc + p.stockQuantity * p.costPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Dashboard de Estoque
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Visão consolidada de inventário, reposição, giro de peças e valor imobilizado
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToMovements}
            className="px-4 py-2.5 rounded-lg bg-[#121E30] hover:bg-[#18263A] border border-[#1F2E45] text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4 text-[#EF7410]" />
            Ver Movimentações
          </button>
          <button
            onClick={onNavigateToProducts}
            className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajustar / Cadastrar Peças
          </button>
        </div>
      </div>

      {/* 27. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Produtos Cadastrados"
          value={isLoading ? '...' : totalRegistered}
          subtitle="Itens únicos no inventário"
          icon={Layers}
        />

        <StatCard
          title="Estoque Baixo"
          value={isLoading ? '...' : lowStockProducts.length}
          subtitle="Abaixo do estoque de segurança"
          icon={AlertTriangle}
          highlight={lowStockProducts.length > 0}
        />

        <StatCard
          title="Produtos Sem Estoque"
          value={isLoading ? '...' : outOfStockProducts.length}
          subtitle="Itens com saldo zerado"
          icon={XCircle}
        />

        <StatCard
          title="Valor Total do Estoque"
          value={
            isLoading
              ? '...'
              : `R$ ${totalStockValue.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          subtitle="Custo de reposição total"
          icon={DollarSign}
        />
      </div>

      {/* Critical Stock List */}
      <div className="rounded-xl border border-[#1F2E45] bg-[#0B1424] overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-[#121E30] border-b border-[#1F2E45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EF7410]" />
            <h3 className="text-sm font-semibold text-white">
              Itens em Ponto de Reposição (Estoque Crítico)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#ACB0B0]">
            {lowStockProducts.length + outOfStockProducts.length} item(ns) requerem atenção
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#0B1424] text-[11px] font-semibold uppercase tracking-wider text-[#ACB0B0]">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                <th className="py-3 px-4">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {[...outOfStockProducts, ...lowStockProducts].length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#ACB0B0]">
                    Parabéns! Todos os itens do catálogo estão com estoque saudável.
                  </td>
                </tr>
              ) : (
                [...outOfStockProducts, ...lowStockProducts].map((p) => {
                  const isZero = p.stockQuantity <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#121E30]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{p.code}</td>
                      <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                      <td className="py-3 px-4 text-[#ACB0B0]">{p.categoryName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={isZero ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#ACB0B0]">
                        {p.minimumStockQuantity} {p.unit}
                      </td>
                      <td className="py-3 px-4">
                        {isZero ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444]">
                            ZERADO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B]">
                            ESTOQUE BAIXO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
