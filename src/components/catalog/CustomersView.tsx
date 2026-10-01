import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Bike,
  ClipboardList,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  X,
  Lock,
} from 'lucide-react';
import { customerService, CreateCustomerDto } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { workOrderService } from '../../services/workOrderService';
import { saleService } from '../../services/saleService';
import { Customer, Bicycle, WorkOrder, Sale } from '../../types/api';
import { Pagination } from '../common/Pagination';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { maskCpfCnpj, maskCellPhone, maskPhone, maskCep } from '../../utils/maskUtils';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Detail Tab state (Bicycles, WorkOrders, Sales)
  const [detailTab, setDetailTab] = useState<'bicycles' | 'workOrders' | 'sales'>('bicycles');
  const [customerBicycles, setCustomerBicycles] = useState<Bicycle[]>([]);
  const [customerWorkOrders, setCustomerWorkOrders] = useState<WorkOrder[]>([]);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    cpfCnpj: '',
    phone: '',
    cellPhone: '',
    email: '',
    birthDate: '',
    notes: '',
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

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerService.getAll({
        page,
        pageSize,
        search: search || undefined,
      });
      setCustomers(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar clientes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Load details when detail modal opens
  useEffect(() => {
    if (detailCustomer) {
      setIsLoadingDetails(true);
      Promise.allSettled([
        bicycleService.getAll({ customerId: detailCustomer.id, pageSize: 20 }),
        workOrderService.getAll({ customerId: detailCustomer.id, pageSize: 20 }),
        saleService.getAll({ customerId: detailCustomer.id, pageSize: 20 }),
      ]).then(([bRes, wRes, sRes]) => {
        if (bRes.status === 'fulfilled') setCustomerBicycles(bRes.value.items);
        if (wRes.status === 'fulfilled') setCustomerWorkOrders(wRes.value.items);
        if (sRes.status === 'fulfilled') setCustomerSales(sRes.value.items);
        setIsLoadingDetails(false);
      });
    }
  }, [detailCustomer]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      cpfCnpj: '',
      phone: '',
      cellPhone: '',
      email: '',
      birthDate: '',
      notes: '',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      },
    });
    setErrorMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      cpfCnpj: maskCpfCnpj(c.cpfCnpj),
      phone: maskPhone(c.phone || ''),
      cellPhone: maskCellPhone(c.cellPhone || ''),
      email: c.email || '',
      birthDate: c.birthDate || '',
      notes: c.notes || '',
      address: {
        street: c.address?.street || '',
        number: c.address?.number || '',
        complement: c.address?.complement || '',
        neighborhood: c.address?.neighborhood || '',
        city: c.address?.city || '',
        state: c.address?.state || 'SP',
        zipCode: maskCep(c.address?.zipCode || ''),
      },
    });
    setErrorMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleCpfCnpjBlur = async () => {
    if (!formData.cpfCnpj) return;
    const cleanCpfCnpj = formData.cpfCnpj.replace(/\D/g, '');
    if (!cleanCpfCnpj) return;

    try {
      const res = await customerService.getAll({ cpfCnpj: cleanCpfCnpj });
      const existing = res.items.find((c) => c.cpfCnpj?.replace(/\D/g, '') === cleanCpfCnpj);
      if (existing && existing.id !== editingCustomer?.id) {
        setErrorMsg(`Atenção: Já existe um cliente cadastrado com este CPF/CNPJ (${existing.name}).`);
      } else {
        // If they fixed it, we might want to clear the error if it was specifically about CPF
        if (errorMsg?.includes('CPF/CNPJ')) setErrorMsg(null);
      }
    } catch (err) {
      console.error('Failed to validate CPF/CNPJ', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Final verification before submit
    if (formData.cpfCnpj) {
      const cleanCpfCnpj = formData.cpfCnpj.replace(/\D/g, '');
      if (cleanCpfCnpj) {
        try {
          const res = await customerService.getAll({ cpfCnpj: cleanCpfCnpj });
          const existing = res.items.find((c) => c.cpfCnpj?.replace(/\D/g, '') === cleanCpfCnpj);
          if (existing && existing.id !== editingCustomer?.id) {
            setErrorMsg(`Não é possível salvar. Já existe um cliente cadastrado com este CPF/CNPJ (${existing.name}).`);
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          // ignore network errors here, let backend handle if it fails
        }
      }
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        cpfCnpj: formData.cpfCnpj?.trim() || null,
        phone: formData.phone?.trim() || null,
        cellPhone: formData.cellPhone?.trim() || null,
        email: formData.email?.trim() || null,
        birthDate: formData.birthDate?.trim() ? formData.birthDate.trim() : null,
        notes: formData.notes?.trim() || null,
        address: formData.address ? {
          ...formData.address,
          street: formData.address.street?.trim() || '',
          number: formData.address.number?.trim() || '',
          complement: formData.address.complement?.trim() || null,
          neighborhood: formData.address.neighborhood?.trim() || '',
          city: formData.address.city?.trim() || '',
          state: formData.address.state?.trim() || 'MG',
          zipCode: formData.address.zipCode?.trim() || '',
        } : null,
      };

      if (editingCustomer) {
        await customerService.update(editingCustomer.id, payload as any);
      } else {
        await customerService.create(payload as any);
      }
      setIsCreateModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar cliente.');
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
            Base de Clientes
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Histórico completo de bicicletas, ordens de serviço e compras por cliente
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
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
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..."
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
                <th className="py-3 px-4">Nome do Cliente</th>
                <th className="py-3 px-4">CPF / CNPJ</th>
                <th className="py-3 px-4">Telefone / WhatsApp</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4 text-center">Bikes</th>
                <th className="py-3 px-4 text-center">OS</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#ACB0B0]">
                    Carregando clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#ACB0B0]">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetailCustomer(c)}
                    className="hover:bg-[#121E30]/50 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#EF7410]">
                      #{c.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-[#EF7410] transition-colors">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#ACB0B0] text-[11px]">{maskCpfCnpj(c.cpfCnpj)}</td>
                    <td className="py-3 px-4 font-mono text-white text-[11px]">
                      {maskCellPhone(c.cellPhone) || maskPhone(c.phone) || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-[#ACB0B0] truncate max-w-[180px]">
                      {c.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">
                      {c.bicyclesCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">
                      {c.workOrdersCount}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailCustomer(c)}
                          className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-white hover:bg-[#18263A]"
                          title="Ver Ficha do Cliente"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#18263A]"
                          title="Editar Cadastro"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Customer Full Detail Modal (Requirements: Dados pessoais, Bicicletas, OS, Histórico de compras) */}
      {detailCustomer && (
        <Modal
          isOpen={!!detailCustomer}
          onClose={() => setDetailCustomer(null)}
          title={`Ficha do Cliente · ${detailCustomer.name}`}
          subtitle={`CPF/CNPJ: ${maskCpfCnpj(detailCustomer.cpfCnpj)}`}
          maxWidth="4xl"
        >
          <div className="space-y-5 text-xs">
            {/* 23. Personal Data Header Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#121E30] border border-[#1F2E45]">
              <div className="space-y-1">
                <span className="text-[#ACB0B0] uppercase text-[10px] font-bold block">
                  Contato Direto
                </span>
                <p className="text-white font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#22C55E]" />
                  {maskCellPhone(detailCustomer.cellPhone) || maskPhone(detailCustomer.phone) || 'Sem telefone'}
                </p>
                <p className="text-[#ACB0B0] truncate flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#3B82F6]" />
                  {detailCustomer.email || 'Sem e-mail'}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[#ACB0B0] uppercase text-[10px] font-bold block">
                  Endereço Cadastrado
                </span>
                <p className="text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EF7410] shrink-0" />
                  {detailCustomer.address?.street
                    ? `${detailCustomer.address.street}, ${detailCustomer.address.number || 'S/N'} - ${
                        detailCustomer.address.neighborhood || ''
                      } - ${detailCustomer.address.city || ''}/${detailCustomer.address.state || ''} - CEP ${
                        maskCep(detailCustomer.address.zipCode) || ''
                      }`
                    : 'Endereço não informado'}
                </p>
              </div>
            </div>

            {/* Sub-tabs: Bicicletas, Ordens de Serviço, Histórico de Compras */}
            <div className="border-b border-[#1F2E45] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDetailTab('bicycles')}
                className={`px-4 py-2 border-b-2 font-semibold text-xs flex items-center gap-2 transition-colors ${
                  detailTab === 'bicycles'
                    ? 'border-[#EF7410] text-[#EF7410]'
                    : 'border-transparent text-[#ACB0B0] hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                Bicicletas ({customerBicycles.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('workOrders')}
                className={`px-4 py-2 border-b-2 font-semibold text-xs flex items-center gap-2 transition-colors ${
                  detailTab === 'workOrders'
                    ? 'border-[#EF7410] text-[#EF7410]'
                    : 'border-transparent text-[#ACB0B0] hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Ordens de Serviço ({customerWorkOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('sales')}
                className={`px-4 py-2 border-b-2 font-semibold text-xs flex items-center gap-2 transition-colors ${
                  detailTab === 'sales'
                    ? 'border-[#EF7410] text-[#EF7410]'
                    : 'border-transparent text-[#ACB0B0] hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Histórico de Vendas ({customerSales.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[180px]">
              {isLoadingDetails ? (
                <div className="py-8 text-center text-[#ACB0B0]">Carregando histórico...</div>
              ) : detailTab === 'bicycles' ? (
                customerBicycles.length === 0 ? (
                  <div className="py-8 text-center text-[#ACB0B0]">
                    Nenhuma bicicleta vinculada a este cliente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customerBicycles.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45]"
                      >
                        <div className="font-bold text-white text-sm">
                          {b.brand} {b.model}
                        </div>
                        <p className="text-[11px] text-[#ACB0B0] mt-0.5">
                          Cor: {b.color} · Quadro: {b.frameSize || 'N/A'} · Tipo: {b.type}
                        </p>
                        <p className="text-[10px] text-[#ACB0B0] font-mono mt-1">
                          Nº Série: {b.serialNumber || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : detailTab === 'workOrders' ? (
                customerWorkOrders.length === 0 ? (
                  <div className="py-8 text-center text-[#ACB0B0]">
                    Nenhuma ordem de serviço registrada para este cliente.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {customerWorkOrders.map((wo) => (
                      <div
                        key={wo.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45]"
                      >
                        <div>
                          <span className="font-mono font-bold text-white text-xs">{wo.number}</span>
                          <span className="text-[11px] text-[#ACB0B0] ml-3">
                            {new Date(wo.openingDate).toLocaleDateString('pt-BR')} · {wo.bicycleSummary}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge status={wo.status} size="sm">
                            {wo.statusName || wo.status}
                          </Badge>
                          <span className="font-mono font-bold text-white">
                            R$ {Number(wo.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : customerSales.length === 0 ? (
                <div className="py-8 text-center text-[#ACB0B0]">
                  Nenhuma compra registrada para este cliente.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {customerSales.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45]"
                    >
                      <div>
                        <span className="font-mono font-bold text-white text-xs">{s.number}</span>
                        <span className="text-[11px] text-[#ACB0B0] ml-3">
                          {new Date(s.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#22C55E]">
                        R$ {Number(s.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Create / Edit Form Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
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
                    Código do Cliente (Sequencial do Banco)
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {editingCustomer ? `#${editingCustomer.id}` : `Sequência Automática (#${totalItems + 1})`}
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  CPF / CNPJ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  maxLength={18}
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: maskCpfCnpj(e.target.value) })}
                  onBlur={handleCpfCnpjBlur}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  WhatsApp / Celular
                </label>
                <input
                  type="text"
                  placeholder="(35) 99999-9999"
                  maxLength={15}
                  value={formData.cellPhone || ''}
                  onChange={(e) => setFormData({ ...formData, cellPhone: maskCellPhone(e.target.value) })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Telefone Fixo
                </label>
                <input
                  type="text"
                  placeholder="(35) 3521-1122"
                  maxLength={14}
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">E-mail</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
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
                    placeholder="Logradouro / Rua"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    placeholder="UF (ex: MG)"
                    maxLength={2}
                    value={formData.address?.state || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, state: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white uppercase text-center font-mono"
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
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold shadow-md"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
