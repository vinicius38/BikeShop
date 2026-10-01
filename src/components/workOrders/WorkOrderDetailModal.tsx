import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Bike,
  Wrench,
  Package,
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  Save,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { workOrderService, AddWorkOrderItemDto, UpdateWorkOrderItemDto, UpdateWorkOrderDto } from '../../services/workOrderService';
import { serviceService } from '../../services/serviceService';
import { productService } from '../../services/productService';
import { WorkOrder, WorkOrderStatus, WorkOrderItem, ServiceItem, Product, Sale } from '../../types/api';
import { ConvertWorkOrderToSaleModal } from './ConvertWorkOrderToSaleModal';
import { maskCurrency, formatCurrencyTwoDecimals, parseCurrency } from '../../utils/maskUtils';

interface WorkOrderDetailModalProps {
  workOrderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onPrint: (workOrder: WorkOrder) => void;
  onConvertedToSale?: (saleId: number) => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrderId,
  isOpen,
  onClose,
  onRefresh,
  onPrint,
  onConvertedToSale,
}) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<WorkOrderStatus>('InProgress');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Edit OS Details Modal
  const [showEditOsModal, setShowEditOsModal] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editComplaint, setEditComplaint] = useState('');
  const [editTechnicalEvaluation, setEditTechnicalEvaluation] = useState('');
  const [editTechnicalNotes, setEditTechnicalNotes] = useState('');
  const [editExpectedDate, setEditExpectedDate] = useState('');
  const [editDiscount, setEditDiscount] = useState<string>('0,00');
  const [editAdditionalCharge, setEditAdditionalCharge] = useState<string>('0,00');
  const [isSavingOs, setIsSavingOs] = useState(false);

  // Add Service Modal
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [catalogServices, setCatalogServices] = useState<ServiceItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceQty, setServiceQty] = useState<number>(1);
  const [servicePrice, setServicePrice] = useState<string>('0,00');
  const [serviceDiscount, setServiceDiscount] = useState<string>('0,00');
  const [isAddingService, setIsAddingService] = useState(false);

  // Add Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productDesc, setProductDesc] = useState('');
  const [productQty, setProductQty] = useState<number>(1);
  const [productPrice, setProductPrice] = useState<string>('0,00');
  const [productDiscount, setProductDiscount] = useState<string>('0,00');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Edit Item Modal (Products or Services)
  const [editingItem, setEditingItem] = useState<WorkOrderItem | null>(null);
  const [editItemQty, setEditItemQty] = useState<number>(1);
  const [editItemPrice, setEditItemPrice] = useState<string>('0,00');
  const [editItemDiscount, setEditItemDiscount] = useState<string>('0,00');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Remove Item Confirmation
  const [itemToRemove, setItemToRemove] = useState<WorkOrderItem | null>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  const fetchWorkOrder = async (id: number) => {
    try {
      const res = await workOrderService.getById(id);
      setWorkOrder(res);
    } catch (err) {
      console.warn('Erro ao carregar detalhes da OS:', err);
    }
  };

  useEffect(() => {
    if (isOpen && workOrderId) {
      setIsLoading(true);
      fetchWorkOrder(workOrderId).finally(() => setIsLoading(false));

      // Preload catalogs
      serviceService.getAll({ pageSize: 100, isActive: true }).then((res) => setCatalogServices(res.items)).catch(console.warn);
      productService.getAll({ pageSize: 100, isActive: true }).then((res) => setCatalogProducts(res.items)).catch(console.warn);
    } else {
      setWorkOrder(null);
    }
  }, [isOpen, workOrderId]);

  if (!isOpen) return null;

  // Open Edit OS Details
  const handleOpenEditOs = () => {
    if (!workOrder) return;
    setEditDescription(workOrder.description || '');
    setEditComplaint(workOrder.customerComplaint || '');
    setEditTechnicalEvaluation(workOrder.technicalEvaluation || '');
    setEditTechnicalNotes(workOrder.technicalNotes || '');
    setEditExpectedDate(
      workOrder.expectedDate ? new Date(workOrder.expectedDate).toISOString().split('T')[0] : ''
    );
    setEditDiscount(formatCurrencyTwoDecimals(workOrder.discount || 0));
    setEditAdditionalCharge(formatCurrencyTwoDecimals(workOrder.additionalCharge || 0));
    setShowEditOsModal(true);
  };

  const handleSaveOsDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;

    setIsSavingOs(true);
    try {
      const payload: UpdateWorkOrderDto = {
        description: editDescription,
        customerComplaint: editComplaint,
        technicalEvaluation: editTechnicalEvaluation,
        technicalNotes: editTechnicalNotes,
        expectedDate: editExpectedDate ? new Date(editExpectedDate).toISOString() : null,
        discount: parseCurrency(editDiscount),
        additionalCharge: parseCurrency(editAdditionalCharge),
      };

      const updated = await workOrderService.update(workOrder.id, payload);
      setWorkOrder(updated);
      setShowEditOsModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar dados da OS.');
    } finally {
      setIsSavingOs(false);
    }
  };

  // Status Change Helpers - Allow selecting any status for the OS
  const ALL_WORK_ORDER_STATUSES: { value: WorkOrderStatus; label: string }[] = [
    { value: 'Open', label: 'Aberta' },
    { value: 'WaitingApproval', label: 'Aguardando Aprovação' },
    { value: 'Approved', label: 'Aprovada' },
    { value: 'InProgress', label: 'Em Andamento' },
    { value: 'WaitingParts', label: 'Aguardando Peças' },
    { value: 'Ready', label: 'Pronta para Retirada' },
    { value: 'Delivered', label: 'Entregue ao Cliente' },
    { value: 'Cancelled', label: 'Cancelada' },
  ];

  const getAvailableNextStatuses = (_current?: WorkOrderStatus): { value: WorkOrderStatus; label: string }[] => {
    return ALL_WORK_ORDER_STATUSES;
  };

  const handleUpdateStatus = async () => {
    if (!workOrder) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await workOrderService.updateStatus(workOrder.id, nextStatus, statusReason);
      setWorkOrder(updated);
      setShowStatusModal(false);
      setStatusReason('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status da OS.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add Service
  const handleOpenAddService = () => {
    setSelectedServiceId(null);
    setServiceDesc('');
    setServiceQty(1);
    setServicePrice('0,00');
    setServiceDiscount('0,00');
    setServiceSearch('');
    setShowAddServiceModal(true);
  };

  const handleSelectCatalogService = (svc: ServiceItem) => {
    setSelectedServiceId(svc.id);
    setServiceDesc(svc.name);
    setServicePrice(formatCurrencyTwoDecimals(svc.salePrice ?? svc.price ?? 0));
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;

    if (!serviceDesc.trim()) {
      alert('Selecione ou descreva o serviço a ser adicionado.');
      return;
    }

    setIsAddingService(true);
    try {
      const payload: AddWorkOrderItemDto = {
        itemType: 'Service',
        serviceId: selectedServiceId || null,
        description: serviceDesc.trim(),
        quantity: Number(serviceQty) || 1,
        unitPrice: parseCurrency(servicePrice),
        discount: parseCurrency(serviceDiscount),
      };

      const updated = await workOrderService.addItem(workOrder.id, payload);
      setWorkOrder(updated);
      setShowAddServiceModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar serviço.');
    } finally {
      setIsAddingService(false);
    }
  };

  // Add Product
  const handleOpenAddProduct = () => {
    setSelectedProductId(null);
    setProductDesc('');
    setProductQty(1);
    setProductPrice('0,00');
    setProductDiscount('0,00');
    setProductSearch('');
    setShowAddProductModal(true);
  };

  const handleSelectCatalogProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setProductDesc(prod.name);
    setProductPrice(formatCurrencyTwoDecimals(prod.salePrice ?? 0));
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;

    if (!selectedProductId && !productDesc.trim()) {
      alert('Selecione um produto cadastrado.');
      return;
    }

    setIsAddingProduct(true);
    try {
      const payload: AddWorkOrderItemDto = {
        itemType: 'Product',
        productId: selectedProductId || null,
        description: productDesc.trim(),
        quantity: Number(productQty) || 1,
        unitPrice: parseCurrency(productPrice),
        discount: parseCurrency(productDiscount),
      };

      const updated = await workOrderService.addItem(workOrder.id, payload);
      setWorkOrder(updated);
      setShowAddProductModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar peça/produto.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Edit Item (Service or Product)
  const handleOpenEditItem = (item: WorkOrderItem) => {
    setEditingItem(item);
    setEditItemQty(item.quantity);
    setEditItemPrice(formatCurrencyTwoDecimals(item.unitPrice));
    setEditItemDiscount(formatCurrencyTwoDecimals(item.discount || 0));
    setEditItemDesc(item.description || item.serviceName || item.productName || '');
  };

  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder || !editingItem) return;

    setIsSavingItem(true);
    try {
      const payload: UpdateWorkOrderItemDto = {
        quantity: Number(editItemQty) || 1,
        unitPrice: parseCurrency(editItemPrice),
        discount: parseCurrency(editItemDiscount),
        description: editItemDesc.trim(),
      };

      const updated = await workOrderService.updateItem(workOrder.id, editingItem.id, payload);
      setWorkOrder(updated);
      setEditingItem(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  // Remove Item
  const handleConfirmRemoveItem = async () => {
    if (!workOrder || !itemToRemove) return;

    setIsRemovingItem(true);
    try {
      const updated = await workOrderService.removeItem(workOrder.id, itemToRemove.id);
      setWorkOrder(updated);
      setItemToRemove(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover item da OS.');
    } finally {
      setIsRemovingItem(false);
    }
  };

  // Operational Timeline Steps
  const timelineSteps: { key: WorkOrderStatus; label: string }[] = [
    { key: 'Open', label: 'Aberta' },
    { key: 'WaitingApproval', label: 'Aguardando Aprovação' },
    { key: 'Approved', label: 'Aprovada' },
    { key: 'InProgress', label: 'Em Andamento' },
    { key: 'Ready', label: 'Pronta' },
    { key: 'Delivered', label: 'Entregue' },
  ];

  const getStepIndex = (status?: string) => {
    switch (status) {
      case 'Open':
        return 0;
      case 'WaitingApproval':
        return 1;
      case 'Approved':
        return 2;
      case 'InProgress':
      case 'WaitingParts':
        return 3;
      case 'Ready':
        return 4;
      case 'Delivered':
        return 5;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(workOrder?.status);

  const services = (workOrder?.items || []).filter(
    (i) => i.itemType === 'Service' || (i as any).itemTypeName === 'Service'
  );
  const products = (workOrder?.items || []).filter(
    (i) => i.itemType === 'Product' || (i as any).itemTypeName === 'Product'
  );

  const subtotalServices = services.reduce(
    (sum, i) => sum + (i.unitPrice * i.quantity - (i.discount || 0)),
    0
  );
  const subtotalProducts = products.reduce(
    (sum, i) => sum + (i.unitPrice * i.quantity - (i.discount || 0)),
    0
  );

  const filteredCatalogServices = catalogServices.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredCatalogProducts = catalogProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(productSearch))
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={workOrder ? `Ordem de Serviço #${workOrder.number}` : 'Carregando OS...'}
        subtitle={
          workOrder
            ? `Entrada em ${new Date(workOrder.openingDate).toLocaleDateString('pt-BR')}`
            : ''
        }
        maxWidth="5xl"
      >
        {isLoading || !workOrder ? (
          <div className="py-20 text-center text-xs text-[#ACB0B0]">
            <span className="w-6 h-6 border-2 border-[#EF7410] border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Carregando documento técnico da OS...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#121E30] border border-[#1F2E45]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNextStatus(workOrder.status);
                    setShowStatusModal(true);
                  }}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title="Clique para alterar status da OS"
                >
                  <Badge status={workOrder.status}>{workOrder.statusName || workOrder.status}</Badge>
                </button>
                {workOrder.saleNumber && (
                  <span className="text-xs font-mono font-semibold text-[#22C55E] bg-[#22C55E]/15 border border-[#22C55E]/30 px-2 py-0.5 rounded">
                    Venda Vinculada: #{workOrder.saleNumber}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPrint(workOrder)}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1424] hover:bg-[#18263A] border border-[#1F2E45] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#EF7410]" />
                  Imprimir OS
                </button>

                <button
                  type="button"
                  onClick={handleOpenEditOs}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1424] hover:bg-[#18263A] border border-[#1F2E45] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Editar Dados
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNextStatus(workOrder.status);
                    setShowStatusModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1424] hover:bg-[#18263A] border border-[#1F2E45] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Alterar status da OS para qualquer etapa"
                >
                  <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Alterar Status
                </button>

                {!workOrder.saleId && workOrder.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!workOrder.items || workOrder.items.length === 0) {
                        alert('A Ordem de Serviço precisa ter pelo menos um produto ou serviço adicionado para ser transformada em venda.');
                        return;
                      }
                      setShowConvertModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Transformar em Venda
                  </button>
                )}
              </div>
            </div>

            {/* Operational Status Timeline */}
            <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#ACB0B0]">
                  Linha do Tempo do Atendimento
                </h4>
                {workOrder.expectedDate && (
                  <span className="text-[11px] font-mono text-[#EF7410] bg-[#EF7410]/10 px-2 py-0.5 rounded border border-[#EF7410]/20">
                    Previsão de Entrega: {new Date(workOrder.expectedDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between overflow-x-auto gap-2">
                {timelineSteps.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            isCurrent
                              ? 'border-[#EF7410] bg-[#EF7410]/20 text-[#EF7410]'
                              : isDone
                              ? 'border-[#22C55E] bg-[#22C55E]/20 text-[#22C55E]'
                              : 'border-[#1F2E45] bg-[#121E30] text-[#ACB0B0]/40'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-medium mt-1 whitespace-nowrap ${
                            isCurrent ? 'text-white font-semibold' : 'text-[#ACB0B0]'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div
                          className={`h-0.5 w-6 sm:w-10 mb-4 ${
                            currentStepIndex > idx ? 'bg-[#22C55E]' : 'bg-[#1F2E45]'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Bicycle Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3B82F6]">
                  <User className="w-4 h-4" />
                  Dados do Cliente
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">{workOrder.customerName}</h5>
                  <p className="text-xs text-[#ACB0B0] font-mono mt-0.5">
                    Telefone/WhatsApp: {workOrder.customerPhone || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Bicycle */}
              <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#EF7410]">
                  <Bike className="w-4 h-4" />
                  Bicicleta em Atendimento
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">
                    {workOrder.bicycleBrand} {workOrder.bicycleModel}
                  </h5>
                  <p className="text-xs text-[#ACB0B0] font-mono mt-0.5">
                    Nº de Série / Quadro: {workOrder.bicycleSerialNumber || 'Não identificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Problem & Technical Notes */}
            <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase text-[#ACB0B0] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#EF7410]" />
                  Problema Relatado pelo Cliente:
                </span>
                <p className="text-xs text-white mt-1 leading-relaxed bg-[#121E30] p-3 rounded-lg border border-[#1F2E45]">
                  {workOrder.customerComplaint || workOrder.description || 'Nenhum relato fornecido.'}
                </p>
              </div>

              {workOrder.technicalEvaluation && (
                <div>
                  <span className="text-xs font-semibold uppercase text-[#ACB0B0]">
                    Avaliação Técnica / Laudo:
                  </span>
                  <p className="text-xs text-white mt-1 leading-relaxed bg-[#121E30] p-3 rounded-lg border border-[#1F2E45]">
                    {workOrder.technicalEvaluation}
                  </p>
                </div>
              )}

              {workOrder.technicalNotes && (
                <div>
                  <span className="text-xs font-semibold uppercase text-[#ACB0B0]">
                    Observações Internas / Técnicas:
                  </span>
                  <p className="text-xs text-[#ACB0B0] mt-1 leading-relaxed bg-[#121E30] p-3 rounded-lg border border-[#1F2E45] italic">
                    {workOrder.technicalNotes}
                  </p>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SERVIÇOS SECTION                                         */}
            {/* ======================================================== */}
            <div className="rounded-xl border border-[#1F2E45] overflow-hidden bg-[#0B1424]">
              <div className="px-4 py-3 bg-[#121E30] border-b border-[#1F2E45] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Serviços de Oficina ({services.length})
                  </span>
                  {services.length > 0 && (
                    <span className="text-xs font-mono text-[#3B82F6] font-semibold ml-2">
                      Subtotal: R$ {formatCurrencyTwoDecimals(subtotalServices)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddService}
                  className="px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Serviço
                </button>
              </div>

              <div className="divide-y divide-[#1F2E45]">
                {services.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#ACB0B0] space-y-1">
                    <p className="font-medium text-white">Nenhum serviço adicionado.</p>
                    <p className="text-[11px]">
                      Conforme o diagnóstico e reparos forem realizados, adicione os serviços executados.
                    </p>
                  </div>
                ) : (
                  services.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between text-xs hover:bg-[#121E30]/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="text-white font-semibold text-xs block">
                          {item.description || item.serviceName}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-[#ACB0B0] font-mono">
                          <span>Qtd: {item.quantity}</span>
                          <span>Unitário: R$ {formatCurrencyTwoDecimals(item.unitPrice)}</span>
                          {item.discount > 0 && (
                            <span className="text-[#22C55E]">Desc: -R$ {formatCurrencyTwoDecimals(item.discount)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">
                          R$ {formatCurrencyTwoDecimals(Number(item.unitPrice) * item.quantity - (item.discount || 0))}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded hover:bg-[#18263A] text-[#ACB0B0] hover:text-[#3B82F6] transition-colors cursor-pointer"
                            title="Editar serviço"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToRemove(item)}
                            className="p-1.5 rounded hover:bg-[#18263A] text-[#ACB0B0] hover:text-[#EF4444] transition-colors cursor-pointer"
                            title="Remover serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* PRODUTOS / PEÇAS SECTION                                 */}
            {/* ======================================================== */}
            <div className="rounded-xl border border-[#1F2E45] overflow-hidden bg-[#0B1424]">
              <div className="px-4 py-3 bg-[#121E30] border-b border-[#1F2E45] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Peças & Produtos ({products.length})
                  </span>
                  {products.length > 0 && (
                    <span className="text-xs font-mono text-[#22C55E] font-semibold ml-2">
                      Subtotal: R$ {formatCurrencyTwoDecimals(subtotalProducts)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Produto
                </button>
              </div>

              <div className="divide-y divide-[#1F2E45]">
                {products.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#ACB0B0] space-y-1">
                    <p className="font-medium text-white">Nenhum produto ou peça adicionado.</p>
                    <p className="text-[11px]">
                      Adicione componentes, correntes, pastilhas ou câmaras conforme a necessidade da manutenção.
                    </p>
                  </div>
                ) : (
                  products.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between text-xs hover:bg-[#121E30]/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-xs">
                            {item.description || item.productName}
                          </span>
                          {item.productSku && (
                            <span className="text-[10px] font-mono text-[#ACB0B0] bg-[#121E30] px-1.5 py-0.5 rounded border border-[#1F2E45]">
                              SKU: {item.productSku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#ACB0B0] font-mono">
                          <span>Qtd: {item.quantity}</span>
                          <span>Unitário: R$ {formatCurrencyTwoDecimals(item.unitPrice)}</span>
                          {item.discount > 0 && (
                            <span className="text-[#22C55E]">Desc: -R$ {formatCurrencyTwoDecimals(item.discount)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">
                          R$ {formatCurrencyTwoDecimals(Number(item.unitPrice) * item.quantity - (item.discount || 0))}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded hover:bg-[#18263A] text-[#ACB0B0] hover:text-[#3B82F6] transition-colors cursor-pointer"
                            title="Editar peça"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToRemove(item)}
                            className="p-1.5 rounded hover:bg-[#18263A] text-[#ACB0B0] hover:text-[#EF4444] transition-colors cursor-pointer"
                            title="Remover peça"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Totals & Summary */}
            <div className="p-4 rounded-xl bg-[#121E30] border border-[#1F2E45] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#ACB0B0]">
                <span>Serviços:</span>
                <span className="font-mono text-white">R$ {formatCurrencyTwoDecimals(subtotalServices)}</span>
              </div>
              <div className="flex items-center justify-between text-[#ACB0B0]">
                <span>Produtos & Peças:</span>
                <span className="font-mono text-white">R$ {formatCurrencyTwoDecimals(subtotalProducts)}</span>
              </div>
              {workOrder.discount > 0 && (
                <div className="flex items-center justify-between text-[#22C55E]">
                  <span>Desconto na OS:</span>
                  <span className="font-mono">- R$ {formatCurrencyTwoDecimals(workOrder.discount)}</span>
                </div>
              )}
              {workOrder.additionalCharge > 0 && (
                <div className="flex items-center justify-between text-[#ACB0B0]">
                  <span>Acréscimo:</span>
                  <span className="font-mono">+ R$ {formatCurrencyTwoDecimals(workOrder.additionalCharge)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#1F2E45] flex items-center justify-between text-sm">
                <span className="font-bold text-white uppercase tracking-wider">TOTAL DA ORDEM DE SERVIÇO:</span>
                <span className="text-2xl font-black text-[#EF7410] font-mono">
                  R$ {formatCurrencyTwoDecimals(workOrder.total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR SERVIÇO                                 */}
      {/* ======================================================== */}
      {showAddServiceModal && (
        <Modal
          isOpen={showAddServiceModal}
          onClose={() => setShowAddServiceModal(false)}
          title="Adicionar Serviço à OS"
          subtitle="Selecione um serviço cadastrado no catálogo ou descreva um serviço avulso."
          maxWidth="lg"
        >
          <form onSubmit={handleAddServiceSubmit} className="space-y-4 text-xs">
            {/* Catalog search & selection */}
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Buscar no Catálogo de Serviços
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#ACB0B0] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Filtrar por nome do serviço..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
                />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1 border border-[#1F2E45] rounded-lg p-1 bg-[#0B1424]">
                {filteredCatalogServices.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => handleSelectCatalogService(svc)}
                    className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors cursor-pointer ${
                      selectedServiceId === svc.id ? 'bg-[#3B82F6]/20 border border-[#3B82F6]' : 'hover:bg-[#121E30]'
                    }`}
                  >
                    <span className="font-semibold text-white">{svc.name}</span>
                    <span className="font-mono text-[#EF7410]">R$ {Number(svc.salePrice ?? svc.price ?? 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Descrição do Serviço *
              </label>
              <input
                type="text"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Ex: Regulagem de câmbio traseiro..."
                required
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            {/* Quantidade, Valor Unitário, Desconto */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={serviceQty}
                  onChange={(e) => setServiceQty(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Valor Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(maskCurrency(e.target.value))}
                    onBlur={() => setServicePrice(formatCurrencyTwoDecimals(servicePrice))}
                    required
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Desconto (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={serviceDiscount}
                    onChange={(e) => setServiceDiscount(maskCurrency(e.target.value))}
                    onBlur={() => setServiceDiscount(formatCurrencyTwoDecimals(serviceDiscount))}
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Subtotal preview */}
            <div className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45] flex items-center justify-between text-xs">
              <span className="text-[#ACB0B0]">Total deste serviço:</span>
              <span className="font-mono text-base font-bold text-[#3B82F6]">
                R$ {formatCurrencyTwoDecimals(Math.max(0, parseCurrency(servicePrice) * serviceQty - parseCurrency(serviceDiscount)))}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="px-4 py-2 rounded-lg text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAddingService || !serviceDesc.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isAddingService ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar Serviço
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR PRODUTO / PEÇA                          */}
      {/* ======================================================== */}
      {showAddProductModal && (
        <Modal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          title="Adicionar Peça / Produto à OS"
          subtitle="Busque pelo nome, SKU ou código de barras para carregar preço e estoque disponível."
          maxWidth="lg"
        >
          <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
            {/* Catalog search */}
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Pesquisar Peça (Nome, SKU ou Código)
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#ACB0B0] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ex: Corrente Shimano, pastilha, pneu..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 border border-[#1F2E45] rounded-lg p-1 bg-[#0B1424]">
                {filteredCatalogProducts.length === 0 ? (
                  <div className="p-3 text-center text-[#ACB0B0] text-[11px]">
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  filteredCatalogProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectCatalogProduct(prod)}
                      className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors cursor-pointer ${
                        selectedProductId === prod.id
                          ? 'bg-[#22C55E]/20 border border-[#22C55E]'
                          : 'hover:bg-[#121E30]'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-white block">{prod.name}</span>
                        <span className="text-[10px] text-[#ACB0B0] font-mono">
                          SKU: {prod.code} • Estoque: {prod.stockQuantity} {prod.unit}
                        </span>
                      </div>
                      <span className="font-mono text-[#22C55E] font-bold">
                        R$ {Number(prod.salePrice ?? 0).toFixed(2)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected product name */}
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Nome da Peça Selecionada *
              </label>
              <input
                type="text"
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                placeholder="Ex: Corrente Shimano Deore..."
                required
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            {/* Quantidade, Preço Unitário, Desconto */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={productQty}
                  onChange={(e) => setProductQty(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Preço Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={productPrice}
                    onChange={(e) => setProductPrice(maskCurrency(e.target.value))}
                    onBlur={() => setProductPrice(formatCurrencyTwoDecimals(productPrice))}
                    required
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Desconto (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={productDiscount}
                    onChange={(e) => setProductDiscount(maskCurrency(e.target.value))}
                    onBlur={() => setProductDiscount(formatCurrencyTwoDecimals(productDiscount))}
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Subtotal preview */}
            <div className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45] flex items-center justify-between text-xs">
              <span className="text-[#ACB0B0]">Total desta peça:</span>
              <span className="font-mono text-base font-bold text-[#22C55E]">
                R$ {formatCurrencyTwoDecimals(Math.max(0, parseCurrency(productPrice) * productQty - parseCurrency(productDiscount)))}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 rounded-lg text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAddingProduct || (!selectedProductId && !productDesc.trim())}
                className="px-5 py-2.5 rounded-lg bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isAddingProduct ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar Peça
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR ITEM (SERVIÇO OU PRODUTO)                   */}
      {/* ======================================================== */}
      {editingItem && (
        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={`Editar ${editingItem.itemType === 'Service' ? 'Serviço' : 'Produto/Peça'}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveItemEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Descrição / Nome
              </label>
              <input
                type="text"
                value={editItemDesc}
                onChange={(e) => setEditItemDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={editItemQty}
                  onChange={(e) => setEditItemQty(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Valor Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(maskCurrency(e.target.value))}
                    onBlur={() => setEditItemPrice(formatCurrencyTwoDecimals(editItemPrice))}
                    required
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Desconto (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editItemDiscount}
                    onChange={(e) => setEditItemDiscount(maskCurrency(e.target.value))}
                    onBlur={() => setEditItemDiscount(formatCurrencyTwoDecimals(editItemDiscount))}
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45] flex items-center justify-between text-xs">
              <span className="text-[#ACB0B0]">Novo Total:</span>
              <span className="font-mono text-base font-bold text-[#EF7410]">
                R$ {formatCurrencyTwoDecimals(Math.max(0, parseCurrency(editItemPrice) * editItemQty - parseCurrency(editItemDiscount)))}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingItem}
                className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isSavingItem ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR DADOS DA OS                                */}
      {/* ======================================================== */}
      {showEditOsModal && (
        <Modal
          isOpen={showEditOsModal}
          onClose={() => setShowEditOsModal(false)}
          title="Editar Informações da Ordem de Serviço"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveOsDetails} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Problema Relatado / Descrição
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Avaliação Técnica / Laudo do Mecânico
              </label>
              <textarea
                rows={2}
                value={editTechnicalEvaluation}
                onChange={(e) => setEditTechnicalEvaluation(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Observações Internas
              </label>
              <textarea
                rows={2}
                value={editTechnicalNotes}
                onChange={(e) => setEditTechnicalNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Previsão de Entrega
                </label>
                <input
                  type="date"
                  value={editExpectedDate}
                  onChange={(e) => setEditExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Desconto Geral (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(maskCurrency(e.target.value))}
                    onBlur={() => setEditDiscount(formatCurrencyTwoDecimals(editDiscount))}
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Acréscimo Geral (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editAdditionalCharge}
                    onChange={(e) => setEditAdditionalCharge(maskCurrency(e.target.value))}
                    onBlur={() => setEditAdditionalCharge(formatCurrencyTwoDecimals(editAdditionalCharge))}
                    placeholder="0,00"
                    className="w-full pl-9 px-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setShowEditOsModal(false)}
                className="px-4 py-2 rounded-lg text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingOs}
                className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isSavingOs ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Dados da OS
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Pagamento e Faturamento ao transformar OS em Venda */}
      {showConvertModal && (
        <ConvertWorkOrderToSaleModal
          workOrder={workOrder}
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          onSuccess={(sale) => {
            setShowConvertModal(false);
            onRefresh();
            const saleId = sale?.id;
            if (onConvertedToSale && saleId) {
              onClose();
              onConvertedToSale(saleId);
            } else if (workOrder) {
              fetchWorkOrder(workOrder.id);
            }
          }}
        />
      )}

      {/* Remove Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleConfirmRemoveItem}
        title="Remover Item da Ordem de Serviço"
        message={`Deseja realmente remover "${itemToRemove?.description || itemToRemove?.serviceName || itemToRemove?.productName}" desta Ordem de Serviço?`}
        confirmText="Remover Item"
        variant="danger"
        isLoading={isRemovingItem}
      />

      {/* Status Update Modal */}
      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Atualizar Status Operacional da OS"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {workOrder && (
              <div className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45] flex items-center justify-between">
                <span className="text-[#ACB0B0] font-medium">Status Atual:</span>
                <Badge status={workOrder.status}>{workOrder.statusName || workOrder.status}</Badge>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Selecionar Novo Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as WorkOrderStatus)}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden cursor-pointer"
              >
                {ALL_WORK_ORDER_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Motivo / Justificativa / Observação
              </label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Ex: Peças chegaram, revisão finalizada, etc."
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleUpdateStatus}
                className="px-4 py-2 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold flex items-center gap-1.5"
              >
                {isUpdatingStatus && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Salvar Status
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
