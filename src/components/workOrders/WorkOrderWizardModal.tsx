import React, { useState, useEffect } from 'react';
import {
  Wrench,
  User,
  Bike,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  Search,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { userService } from '../../services/userService';
import { workOrderService, CreateWorkOrderDto } from '../../services/workOrderService';
import { Customer, Bicycle, User as UserType } from '../../types/api';
import { QuickCustomerModal } from '../common/QuickCustomerModal';
import { QuickBicycleModal } from '../common/QuickBicycleModal';
import { maskCpfCnpj, maskCellPhone, maskPhone } from '../../utils/maskUtils';

interface WorkOrderWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOs: any) => void;
}

export const WorkOrderWizardModal: React.FC<WorkOrderWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick modals for in-flow registration
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isQuickBicycleOpen, setIsQuickBicycleOpen] = useState(false);

  // Data sources
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [selectedBicycle, setSelectedBicycle] = useState<Bicycle | null>(null);

  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [assignedToUserId, setAssignedToUserId] = useState<number | null>(null);

  // Form fields
  const [openingDate, setOpeningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [description, setDescription] = useState('');
  const [customerComplaint, setCustomerComplaint] = useState('');
  const [technicalEvaluation, setTechnicalEvaluation] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'Alta' | 'Urgente'>('Normal');

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSelectedCustomer(null);
      setSelectedBicycle(null);
      setCustomerSearch('');
      setDescription('');
      setCustomerComplaint('');
      setTechnicalEvaluation('');
      setTechnicalNotes('');
      setOpeningDate(new Date().toISOString().split('T')[0]);
      setExpectedDate('');
      setPriority('Normal');

      // Load customers
      customerService
        .getAll({ pageSize: 50, isActive: true })
        .then((res) => setCustomers(res.items))
        .catch(console.warn);

      // Load technicians/users
      userService
        .getAll({ pageSize: 50 })
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.items || [];
          setTechnicians(list);
          if (list.length > 0 && !assignedToUserId) {
            setAssignedToUserId(list[0].id);
          }
        })
        .catch((err) => {
          console.warn('Erro ao carregar técnicos:', err);
          setTechnicians([]);
        });
    }
  }, [isOpen]);

  // Load bicycles when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      bicycleService
        .getAll({ customerId: selectedCustomer.id, pageSize: 20 })
        .then((res) => {
          setBicycles(res.items);
          if (res.items.length === 1) {
            setSelectedBicycle(res.items[0]);
          } else {
            setSelectedBicycle(null);
          }
        })
        .catch(console.warn);
    } else {
      setBicycles([]);
      setSelectedBicycle(null);
    }
  }, [selectedCustomer]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.cpfCnpj.includes(customerSearch) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setErrorMessage('Selecione o cliente atendido na ordem de serviço.');
      return;
    }
    if (!selectedBicycle) {
      setErrorMessage('Selecione a bicicleta que deu entrada na oficina.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Informe o problema relatado pelo cliente ou a descrição do atendimento.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateWorkOrderDto = {
      customerId: selectedCustomer.id,
      bicycleId: selectedBicycle.id,
      description: description.trim(),
      customerComplaint: customerComplaint.trim() || description.trim(),
      technicalEvaluation: technicalEvaluation.trim() || undefined,
      technicalNotes: technicalNotes.trim()
        ? `[Prioridade: ${priority}] ${technicalNotes.trim()}`
        : `[Prioridade: ${priority}]`,
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
      assignedToUserId: assignedToUserId || null,
      discount: 0,
      additionalCharge: 0,
      // No items initially! Living document flow:
      items: [],
    };

    try {
      const created = await workOrderService.create(payload);
      onClose();
      onSuccess(created);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Erro ao abrir a Ordem de Serviço. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nova Ordem de Serviço (Abertura de Atendimento)"
        subtitle="Registre os dados do cliente e da bicicleta. Peças e serviços serão adicionados ao longo do diagnóstico e execução."
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer & Bicycle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#EF7410]/15 hover:bg-[#EF7410]/25 text-[#EF7410] border border-[#EF7410]/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Novo Cliente
                </button>
              </div>

              {selectedCustomer ? (
                <div className="p-3 rounded-lg bg-[#121E30] border border-[#3B82F6]/40 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">{selectedCustomer.name}</h5>
                    <p className="text-[11px] text-[#ACB0B0] font-mono mt-0.5">
                      CPF: {maskCpfCnpj(selectedCustomer.cpfCnpj)} • Tel: {maskCellPhone(selectedCustomer.cellPhone) || maskPhone(selectedCustomer.phone) || 'Não informado'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[11px] text-[#ACB0B0] hover:text-[#EF4444] underline ml-2"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#ACB0B0] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Buscar por nome, CPF ou tel..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-[#1F2E45] rounded-lg p-1 bg-[#121E30]">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-2 text-center text-[11px] text-[#ACB0B0]">
                        Nenhum cliente encontrado.
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="w-full text-left p-2 rounded hover:bg-[#18263A] transition-colors flex items-center justify-between text-xs cursor-pointer"
                        >
                          <span className="font-semibold text-white">{c.name}</span>
                          <span className="text-[10px] text-[#ACB0B0] font-mono">
                            {maskCellPhone(c.cellPhone) || maskPhone(c.phone) || maskCpfCnpj(c.cpfCnpj)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bicycle Selection */}
            <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-[#EF7410]" />
                  Bicicleta *
                </label>
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => setIsQuickBicycleOpen(true)}
                    className="px-2.5 py-1 rounded bg-[#EF7410]/15 hover:bg-[#EF7410]/25 text-[#EF7410] border border-[#EF7410]/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Nova Bicicleta
                  </button>
                )}
              </div>

              {!selectedCustomer ? (
                <div className="p-4 rounded-lg bg-[#121E30] text-center text-xs text-[#ACB0B0] border border-dashed border-[#1F2E45]">
                  Primeiro selecione o cliente para listar as bicicletas cadastradas.
                </div>
              ) : selectedBicycle ? (
                <div className="p-3 rounded-lg bg-[#121E30] border border-[#EF7410]/40 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {selectedBicycle.brand} {selectedBicycle.model}
                    </h5>
                    <p className="text-[11px] text-[#ACB0B0] font-mono mt-0.5">
                      Cor: {selectedBicycle.color} • Nº Quadro: {selectedBicycle.serialNumber || 'S/N'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBicycle(null)}
                    className="text-[11px] text-[#ACB0B0] hover:text-[#EF4444] underline ml-2"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bicycles.length === 0 ? (
                    <div className="p-4 rounded-lg bg-[#121E30] text-center space-y-2">
                      <p className="text-xs text-[#ACB0B0]">
                        Este cliente ainda não possui nenhuma bicicleta cadastrada.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsQuickBicycleOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cadastrar Bicicleta Agora
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-[#1F2E45] rounded-lg p-1 bg-[#121E30]">
                      {bicycles.map((bike) => (
                        <button
                          key={bike.id}
                          type="button"
                          onClick={() => setSelectedBicycle(bike)}
                          className="w-full text-left p-2 rounded hover:bg-[#18263A] transition-colors flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-white">
                              {bike.brand} {bike.model}
                            </span>
                            <span className="text-[10px] text-[#ACB0B0] block">
                              Cor: {bike.color} {bike.serialNumber ? `• Nº ${bike.serialNumber}` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1424] text-[#ACB0B0]">
                            Selecionar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Dates, Responsibility & Priority */}
          <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#ACB0B0] uppercase mb-1">
                Data de Entrada
              </label>
              <input
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ACB0B0] uppercase mb-1">
                Previsão de Entrega
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ACB0B0] uppercase mb-1">
                Responsável Técnico
              </label>
              <select
                value={assignedToUserId || ''}
                onChange={(e) => setAssignedToUserId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              >
                <option value="">Selecione o Mecânico</option>
                {Array.isArray(technicians) &&
                  technicians.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ACB0B0] uppercase mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              >
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Section 3: Problem Description & Notes */}
          <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white mb-1">
                Problema Relatado pelo Cliente *
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Freio traseiro com ruído excessivo e marcha traseira pulando no cassete..."
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#ACB0B0] uppercase mb-1">
                  Avaliação Técnica / Laudo Inicial (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={technicalEvaluation}
                  onChange={(e) => setTechnicalEvaluation(e.target.value)}
                  placeholder="Ex: Pastilha de freio gasta, conduíte oxidado..."
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ACB0B0] uppercase mb-1">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Anotações para uso exclusivo da oficina..."
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
                />
              </div>
            </div>
          </div>

          {/* Notice banner */}
          <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[11px] text-[#ACB0B0] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>
              Ao salvar, a Ordem de Serviço será aberta e você poderá adicionar peças, serviços e acompanhar o status em tempo real na tela de detalhes.
            </span>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#ACB0B0] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedCustomer || !selectedBicycle || !description.trim()}
              className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-[#EF7410]/20 flex items-center gap-2 cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              Abrir Ordem de Serviço
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Customer Modal */}
      <QuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onCustomerCreated={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
          setSelectedCustomer(newCust);
          setIsQuickCustomerOpen(false);
        }}
      />

      {/* Quick Bicycle Modal */}
      {selectedCustomer && (
        <QuickBicycleModal
          isOpen={isQuickBicycleOpen}
          onClose={() => setIsQuickBicycleOpen(false)}
          customer={selectedCustomer}
          onBicycleCreated={(newBike) => {
            setBicycles((prev) => [newBike, ...prev]);
            setSelectedBicycle(newBike);
            setIsQuickBicycleOpen(false);
          }}
        />
      )}
    </>
  );
};
