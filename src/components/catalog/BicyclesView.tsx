import React, { useState, useEffect, useCallback } from 'react';
import { Bike, Plus, Search, Edit, Trash2, User, Lock } from 'lucide-react';
import { bicycleService, CreateBicycleDto } from '../../services/bicycleService';
import { customerService } from '../../services/customerService';
import { Bicycle, Customer } from '../../types/api';
import { Pagination } from '../common/Pagination';
import { Modal } from '../common/Modal';
import { maskCpfCnpj } from '../../utils/maskUtils';

export const BicyclesView: React.FC = () => {
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBicycle, setEditingBicycle] = useState<Bicycle | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateBicycleDto>({
    customerId: 0,
    brand: '',
    model: '',
    color: '',
    frameSize: '',
    serialNumber: '',
    type: 'Mountain Bike (MTB)',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBicycles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bicycleService.getAll({
        page,
        pageSize,
        search: search || undefined,
      });
      setBicycles(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar bicicletas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    customerService.getAll({ pageSize: 100 }).then((res) => setCustomers(res.items)).catch(console.warn);
  }, []);

  useEffect(() => {
    loadBicycles();
  }, [loadBicycles]);

  const handleOpenCreate = () => {
    setEditingBicycle(null);
    setFormData({
      customerId: customers[0]?.id || 0,
      brand: '',
      model: '',
      color: '',
      frameSize: '17" (M)',
      serialNumber: '',
      type: 'Mountain Bike (MTB)',
      notes: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Bicycle) => {
    setEditingBicycle(b);
    setFormData({
      customerId: b.customerId,
      brand: b.brand,
      model: b.model,
      color: b.color,
      frameSize: b.frameSize || '',
      serialNumber: b.serialNumber || '',
      type: b.type,
      notes: b.notes || '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setErrorMsg('Vincule obrigatoriamente um cliente à bicicleta.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingBicycle) {
        await bicycleService.update(editingBicycle.id, formData);
      } else {
        await bicycleService.create(formData);
      }
      setIsModalOpen(false);
      loadBicycles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar bicicleta.');
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
            Bicicletas Cadastradas
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Controle de bikes vinculadas a clientes, marcas, modelos, cores e número de quadro
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Bicicleta
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
            placeholder="Buscar por marca, modelo, cliente ou número de quadro..."
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
                <th className="py-3 px-4">Marca & Modelo</th>
                <th className="py-3 px-4">Cliente Vinculado</th>
                <th className="py-3 px-4">Cor</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Quadro</th>
                <th className="py-3 px-4">Nº de Série</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#ACB0B0]">
                    Carregando bicicletas...
                  </td>
                </tr>
              ) : bicycles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#ACB0B0]">
                    Nenhum bicicleta encontrada.
                  </td>
                </tr>
              ) : (
                bicycles.map((b) => (
                  <tr key={b.id} className="hover:bg-[#121E30]/50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#EF7410]">
                      #{b.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {b.brand} {b.model}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#3B82F6]">{b.customerName}</span>
                    </td>
                    <td className="py-3 px-4 text-[#ACB0B0]">{b.color}</td>
                    <td className="py-3 px-4 text-white">{b.type}</td>
                    <td className="py-3 px-4 font-mono text-[#ACB0B0]">{b.frameSize || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-white text-[11px]">
                      {b.serialNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#18263A]"
                        title="Editar Bicicleta"
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
          title={editingBicycle ? 'Editar Bicicleta' : 'Cadastrar Nova Bicicleta'}
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
                    Código da Bicicleta (Sequencial do Banco)
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {editingBicycle ? `#${editingBicycle.id}` : `Sequência Automática (#${totalItems + 1})`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-[#EF7410]/15 text-[#EF7410] border border-[#EF7410]/30 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sequencial do Banco (Não Alterável)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Cliente Proprietário * (Vínculo Obrigatório)
              </label>
              <select
                required
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: parseInt(e.target.value) })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              >
                <option value="">Selecione o Cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({maskCpfCnpj(c.cpfCnpj)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Specialized, Trek, Caloi, Scott..."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chisel Comp, Rockhopper, Turbo Levo..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Cor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Preto/Laranja"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Tamanho Quadro
                </label>
                <input
                  type="text"
                  placeholder="Ex: 17, 19, M, L..."
                  value={formData.frameSize || ''}
                  onChange={(e) => setFormData({ ...formData, frameSize: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                >
                  <option value="Mountain Bike (MTB)">Mountain Bike (MTB)</option>
                  <option value="Speed / Road">Speed / Road</option>
                  <option value="Gravel">Gravel</option>
                  <option value="E-Bike / Elétrica">E-Bike / Elétrica</option>
                  <option value="Urbana / Passeio">Urbana / Passeio</option>
                  <option value="Infantil">Infantil</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Número do Quadro / Série (Gravação no Chassi)
              </label>
              <input
                type="text"
                placeholder="Ex: WSBC604123456X"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
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
                {isSubmitting ? 'Salvando...' : 'Salvar Bicicleta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
