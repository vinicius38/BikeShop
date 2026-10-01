import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { saleService } from '../../services/saleService';
import { DashboardData, Sale } from '../../types/api';
import { StatCard } from '../common/StatCard';

export const FinancialView: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      dashboardService.getDashboardData(),
      saleService.getAll({ pageSize: 50 }),
    ]).then(([dRes, sRes]) => {
      if (dRes.status === 'fulfilled') setDashboardData(dRes.value);
      if (sRes.status === 'fulfilled') setSales(sRes.value.items);
      setIsLoading(false);
    });
  }, []);

  const totalMonth = dashboardData?.salesThisMonthAmount || 0;
  const countMonth = dashboardData?.salesThisMonthCount || 0;
  const averageTicket = countMonth > 0 ? totalMonth / countMonth : 0;
  const todayAmount = dashboardData?.salesTodayAmount || 0;

  // Compute breakdown by payment methods
  const paymentBreakdown: { [key: string]: number } = {
    Pix: 0,
    Cartão: 0,
    Dinheiro: 0,
    Outros: 0,
  };

  sales.forEach((s) => {
    s.payments.forEach((p) => {
      if (p.paymentMethod === 'Pix') paymentBreakdown.Pix += p.amount;
      else if (p.paymentMethod.includes('Card') || p.paymentMethod.includes('Cartão'))
        paymentBreakdown.Cartão += p.amount;
      else if (p.paymentMethod === 'Cash' || p.paymentMethod === 'Dinheiro')
        paymentBreakdown.Dinheiro += p.amount;
      else paymentBreakdown.Outros += p.amount;
    });
  });

  const paymentChartData = [
    { name: 'Pix', valor: paymentBreakdown.Pix },
    { name: 'Cartão', valor: paymentBreakdown.Cartão },
    { name: 'Dinheiro', valor: paymentBreakdown.Dinheiro },
    { name: 'Outros', valor: paymentBreakdown.Outros },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
          Gestão Financeira & Fluxo de Caixa
        </h2>
        <p className="text-xs text-[#ACB0B0]">
          Receitas operacionais, liquidações por modalidade de pagamento e faturamento diário
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Hoje"
          value={
            isLoading
              ? '...'
              : `R$ ${todayAmount.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          subtitle="Vendas balcão e OS finalizadas hoje"
          icon={DollarSign}
          highlight={todayAmount > 0}
        />

        <StatCard
          title="Faturamento do Mês"
          value={
            isLoading
              ? '...'
              : `R$ ${totalMonth.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          subtitle={`Total de ${countMonth} venda(s) registrada(s)`}
          icon={TrendingUp}
        />

        <StatCard
          title="Ticket Médio"
          value={
            isLoading
              ? '...'
              : `R$ ${averageTicket.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          subtitle="Gasto médio por cliente"
          icon={Receipt}
        />

        <StatCard
          title="Recebido via Pix"
          value={
            isLoading
              ? '...'
              : `R$ ${paymentBreakdown.Pix.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          subtitle="Liquidação instantânea"
          icon={QrCode}
        />
      </div>

      {/* Payment methods comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
            Receitas por Modalidade de Pagamento
          </h3>
          <p className="text-xs text-[#ACB0B0] mb-4">Volume total faturado por forma de pagamento</p>

          <div className="h-56 w-full grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#ACB0B0" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#ACB0B0"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121E30',
                    borderColor: '#1F2E45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8F8F8',
                  }}
                  formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Valor']}
                />
                <Bar dataKey="valor" fill="#EF7410" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
            Últimas Transações Faturadas
          </h3>
          <p className="text-xs text-[#ACB0B0] mb-4">Entradas recentes com status e modalidade</p>

          <div className="space-y-2 grow overflow-y-auto max-h-56 custom-scrollbar">
            {sales.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/60 border border-[#1F2E45] text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-white">{s.number}</div>
                  <div className="text-[11px] text-[#ACB0B0]">
                    {s.customerName || 'Consumidor'} · {new Date(s.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#22C55E]">
                    R$ {Number(s.total).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#ACB0B0] font-mono">
                    {s.payments[0]?.paymentMethod || 'Liquidado'}
                  </div>
                </div>
              </div>
            ))}

            {sales.length === 0 && (
              <div className="py-8 text-center text-xs text-[#ACB0B0]">
                Nenhuma transação financeira registrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
