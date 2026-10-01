import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, Printer, Filter, DollarSign, Wrench, Layers } from 'lucide-react';
import { reportService } from '../../services/reportService';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'sales' | 'workOrders' | 'stock' | 'financial' | 'customers'>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        if (reportType === 'sales') {
          const res = await reportService.getSalesReport({ startDate, endDate });
          setData(res);
        } else if (reportType === 'workOrders') {
          const res = await reportService.getWorkOrdersReport({ startDate, endDate });
          setData(res);
        } else if (reportType === 'financial') {
          const res = await reportService.getFinancialReport({ startDate, endDate });
          setData(res);
        } else if (reportType === 'customers') {
          const res = await reportService.getCustomersReport({ startDate, endDate });
          setData(res);
        } else {
          const res = await reportService.getStockReport();
          setData(res);
        }
      } catch (err) {
        console.warn('Erro ao carregar relatório:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportType, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Relatórios Gerenciais
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Análises de faturamento de vendas, fechamento de ordens de serviço, posição de estoque e mais
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-lg bg-[#121E30] hover:bg-[#18263A] border border-[#1F2E45] text-white font-semibold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#EF7410]" />
          Imprimir Relatório
        </button>
      </div>

      {/* Report Type selector & Date filter */}
      <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-[#121E30] p-1 rounded-lg">
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              reportType === 'sales'
                ? 'bg-[#EF7410] text-white shadow-xs'
                : 'text-[#ACB0B0] hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Vendas & Faturamento
          </button>
          <button
            onClick={() => setReportType('workOrders')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              reportType === 'workOrders'
                ? 'bg-[#EF7410] text-white shadow-xs'
                : 'text-[#ACB0B0] hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Ordens de Serviço
          </button>
          <button
            onClick={() => setReportType('financial')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              reportType === 'financial'
                ? 'bg-[#EF7410] text-white shadow-xs'
                : 'text-[#ACB0B0] hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Recebimentos
          </button>
          <button
            onClick={() => setReportType('customers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              reportType === 'customers'
                ? 'bg-[#EF7410] text-white shadow-xs'
                : 'text-[#ACB0B0] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Clientes
          </button>
          <button
            onClick={() => setReportType('stock')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              reportType === 'stock'
                ? 'bg-[#EF7410] text-white shadow-xs'
                : 'text-[#ACB0B0] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Posição de Estoque
          </button>
        </div>

        {reportType !== 'stock' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden"
              title="Data Início"
            />
            <span className="text-[#ACB0B0]">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden"
              title="Data Fim"
            />
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Filtrar resultados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden w-full sm:w-64"
          />
        </div>
      </div>

      {/* Report Canvas */}
      <div className="p-6 rounded-xl border border-[#1F2E45] bg-[#0B1424] shadow-sm print-area">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#ACB0B0]">
            <span className="w-6 h-6 border-2 border-[#EF7410] border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Gerando relatório consolidado...
          </div>
        ) : !data || (!data.report) ? (
          <div className="py-16 text-center text-xs text-[#ACB0B0]">
            Nenhum dado retornado para o período selecionado.
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {data.report.title || (reportType === 'sales'
                    ? 'Relatório de Vendas e Liquidações'
                    : reportType === 'workOrders'
                    ? 'Relatório Operacional de Ordens de Serviço'
                    : 'Relatório')}
                </h3>
                <p className="text-xs text-[#ACB0B0] mt-0.5">
                  Emitido em: {new Date().toLocaleDateString('pt-BR')} às{' '}
                  {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#EF7410] uppercase">
                  VS Dev
                </span>
              </div>
            </div>

            {/* Display formatted JSON summary / tables */}
            <div className="p-4 rounded-xl bg-[#121E30] border border-[#1F2E45]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.report.summary && Object.entries(data.report.summary)
                  .filter(([k, v]) => typeof v === 'number' || typeof v === 'string')
                  .slice(0, 8)
                  .map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-[#ACB0B0] text-[10px] font-mono uppercase block">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <p className="text-sm font-bold font-mono text-white">
                        {typeof val === 'number' && key.toLowerCase().includes('amount')
                          ? `R$ ${val.toFixed(2)}`
                          : typeof val === 'number' && key.toLowerCase().includes('value')
                          ? `R$ ${val.toFixed(2)}`
                          : typeof val === 'number' && key.toLowerCase().includes('received')
                          ? `R$ ${val.toFixed(2)}`
                          : String(val)}
                      </p>
                    </div>
                  ))}
              </div>

              {/* ByMethod summary if available */}
              {data.report.summary?.byMethod && data.report.summary.byMethod.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#1F2E45]">
                  <h4 className="text-[#ACB0B0] text-[10px] font-mono uppercase mb-2">Totais por Forma de Pagamento</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {data.report.summary.byMethod.map((method: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[#ACB0B0] text-[10px] font-mono block">
                          {method.method || method.Method}
                        </span>
                        <p className="text-sm font-bold font-mono text-[#EF7410]">
                          R$ {Number(method.totalAmount || method.TotalAmount || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const itemsList = data.report.items || data.report.sales || data.report.products || data.report.workOrders || [];
              const filteredList = searchTerm
                ? itemsList.filter((item: any) => 
                    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : itemsList;

              if (!filteredList || filteredList.length === 0) return null;
              
              return (
                <div className="rounded-lg border border-[#1F2E45] overflow-hidden mt-6">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121E30] text-[#ACB0B0] uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Identificador</th>
                        <th className="p-3">Descrição / Referência</th>
                        <th className="p-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2E45]">
                      {filteredList.slice(0, 100).map((row: any, i: number) => (
                      <React.Fragment key={i}>
                        <tr>
                          <td className="p-3 font-mono font-semibold text-white">
                            {row.number || row.saleNumber || row.workOrderNumber || row.code || `#${i + 1}`}
                          </td>
                          <td className="p-3 text-[#ACB0B0]">
                            {row.customerName 
                              ? `${row.customerName} ${row.method ? `(${row.method})` : ''}` 
                              : row.name || row.description || row.method || 'Registro'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white">
                            R$ {Number(row.total || row.amount || row.salePrice || 0).toFixed(2)}
                          </td>
                        </tr>
                        {reportType === 'financial' && row.change > 0 && (
                          <tr className="bg-[#121E30]/30">
                            <td className="p-3 font-mono font-semibold text-white">
                              {row.saleNumber || row.workOrderNumber || `#${i + 1}`}
                            </td>
                            <td className="p-3 text-red-400">
                              Troco
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-red-400">
                              - R$ {Number(row.change).toFixed(2)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
