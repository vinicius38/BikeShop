import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Search, Edit, Phone, Mail, MapPin, Lock } from 'lucide-react';
import { supplierService, CreateSupplierDto } from '../../services/supplierService';
import { Supplier } from '../../types/api';
import { Pagination } from '../common/Pagination';
import { Modal } from '../common/Modal';
import { maskCnpj, maskPhoneOrCell, maskCellPhone, maskCep } from '../../utils/maskUtils';

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateSupplierDto>({
    corporateName: '',
    tradeName: '',
    cnpj: '',
    email: '',
    phone: '',
    cellPhone: '',
    contactPerson: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      zipCode: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await supplierService.getAll({
        page,
        pageSize,
        search: search || undefined,
      });
      setSuppliers(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar fornecedores:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      corporateName: '',
      tradeName: '',
      cnpj: '',
      email: '',
      phone: '',
      cellPhone: '',
      contactPerson: '',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '',
      },
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      corporateName: s.corporateName,
      tradeName: s.tradeName,
      cnpj: maskCnpj(s.cnpj),
      email: s.email || '',
      phone: maskPhoneOrCell(s.phone || ''),
      cellPhone: maskCellPhone(s.cellPhone || ''),
      contactPerson: s.contactPerson || '',
      address: {
        street: s.address?.street || '',
        number: s.address?.number || '',
        complement: s.address?.complement || '',
        neighborhood: s.address?.neighborhood || '',
        city: s.address?.city || '',
        state: s.address?.state || 'SP',
        zipCode: maskCep(s.address?.zipCode || ''),
      },
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, formData);
      } else {
        await supplierService.create(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar fornecedor.');
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
            Cadastro de Fornecedores
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Distribuidores de peças, componentes originais, ferramentas e lubrificantes
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Fornecedor
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
            placeholder="Buscar fornecedor por razão social, nome fantasia ou CNPJ..."
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
                <th className="py-3 px-4">Nome Fantasia / Razão Social</th>
                <th className="py-3 px-4">CNPJ</th>
                <th className="py-3 px-4">Telefone / WhatsApp</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Cidade / UF</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#ACB0B0]">
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#ACB0B0]">
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#121E30]/50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#EF7410]">
                      #{s.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.tradeName || s.corporateName}</div>
                      <div className="text-[11px] text-[#ACB0B0]">{s.corporateName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#ACB0B0] text-[11px]">{maskCnpj(s.cnpj)}</td>
                    <td className="py-3 px-4 font-mono text-white text-[11px]">
                      {maskCellPhone(s.cellPhone) || maskPhoneOrCell(s.phone) || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-[#ACB0B0] truncate max-w-[180px]">
                      {s.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-[#ACB0B0]">
                      {s.address ? `${s.address.city}/${s.address.state}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#18263A]"
                        title="Editar Fornecedor"
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
          title={editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
          maxWidth="2xl"
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
                    Código do Fornecedor (Sequencial do Banco)
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {editingSupplier ? `#${editingSupplier.id}` : `Sequência Automática (#${totalItems + 1})`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-[#EF7410]/15 text-[#EF7410] border border-[#EF7410]/30 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sequencial do Banco (Não Alterável)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Shimano Brasil, SRAM Distribuidora..."
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.corporateName}
                  onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="11.111.111/0001-11"
                  maxLength={18}
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: maskCnpj(e.target.value) })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(35) 99999-9999 ou (35) 3521-1122"
                  maxLength={15}
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: maskPhoneOrCell(e.target.value) })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="contato@fornecedor.com.br"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>
            </div>

            {/* Address */}
            <div className="p-3 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
              <span className="text-[11px] font-bold uppercase text-[#EF7410] block">
                Endereço
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Logradouro"
                    value={formData.address?.street || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, street: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Número"
                    value={formData.address?.number || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, number: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={formData.address?.neighborhood || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, neighborhood: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={formData.address?.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, city: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="CEP (00000-000)"
                    maxLength={9}
                    value={formData.address?.zipCode || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, zipCode: maskCep(e.target.value) },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                  />
                </div>
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
                {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
