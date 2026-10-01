import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, Search, Edit, Clock, DollarSign, Lock } from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { ServiceItem } from '../../types/api';
import { Pagination } from '../common/Pagination';
import { Modal } from '../common/Modal';
import { maskCurrency, formatCurrencyTwoDecimals, parseCurrency } from '../../utils/maskUtils';

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '100,00',
    cost: '30,00',
    estimatedTimeMinutes: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await serviceService.getAll({
        page,
        pageSize,
        search: search || undefined,
      });
      setServices(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar serviços:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '100,00',
      cost: '30,00',
      estimatedTimeMinutes: 60,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: ServiceItem) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      description: s.description || '',
      price: formatCurrencyTwoDecimals(s.salePrice ?? s.price ?? 0),
      cost: formatCurrencyTwoDecimals(s.costPrice ?? s.cost ?? 0),
      estimatedTimeMinutes: s.estimatedTimeMinutes,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        price: parseCurrency(formData.price),
        cost: parseCurrency(formData.cost),
      };

      if (editingService) {
        await serviceService.update(editingService.id, payload);
      } else {
        await serviceService.create(payload);
      }
      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Catálogo de Serviços de Oficina
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Tabela de mão de obra, tempos operacionais, custos e preços de revisão
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45]">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#ACB0B0] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar serviço por nome ou descrição..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1F2E45] bg-[#0B1424] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#121E30]/70 text-[11px] font-semibold uppercase tracking-wider text-[#ACB0B0]">
                <th className="py-3 px-4 w-20 text-center"># Cód</th>
                <th className="py-3 px-4">Nome do Serviço</th>
                <th className="py-3 px-4">Descrição Técnica</th>
                <th className="py-3 px-4 text-center">Tempo Estimado</th>
                <th className="py-3 px-4 text-right">Custo Base</th>
                <th className="py-3 px-4 text-right">Preço de Venda</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#ACB0B0]">
                    Carregando serviços...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#ACB0B0]">
                    Nenhum serviço cadastrado.
                  </td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id} className="hover:bg-[#121E30]/50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#EF7410]">
                      #{s.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{s.name}</td>
                    <td className="py-3 px-4 text-[#ACB0B0] truncate max-w-[280px]">
                      {s.description || 'Sem descrição'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-white">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                        {s.estimatedTimeMinutes} min
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#ACB0B0]">
                      R$ {formatCurrencyTwoDecimals(s.costPrice ?? s.cost ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#EF7410]">
                      R$ {formatCurrencyTwoDecimals(s.salePrice ?? s.price ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#18263A]"
                        title="Editar Serviço"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                {errorMsg}
              </div>
            )}

            {/* Sequential Code Display (Database sequence, read-only) */}
            <div className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#18263A] border border-[#1F2E45] flex items-center justify-center text-[#EF7410]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#ACB0B0] uppercase block">
                    Código do Serviço (Sequencial do Banco)
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {editingService ? `#${editingService.id}` : `Sequência Automática (#${totalItems + 1})`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-[#EF7410]/15 text-[#EF7410] border border-[#EF7410]/30 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sequencial do Banco (Não Alterável)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Nome do Serviço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Revisão Geral Premium, Sangria de Freios..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Descrição Técnica dos Procedimentos
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Preço Venda (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: maskCurrency(e.target.value) })
                    }
                    onBlur={() =>
                      setFormData({ ...formData, price: formatCurrencyTwoDecimals(formData.price) })
                    }
                    placeholder="0,00"
                    className="w-full pl-9 p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Custo Operacional (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: maskCurrency(e.target.value) })
                    }
                    onBlur={() =>
                      setFormData({ ...formData, cost: formatCurrencyTwoDecimals(formData.cost) })
                    }
                    placeholder="0,00"
                    className="w-full pl-9 p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Tempo Estimado (min)
                </label>
                <input
                  type="number"
                  step="5"
                  value={formData.estimatedTimeMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedTimeMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold shadow-md"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
