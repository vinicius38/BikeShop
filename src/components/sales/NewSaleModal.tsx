import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  ShoppingCart,
  Wrench,
  Package,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { serviceService } from '../../services/serviceService';
import { saleService, CreateSaleItemDto, CreateSalePaymentDto, PaymentMethodItem } from '../../services/saleService';
import { Customer, Product, ServiceItem } from '../../types/api';
import { QuickCustomerModal } from '../common/QuickCustomerModal';
import { maskCpfCnpj, maskCurrency, formatCurrencyTwoDecimals, parseCurrency } from '../../utils/maskUtils';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSale: any) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setAvailableServices] = useState<ServiceItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([
    { id: 2, name: 'Pix', code: 'PIX', isActive: true },
    { id: 1, name: 'Dinheiro', code: 'CASH', isActive: true },
    { id: 4, name: 'Cartão de Crédito', code: 'CREDIT', isActive: true },
    { id: 3, name: 'Cartão de Débito', code: 'DEBIT', isActive: true },
    { id: 5, name: 'Transferência', code: 'TRANSFER', isActive: true },
    { id: 6, name: 'Crediário', code: 'INSTALLMENT', isActive: true },
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<CreateSaleItemDto[]>([]);
  const [payments, setPayments] = useState<CreateSalePaymentDto[]>([]);

  // Search in catalog
  const [activeCatalogTab, setActiveCatalogTab] = useState<'products' | 'services'>('products');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Discount & notes
  const [discountStr, setDiscountStr] = useState<string>('0,00');
  const discount = parseCurrency(discountStr);
  const [notes, setNotes] = useState('');

  // Payment form
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number>(2);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [receivedCashAmount, setReceivedCashAmount] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      customerService.getAll({ pageSize: 50 }).then((res) => setCustomers(res.items)).catch(console.warn);
      productService.getAll({ pageSize: 50 }).then((res) => setProducts(res.items)).catch(console.warn);
      serviceService.getAll({ pageSize: 50 }).then((res) => setAvailableServices(res.items)).catch(console.warn);
      saleService
        .getPaymentMethods()
        .then((methods) => {
          if (Array.isArray(methods) && methods.length > 0) {
            setPaymentMethods(methods);
            const defaultMethod = methods.find((m) => m.code === 'PIX') || methods[0];
            setSelectedPaymentMethodId(defaultMethod.id);
          }
        })
        .catch(console.warn);

      // Reset
      setSelectedCustomer(null);
      setSaleItems([]);
      setPayments([]);
      setDiscountStr('0,00');
      setNotes('');
      setErrorMsg(null);
      setReceivedCashAmount('');
    }
  }, [isOpen]);

  // Financial calculations
  const subtotal = saleItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);

  // Auto set remaining as default payment amount when adding payment
  useEffect(() => {
    if (remaining > 0) {
      setPaymentAmount(formatCurrencyTwoDecimals(remaining));
    } else {
      setPaymentAmount('');
    }
  }, [remaining]);

  // Troco calculations (Change due)
  const actualPaidChange = totalPaid > total ? totalPaid - total : 0;
  const currentPayAmt = parseCurrency(paymentAmount);
  const pendingInputChange =
    payments.length === 0 && currentPayAmt > total
      ? currentPayAmt - total
      : currentPayAmt > remaining && remaining > 0
      ? currentPayAmt - remaining
      : 0;
  const cashNum = parseCurrency(receivedCashAmount);
  const cashChange =
    cashNum > total
      ? cashNum - total
      : cashNum > currentPayAmt && currentPayAmt > 0
      ? cashNum - currentPayAmt
      : 0;

  const effectiveChange = Math.max(actualPaidChange, cashChange, pendingInputChange);

  const handleAddItem = (
    type: 'product' | 'service',
    item: Product | ServiceItem
  ) => {
    if (type === 'product') {
      const p = item as Product;
      const existingIdx = saleItems.findIndex((i) => i.productId === p.id);
      if (existingIdx >= 0) {
        const copy = [...saleItems];
        copy[existingIdx].quantity += 1;
        setSaleItems(copy);
      } else {
        setSaleItems([
          ...saleItems,
          {
            itemType: 1,
            productId: p.id,
            serviceId: null,
            quantity: 1,
            unitPrice: p.salePrice,
            discount: 0,
          },
        ]);
      }
    } else {
      const s = item as ServiceItem;
      const existingIdx = saleItems.findIndex((i) => i.serviceId === s.id);
      if (existingIdx >= 0) {
        const copy = [...saleItems];
        copy[existingIdx].quantity += 1;
        setSaleItems(copy);
      } else {
        setSaleItems([
          ...saleItems,
          {
            itemType: 2,
            productId: null,
            serviceId: s.id,
            quantity: 1,
            unitPrice: s.salePrice ?? s.price ?? 0,
            discount: 0,
          },
        ]);
      }
    }
  };

  const handleAddPayment = () => {
    const val = parseCurrency(paymentAmount);
    if (!val || val <= 0) return;

    const method = paymentMethods.find((m) => m.id === selectedPaymentMethodId) || {
      id: selectedPaymentMethodId,
      name: 'Pix',
      code: 'PIX',
      isActive: true,
    };

    setPayments([
      ...payments,
      {
        paymentMethodId: method.id,
        paymentMethod: method.name,
        amount: val,
      },
    ]);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      setErrorMsg('Adicione ao menos um produto ou serviço à venda.');
      return;
    }

    if (payments.length === 0) {
      setErrorMsg('Informe ao menos uma forma de pagamento para liquidar a venda.');
      return;
    }

    if (totalPaid < total - 0.001) {
      setErrorMsg(`O valor pago (R$ ${formatCurrencyTwoDecimals(totalPaid)}) é inferior ao total da venda (R$ ${formatCurrencyTwoDecimals(total)}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const trocoInfo = effectiveChange > 0 ? ` [Troco Devolvido: R$ ${formatCurrencyTwoDecimals(effectiveChange)}]` : '';
    const finalNotes = (notes ? notes + trocoInfo : trocoInfo.trim()) || undefined;

    try {
      const created = await saleService.create({
        customerId: selectedCustomer ? selectedCustomer.id : null,
        discount: Number(discount) || 0,
        notes: finalNotes,
        items: saleItems.map((i) => ({
          itemType: i.itemType || (i.productId ? 1 : 2),
          productId: i.productId || null,
          serviceId: i.serviceId || null,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount || 0,
        })),
        payments: payments.map((p) => ({
          paymentMethodId: p.paymentMethodId,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          installments: 1,
        })),
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Venda"
      subtitle="Balcão rápido com múltiplos pagamentos, cálculo de troco e emissão imediata"
      maxWidth="5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column: Catalog selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customer selection */}
          <div className="p-3 rounded-xl bg-[#121E30] border border-[#1F2E45] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#ACB0B0] uppercase">
                Cliente (Opcional)
              </label>
              <button
                type="button"
                onClick={() => setIsQuickCustomerOpen(true)}
                className="text-[11px] text-[#EF7410] hover:text-[#EF7410]/80 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Cadastrar Novo Cliente
              </button>
            </div>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                const found = customers.find((c) => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className="w-full p-2 rounded-lg bg-[#0B1424] border border-[#1F2E45] text-white outline-hidden"
            >
              <option value="">Consumidor Final (Venda sem cadastro)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({maskCpfCnpj(c.cpfCnpj)})
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="text-[11px] text-[#22C55E] flex items-center justify-between pt-0.5">
                <span>Cliente selecionado: <strong>{selectedCustomer.name}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[10px] text-[#ACB0B0] hover:text-[#EF4444] underline"
                >
                  Desvincular
                </button>
              </div>
            )}
          </div>

          {/* Catalog Tabs & Search */}
          <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-[#121E30] rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('products')}
                  className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                    activeCatalogTab === 'products'
                      ? 'bg-[#EF7410] text-white shadow-xs'
                      : 'text-[#ACB0B0] hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Peças & Produtos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('services')}
                  className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                    activeCatalogTab === 'services'
                      ? 'bg-[#EF7410] text-white shadow-xs'
                      : 'text-[#ACB0B0] hover:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Serviços
                </button>
              </div>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-[#ACB0B0] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white placeholder-[#ACB0B0] outline-hidden text-xs"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {activeCatalogTab === 'products' ? (
                products
                  .filter((p) => p.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddItem('product', p)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/60 hover:bg-[#18263A] border border-[#1F2E45] cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] text-[#ACB0B0]">
                          Código: <span className="font-mono">{p.code}</span> · Estoque:{' '}
                          <span className="font-mono text-white">{p.stockQuantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#22C55E]">
                          R$ {Number(p.salePrice).toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#EF7410]/20 text-[#EF7410] font-bold">
                          +
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                services
                  .filter((s) => s.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleAddItem('service', s)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/60 hover:bg-[#18263A] border border-[#1F2E45] cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-[11px] text-[#ACB0B0]">
                          Duração: {s.estimatedTimeMinutes} min
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#3B82F6]">
                          R$ {Number(s.salePrice ?? s.price ?? 0).toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#EF7410]/20 text-[#EF7410] font-bold">
                          +
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cart, Totals & Payment (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Cart items */}
          <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-2">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#EF7410]" />
                Itens da Venda ({saleItems.length})
              </span>
              <button
                type="button"
                onClick={() => setSaleItems([])}
                className="text-[10px] text-[#EF4444] hover:underline"
              >
                Limpar
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {saleItems.length === 0 ? (
                <div className="py-6 text-center text-[#ACB0B0] text-xs">
                  Nenhum item adicionado à venda.
                </div>
              ) : (
                saleItems.map((item, idx) => {
                  const pRef = products.find((p) => p.id === item.productId);
                  const sRef = services.find((s) => s.id === item.serviceId);
                  const name = pRef ? pRef.name : sRef ? sRef.name : 'Item';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#121E30] border border-[#1F2E45]"
                    >
                      <div className="grow min-w-0 pr-2">
                        <div className="font-medium text-white truncate">{name}</div>
                        <div className="text-[10px] text-[#ACB0B0] font-mono">
                          {item.quantity}x R$ {Number(item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-white">
                          R$ {(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                          className="text-[#EF4444] hover:text-[#EF4444]/80 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subtotal & Discount */}
            <div className="pt-2 border-t border-[#1F2E45] space-y-1.5">
              <div className="flex justify-between text-[#ACB0B0]">
                <span>Subtotal:</span>
                <span className="font-mono text-white">R$ {formatCurrencyTwoDecimals(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#ACB0B0]">Desconto (R$):</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1 text-[11px] text-[#ACB0B0] font-mono pointer-events-none">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(maskCurrency(e.target.value))}
                    onBlur={() => setDiscountStr(formatCurrencyTwoDecimals(discountStr))}
                    className="w-full pl-7 pr-2 p-1 rounded bg-[#121E30] border border-[#1F2E45] text-right font-mono text-white text-xs outline-hidden focus:border-[#EF7410]"
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-[#1F2E45]">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono text-[#EF7410] text-base">R$ {formatCurrencyTwoDecimals(total)}</span>
              </div>
            </div>
          </div>

          {/* 21. Payment Methods: Pix, Cash, Debit, Credit, Multiple */}
          <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
            <span className="font-bold text-white uppercase text-[11px] block">
              Formas de Pagamento & Liquidação
            </span>

            {/* Add payment line */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPaymentMethodId}
                onChange={(e) => setSelectedPaymentMethodId(Number(e.target.value))}
                className="grow p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden text-xs cursor-pointer"
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <div className="relative w-32">
                <span className="absolute left-2.5 top-2 text-xs text-[#ACB0B0] font-mono pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(maskCurrency(e.target.value))}
                  onBlur={() => setPaymentAmount(paymentAmount ? formatCurrencyTwoDecimals(paymentAmount) : '')}
                  className="w-full pl-8 pr-2 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] font-mono text-white text-xs outline-hidden focus:border-[#EF7410]"
                />
              </div>

              <button
                type="button"
                onClick={handleAddPayment}
                className="px-3 py-2 bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold rounded-lg flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                title="Adicionar pagamento"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Payments registered */}
            <div className="space-y-1">
              {payments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded bg-[#121E30] text-xs font-mono"
                >
                  <span className="text-[#ACB0B0]">{p.paymentMethod}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#22C55E] font-bold">R$ {formatCurrencyTwoDecimals(p.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(idx)}
                      className="text-[#EF4444] p-0.5 cursor-pointer hover:opacity-80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dinheiro recebido & Troco */}
            {(paymentMethods.find((m) => m.id === selectedPaymentMethodId)?.code === 'CASH' ||
              paymentMethods.find((m) => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes('dinheiro')) && (
              <div className="p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#ACB0B0]">Valor em Dinheiro Entregue:</span>
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1 text-[11px] text-[#ACB0B0] font-mono pointer-events-none">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={receivedCashAmount}
                      onChange={(e) => setReceivedCashAmount(maskCurrency(e.target.value))}
                      onBlur={() => setReceivedCashAmount(receivedCashAmount ? formatCurrencyTwoDecimals(receivedCashAmount) : '')}
                      className="w-full pl-7 pr-2 p-1 rounded bg-[#0B1424] border border-[#1F2E45] text-right font-mono text-white text-xs outline-hidden focus:border-[#EF7410]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TROCO EM DESTAQUE - Exibido sempre que o valor informado/pago for maior que o total da venda */}
            {effectiveChange > 0 && (
              <div className="p-3.5 rounded-xl bg-[#22C55E]/15 border-2 border-[#22C55E]/50 flex items-center justify-between shadow-lg shadow-[#22C55E]/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider block">
                      Troco a Devolver
                    </span>
                    <span className="text-[11px] text-[#ACB0B0]">
                      Total: R$ {formatCurrencyTwoDecimals(total)} | Recebido: R$ {formatCurrencyTwoDecimals(total + effectiveChange)}
                    </span>
                  </div>
                </div>
                <div className="text-xl font-black text-[#22C55E] font-mono">
                  R$ {formatCurrencyTwoDecimals(effectiveChange)}
                </div>
              </div>
            )}

            {/* Status of payment */}
            <div className="pt-2 border-t border-[#1F2E45] flex items-center justify-between text-xs">
              <span className="text-[#ACB0B0]">Total Liquidado:</span>
              <span className="font-mono font-bold text-white">
                R$ {formatCurrencyTwoDecimals(totalPaid)} / R$ {formatCurrencyTwoDecimals(total)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#ACB0B0] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-lg bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-bold text-xs shadow-lg shadow-[#22C55E]/20 transition-colors flex items-center gap-2"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Concluir Venda & Emitir Recibo
            </button>
          </div>
        </div>
      </div>

      {/* Quick Customer Modal */}
      <QuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onCustomerCreated={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
          setSelectedCustomer(newCust);
        }}
      />
    </Modal>
  );
};
