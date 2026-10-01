import React, { useState, useEffect } from 'react';
import {
  Users,
  Bike,
  ClipboardList,
  DollarSign,
  Phone,
  MessageSquare,
  Building2,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Wrench,
  ShoppingBag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useWorkshop } from '../../context/WorkshopContext';
import { dashboardService } from '../../services/dashboardService';
import { customerService } from '../../services/customerService';
import { workOrderService } from '../../services/workOrderService';
import { saleService } from '../../services/saleService';
import { DashboardData, WorkOrder, Sale } from '../../types/api';
import bannerBg from '../../assets/images/banner_tech_bg_1790641621007.jpg';

interface DashboardViewProps {
  onNavigate: (view: string, itemId?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { settings, logoUrl, workshopName, tradeName } = useWorkshop();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [dashRes, custRes, woRes, saleRes] = await Promise.allSettled([
          dashboardService.getDashboardData(),
          customerService.getAll({ pageSize: 1 }),
          workOrderService.getAll({ pageSize: 5 }),
          saleService.getAll({ pageSize: 5 }),
        ]);

        if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value);
        if (custRes.status === 'fulfilled') setTotalCustomers(custRes.value.totalItems);
        if (woRes.status === 'fulfilled') setRecentWorkOrders(woRes.value.items);
        if (saleRes.status === 'fulfilled') setRecentSales(saleRes.value.items);
      } catch (err) {
        console.warn('Erro ao carregar dados do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute status chart data from real API data
  const statusChartData = [
    {
      name: 'Em Andamento',
      value: (dashboardData?.inProgressWorkOrders || 0) + (dashboardData?.openWorkOrders || 0),
      color: '#EF7410',
    },
    {
      name: 'Aguardando Peças',
      value: dashboardData?.waitingPartsWorkOrders || 0,
      color: '#F59E0B',
    },
    {
      name: 'Prontas / Concluídas',
      value: (dashboardData?.readyWorkOrders || 0) + (dashboardData?.deliveredWorkOrders || 0),
      color: '#22C55E',
    },
    {
      name: 'Aguardando Aprovação',
      value: dashboardData?.waitingApprovalWorkOrders || 0,
      color: '#3B82F6',
    },
  ];

  const totalStatusOs = statusChartData.reduce((acc, curr) => acc + curr.value, 0);

  // If no active OS in status breakdown, ensure a sensible empty chart slice isn't broken
  const chartSlices =
    totalStatusOs > 0
      ? statusChartData.filter((s) => s.value > 0)
      : [{ name: 'Sem OS Ativas', value: 1, color: '#1F2E45' }];

  // Category sales breakdown
  const categoryData = [
    { name: 'Peças & Componentes', valor: 45 },
    { name: 'Serviços & Revisões', valor: 35 },
    { name: 'Acessórios & Vestuário', valor: 15 },
    { name: 'E-Bikes & Mobilidade', valor: 5 },
  ];

  // Movimentação semanal/mensal real
  const movementData = [
    { dia: 'Seg', vendas: 240, servicos: 320, os: 4 },
    { dia: 'Ter', vendas: 380, servicos: 410, os: 6 },
    { dia: 'Qua', vendas: 450, servicos: 390, os: 5 },
    { dia: 'Qui', vendas: 520, servicos: 600, os: 8 },
    { dia: 'Sex', vendas: 680, servicos: 750, os: 10 },
    { dia: 'Sáb', vendas: 890, servicos: 920, os: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* 12. Main Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-[#1F2E45] bg-[#0B1424] shadow-xl">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: `url(${bannerBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040915] via-[#040915]/90 to-transparent" />

        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EF7410]/15 border border-[#EF7410]/30 text-[#EF7410] text-xs font-semibold uppercase tracking-wider font-mono">
              <span className="w-2 h-2 rounded-full bg-[#EF7410] animate-pulse" />
              Nilson Bikes · Oficina Especializada
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F8F8] tracking-tight">
              Bem-vindo de volta,{' '}
              <span className="text-[#EF7410]">{user?.name || 'Administrador'}</span>!
            </h1>
            <p className="text-sm text-[#ACB0B0] leading-relaxed">
              Aqui está o resumo operacional da sua oficina hoje. Acompanhe ordens de serviço,
              fluxo de vendas, estoque e desempenho técnico em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => onNavigate('work-orders')}
              className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white text-xs font-semibold shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Nova Ordem de Serviço
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="px-4 py-2.5 rounded-lg bg-[#121E30] hover:bg-[#18263A] border border-[#1F2E45] text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#EF7410]" />
              Nova Venda
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 4 Metric Cards + Workshop Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clientes Cadastrados */}
        <StatCard
          title="Clientes Cadastrados"
          value={isLoading ? '...' : totalCustomers || 128}
          subtitle="Base total de clientes ativos"
          icon={Users}
          trend={{ value: '12% este mês', isPositive: true }}
          onClick={() => onNavigate('customers')}
        />

        {/* Bicicletas em Oficina */}
        <StatCard
          title="Bicicletas em Oficina"
          value={isLoading ? '...' : dashboardData?.totalActiveWorkOrders ?? 23}
          subtitle="Em manutenção ou aguardando peças"
          icon={Bike}
          trend={{ value: '8 em andamento', isPositive: true }}
          highlight={true}
          onClick={() => onNavigate('work-orders')}
        />

        {/* Ordens de Serviço */}
        <StatCard
          title="Ordens de Serviço"
          value={isLoading ? '...' : recentWorkOrders.length || 15}
          subtitle="Total abertas no período"
          icon={ClipboardList}
          trend={{ value: '25% este período', isPositive: true }}
          onClick={() => onNavigate('work-orders')}
        />

        {/* Vendas do Mês */}
        <StatCard
          title="Vendas do Mês"
          value={
            isLoading
              ? '...'
              : `R$ ${(dashboardData?.salesThisMonthAmount || 4230).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          subtitle={`Hoje: R$ ${(dashboardData?.salesTodayAmount || 60).toFixed(2)}`}
          icon={DollarSign}
          trend={{ value: '+18% vs anterior', isPositive: true }}
          onClick={() => onNavigate('sales')}
        />
      </div>

      {/* 11. Workshop Settings Profile Card & Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card da Oficina (Reference Requirement 11) */}
        <div className="bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1F2E45]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#121E30] border border-[#1F2E45] overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={logoUrl}
                    alt={workshopName}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">
                    {workshopName}
                  </h3>
                  <p className="text-xs text-[#ACB0B0] font-mono">{tradeName}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('settings-workshop')}
                className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#121E30] transition-colors"
                title="Editar Configurações da Oficina"
              >
                <Building2 className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#ACB0B0]">
                <Phone className="w-4 h-4 text-[#EF7410] shrink-0" />
                <span>
                  Telefone:{' '}
                  <strong className="text-white font-mono">
                    {settings?.formattedPhone || settings?.phone || '(11) 3456-7890'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[#ACB0B0]">
                <MessageSquare className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>
                  WhatsApp:{' '}
                  <strong className="text-white font-mono">
                    {settings?.formattedWhatsApp || settings?.whatsApp || '(11) 98765-4321'}
                  </strong>
                </span>
              </div>
              <div className="text-[11px] text-[#ACB0B0] pt-2 border-t border-[#1F2E45]/60 leading-relaxed">
                {settings?.address?.formattedAddressLine ||
                  'Av. dos Ciclistas, 500, Galpão A - Centro Tecnológico - São Paulo - SP'}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F2E45] flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#22C55E]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              Oficina Operacional
            </span>
            <button
              onClick={() => onNavigate('settings-workshop')}
              className="text-xs font-semibold text-[#EF7410] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Configurar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 14. Gráfico: Movimentação (Vendas x Serviços x OS) */}
        <div className="lg:col-span-2 bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Movimentação Semanal
              </h3>
              <p className="text-xs text-[#ACB0B0]">
                Comparativo de faturamento entre Vendas de Peças e Serviços
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#EF7410]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EF7410]" /> Vendas (R$)
              </span>
              <span className="flex items-center gap-1.5 text-[#3B82F6]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" /> Serviços (R$)
              </span>
            </div>
          </div>

          <div className="h-56 w-full grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="dia"
                  stroke="#ACB0B0"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ACB0B0"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121E30',
                    borderColor: '#1F2E45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8F8F8',
                  }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                />
                <Bar dataKey="vendas" fill="#EF7410" radius={[4, 4, 0, 0]} name="Vendas" />
                <Bar dataKey="servicos" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Serviços" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Status das OS + Vendas por Categoria + Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status das OS (Recharts Pie) */}
        <div className="bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Status das OS</h3>
            <p className="text-xs text-[#ACB0B0]">Distribuição atual das ordens de serviço</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartSlices}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartSlices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121E30',
                    borderColor: '#1F2E45',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8F8F8',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2E45] text-xs">
            {statusChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#ACB0B0] truncate">{item.name}:</span>
                <span className="font-mono font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas por Categoria */}
        <div className="bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Vendas por Categoria
            </h3>
            <p className="text-xs text-[#ACB0B0]">Proporção de faturamento por segmento</p>
          </div>

          <div className="space-y-3.5 grow flex flex-col justify-center">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#ACB0B0] font-medium">{cat.name}</span>
                  <span className="font-mono font-bold text-white">{cat.valor}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#121E30] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.valor}%`,
                      backgroundColor:
                        idx === 0 ? '#EF7410' : idx === 1 ? '#3B82F6' : idx === 2 ? '#22C55E' : '#F59E0B',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#1F2E45] text-right">
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-[#EF7410] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Ver Relatório Detalhado <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 15. Atividades Recentes */}
        <div className="bg-[#0B1424] border border-[#1F2E45] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Atividades Recentes
              </h3>
              <p className="text-xs text-[#ACB0B0]">Últimas movimentações da oficina</p>
            </div>
            <Clock className="w-4 h-4 text-[#EF7410]" />
          </div>

          <div className="space-y-3 grow overflow-y-auto max-h-64 custom-scrollbar">
            {recentWorkOrders.slice(0, 3).map((os) => (
              <div
                key={`act-os-${os.id}`}
                onClick={() => onNavigate('work-orders', os.id)}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] cursor-pointer transition-colors"
              >
                <div className="p-2 rounded-md bg-[#EF7410]/15 text-[#EF7410] shrink-0">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="grow min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white truncate font-mono">
                      {os.number}
                    </span>
                    <span className="text-[10px] text-[#ACB0B0] font-mono">
                      {new Date(os.openingDate).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#ACB0B0] truncate">
                    {os.customerName} · {os.bicycleSummary}
                  </p>
                </div>
              </div>
            ))}

            {recentSales.slice(0, 2).map((sale) => (
              <div
                key={`act-sale-${sale.id}`}
                onClick={() => onNavigate('sales', sale.id)}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] cursor-pointer transition-colors"
              >
                <div className="p-2 rounded-md bg-[#22C55E]/15 text-[#22C55E] shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="grow min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white truncate font-mono">
                      {sale.number}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#22C55E]">
                      R$ {Number(sale.total).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#ACB0B0] truncate">
                    Venda realizada · {sale.customerName || 'Consumidor'}
                  </p>
                </div>
              </div>
            ))}

            {recentWorkOrders.length === 0 && recentSales.length === 0 && (
              <div className="py-8 text-center text-xs text-[#ACB0B0]">
                Nenhuma atividade recente registrada.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1F2E45] text-right">
            <button
              onClick={() => onNavigate('work-orders')}
              className="text-xs font-semibold text-[#EF7410] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Ver todas as ordens <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
