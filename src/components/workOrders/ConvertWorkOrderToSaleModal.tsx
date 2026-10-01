import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  DollarSign,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Bike,
  User,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { WorkOrder, Sale } from '../../types/api';
import {
  workOrderService,
  ConvertWorkOrderPaymentDto,
} from '../../services/workOrderService';
import { saleService, PaymentMethodItem } from '../../services/saleService';
import { maskCurrency, formatCurrencyTwoDecimals, parseCurrency } from '../../utils/maskUtils';

interface ConvertWorkOrderToSaleModalProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
}

export const ConvertWorkOrderToSaleModal: React.FC<ConvertWorkOrderToSaleModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([
    { id: 2, name: 'Pix', code: 'PIX', isActive: true },
    { id: 1, name: 'Dinheiro', code: 'CASH', isActive: true },
    { id: 4, name: 'Cartão de Crédito', code: 'CREDIT', isActive: true },
    { id: 3, name: 'Cartão de Débito', code: 'DEBIT', isActive: true },
    { id: 5, name: 'Transferência', code: 'TRANSFER', isActive: true },
    { id: 6, name: 'Crediário', code: 'INSTALLMENT', isActive: true },
  ]);

  const [discount, setDiscount] = useState<string>('0');
  const [additionalCharge, setAdditionalCharge] = useState<string>('0');

  // Payments list
  const [payments, setPayments] = useState<ConvertWorkOrderPaymentDto[]>([]);

  // Current payment input form
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number>(2);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [cashGiven, setCashGiven] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subtotal from OS items
  const itemsSubtotal = (workOrder?.items || []).reduce(
    (acc, curr) => acc + (curr.unitPrice * curr.quantity - (curr.discount || 0)),
    0
  );

  const discountVal = Math.max(0, parseCurrency(discount));
  const additionalVal = Math.max(0, parseCurrency(additionalCharge));

  // Total to pay after discount and additional charge
  const totalToPay = Math.max(0, itemsSubtotal - discountVal + additionalVal);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, totalToPay - totalPaid);

  // Load payment methods when modal opens
  useEffect(() => {
    if (isOpen && workOrder) {
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

      // Default discount from OS if any
      setDiscount(workOrder.discount ? formatCurrencyTwoDecimals(workOrder.discount) : '0,00');
      setAdditionalCharge(workOrder.additionalCharge ? formatCurrencyTwoDecimals(workOrder.additionalCharge) : '0,00');

      const initialTotal = Math.max(
        0,
        itemsSubtotal - (workOrder.discount || 0) + (workOrder.additionalCharge || 0)
      );

      // Pre-fill payment amount with the full remaining value
      setPaymentAmount(initialTotal > 0 ? formatCurrencyTwoDecimals(initialTotal) : '');
      setPayments([]);
      setCashGiven('');
      setInstallments(1);
      setErrorMsg(null);
    }
  }, [isOpen, workOrder]);

  if (!isOpen || !workOrder) return null;

  const currentMethod =
    paymentMethods.find((m) => m.id === selectedPaymentMethodId) || paymentMethods[0];
  const isCashMethod =
    currentMethod?.code === 'CASH' || currentMethod?.name?.toLowerCase().includes('dinheiro');

  const cashGivenVal = parseCurrency(cashGiven);
  const currentPayAmt = parseCurrency(paymentAmount);

  // Troco calculations (Change due)
  const actualPaidChange = totalPaid > totalToPay ? totalPaid - totalToPay : 0;
  const cashChange =
    cashGivenVal > totalToPay
      ? cashGivenVal - totalToPay
      : cashGivenVal > currentPayAmt && currentPayAmt > 0
      ? cashGivenVal - currentPayAmt
      : 0;
  const pendingChange =
    payments.length === 0 && currentPayAmt > totalToPay
      ? currentPayAmt - totalToPay
      : currentPayAmt > remainingBalance && remainingBalance > 0
      ? currentPayAmt - remainingBalance
      : 0;
  const effectiveTroco = Math.max(actualPaidChange, cashChange, pendingChange);

  const handleAddPayment = () => {
    setErrorMsg(null);
    const amt = parseCurrency(paymentAmount);
    if (!amt || amt <= 0) {
      setErrorMsg('Informe um valor de pagamento válido.');
      return;
    }

    const newPayment: ConvertWorkOrderPaymentDto = {
      paymentMethodId: currentMethod.id,
      paymentMethod: currentMethod.name,
      amount: amt,
      installments: currentMethod.code === 'CREDIT' ? installments : 1,
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);

    // Calculate new remaining
    const newTotalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
    const newRemaining = Math.max(0, totalToPay - newTotalPaid);

    if (newRemaining > 0) {
      setPaymentAmount(formatCurrencyTwoDecimals(newRemaining));
    } else {
      setPaymentAmount('');
    }
    setCashGiven('');
  };

  const handleRemovePayment = (index: number) => {
    const updated = payments.filter((_, i) => i !== index);
    setPayments(updated);
    const newTotalPaid = updated.reduce((acc, p) => acc + p.amount, 0);
    const newRemaining = Math.max(0, totalToPay - newTotalPaid);
    setPaymentAmount(formatCurrencyTwoDecimals(newRemaining));
  };

  const handleFillFullRemaining = () => {
    setPaymentAmount(formatCurrencyTwoDecimals(remainingBalance));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (payments.length === 0) {
      setErrorMsg('Adicione pelo menos uma forma de pagamento para faturar a OS.');
      return;
    }

    if (totalPaid < totalToPay - 0.001) {
      setErrorMsg(
        `O total pago (R$ ${formatCurrencyTwoDecimals(totalPaid)}) é inferior ao total a pagar (R$ ${formatCurrencyTwoDecimals(totalToPay)}). Lance mais pagamentos.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const trocoInfo = effectiveTroco > 0 ? ` [Troco Devolvido: R$ ${formatCurrencyTwoDecimals(effectiveTroco)}]` : '';
      const payload = {
        discount: discountVal,
        additionalCharge: additionalVal,
        customerNotes: trocoInfo.trim() || undefined,
        payments: payments.map((p) => ({
          paymentMethodId: p.paymentMethodId,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          installments: p.installments || 1,
        })),
      };

      const result = await workOrderService.convertToSale(workOrder.id, payload);
      onSuccess(result);
    } catch (err: any) {
      console.error('Erro ao converter OS em venda:', err);
      setErrorMsg(
        err.message || 'Falha ao transformar Ordem de Serviço em venda. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transformar OS #${workOrder.number} em Venda`}
      subtitle="Informe os descontos, acréscimos e forma de pagamento para faturamento"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs text-white">
        {/* Header Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#121E30] border border-[#1F2E45]">
          <div>
            <span className="text-[#ACB0B0] block text-[11px] uppercase font-semibold">Cliente</span>
            <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
              <User className="w-3.5 h-3.5 text-[#EF7410]" />
              <span className="truncate">{workOrder.customerName}</span>
            </div>
            <span className="text-[11px] text-[#ACB0B0] font-mono">{workOrder.customerPhone || 'Sem telefone'}</span>
          </div>

          <div>
            <span className="text-[#ACB0B0] block text-[11px] uppercase font-semibold">Bicicleta</span>
            <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Bike className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="truncate">{workOrder.bicycleBrand} {workOrder.bicycleModel}</span>
            </div>
            <span className="text-[11px] text-[#ACB0B0] font-mono truncate block">
              {workOrder.bicycleSerialNumber || 'Sem nº de série'}
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-[#ACB0B0] block text-[11px] uppercase font-semibold">Subtotal dos Itens</span>
            <div className="text-base font-extrabold text-white font-mono mt-0.5">
              R$ {itemsSubtotal.toFixed(2)}
            </div>
            <span className="text-[11px] text-[#ACB0B0]">
              {(workOrder.items || []).length} item(ns) incluído(s)
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Adjustment Section: Desconto & Acréscimo */}
        <div className="p-3.5 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#EF7410]" />
            Ajustes de Preço (Desconto / Acréscimo)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#ACB0B0] uppercase mb-1">
                Desconto (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#ACB0B0] pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={discount}
                  onChange={(e) => setDiscount(maskCurrency(e.target.value))}
                  onBlur={() => setDiscount(formatCurrencyTwoDecimals(discount))}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white font-mono outline-hidden focus:border-[#EF7410]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#ACB0B0] uppercase mb-1">
                Acréscimo / Taxas (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#ACB0B0] pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={additionalCharge}
                  onChange={(e) => setAdditionalCharge(maskCurrency(e.target.value))}
                  onBlur={() => setAdditionalCharge(formatCurrencyTwoDecimals(additionalCharge))}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white font-mono outline-hidden focus:border-[#EF7410]"
                />
              </div>
            </div>
          </div>

          {/* Quick summary line */}
          <div className="pt-2 border-t border-[#1F2E45] flex items-center justify-between text-xs">
            <span className="text-[#ACB0B0]">
              Subtotal: <strong className="text-white font-mono">R$ {formatCurrencyTwoDecimals(itemsSubtotal)}</strong>
              {discountVal > 0 && (
                <span className="text-[#EF4444] ml-2 font-mono">- R$ {formatCurrencyTwoDecimals(discountVal)} desc.</span>
              )}
              {additionalVal > 0 && (
                <span className="text-[#F59E0B] ml-2 font-mono">+ R$ {formatCurrencyTwoDecimals(additionalVal)} acrésc.</span>
              )}
            </span>
            <div className="text-sm font-bold text-white">
              Total Líquido:{' '}
              <span className="font-mono text-[#22C55E] text-base">
                R$ {formatCurrencyTwoDecimals(totalToPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="p-3.5 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#3B82F6]" />
              Forma de Pagamento
            </h4>
            {remainingBalance > 0 && (
              <button
                type="button"
                onClick={handleFillFullRemaining}
                className="text-[11px] text-[#EF7410] hover:underline font-semibold cursor-pointer"
              >
                Pagar Saldo Restante (R$ {formatCurrencyTwoDecimals(remainingBalance)})
              </button>
            )}
          </div>

          {/* Add payment inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-[#ACB0B0] uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={selectedPaymentMethodId}
                onChange={(e) => setSelectedPaymentMethodId(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410] cursor-pointer"
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-[#ACB0B0] uppercase mb-1">
                Valor do Pagamento
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#ACB0B0] pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(maskCurrency(e.target.value))}
                  onBlur={() => setPaymentAmount(paymentAmount ? formatCurrencyTwoDecimals(paymentAmount) : '')}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white font-mono outline-hidden focus:border-[#EF7410]"
                />
              </div>
            </div>

            {currentMethod?.code === 'CREDIT' ? (
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#ACB0B0] uppercase mb-1">
                  Parcelas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}x {currentPayAmt > 0 ? `(R$ ${formatCurrencyTwoDecimals(currentPayAmt / n)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="sm:col-span-3">
                {isCashMethod && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#ACB0B0] uppercase mb-1">
                      Dinheiro Entregue
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-[#ACB0B0] pointer-events-none">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(maskCurrency(e.target.value))}
                        onBlur={() => setCashGiven(cashGiven ? formatCurrencyTwoDecimals(cashGiven) : '')}
                        placeholder="Ex: 100,00"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white font-mono outline-hidden focus:border-[#EF7410]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddPayment}
                className="w-full py-2 px-3 bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Adicionar Linha de Pagamento"
              >
                <Plus className="w-3.5 h-3.5" />
                Lançar
              </button>
            </div>
          </div>

          {/* Troco box whenever payment or cash entered is greater than total */}
          {effectiveTroco > 0 && (
            <div className="p-3.5 rounded-xl bg-[#22C55E]/15 border-2 border-[#22C55E]/50 flex items-center justify-between shadow-lg shadow-[#22C55E]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider block">
                    Troco a devolver ao cliente:
                  </span>
                  <span className="text-[11px] text-[#ACB0B0]">
                    Total da Venda: R$ {formatCurrencyTwoDecimals(totalToPay)}
                  </span>
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#22C55E] font-mono">
                R$ {formatCurrencyTwoDecimals(effectiveTroco)}
              </div>
            </div>
          )}

          {/* Payments list table */}
          {payments.length > 0 && (
            <div className="mt-3 border border-[#1F2E45] rounded-lg overflow-hidden bg-[#121E30]">
              <div className="px-3 py-1.5 bg-[#0B1424] text-[11px] font-bold text-[#ACB0B0] uppercase border-b border-[#1F2E45] flex justify-between">
                <span>Pagamentos Lançados</span>
                <span>Subtotal Pago: R$ {totalPaid.toFixed(2)}</span>
              </div>
              <div className="divide-y divide-[#1F2E45]">
                {payments.map((p, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span className="font-semibold text-white">{p.paymentMethod}</span>
                      {p.installments && p.installments > 1 && (
                        <span className="text-[11px] text-[#ACB0B0] font-mono">
                          ({p.installments}x de R$ {(p.amount / p.installments).toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white">
                        R$ {p.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(idx)}
                        className="text-[#EF4444] hover:text-[#EF4444]/80 p-0.5 cursor-pointer"
                        title="Remover pagamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Status Summary */}
          <div className="pt-3 border-t border-[#1F2E45] grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#121E30] border border-[#1F2E45]">
              <span className="text-[10px] text-[#ACB0B0] uppercase block">Total a Pagar</span>
              <span className="font-mono font-bold text-white text-sm">
                R$ {totalToPay.toFixed(2)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#121E30] border border-[#1F2E45]">
              <span className="text-[10px] text-[#ACB0B0] uppercase block">Total Informado</span>
              <span className="font-mono font-bold text-[#22C55E] text-sm">
                R$ {totalPaid.toFixed(2)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#121E30] border border-[#1F2E45]">
              <span className="text-[10px] text-[#ACB0B0] uppercase block">Saldo Pendente</span>
              <span
                className={`font-mono font-bold text-sm ${
                  remainingBalance > 0 ? 'text-[#F59E0B]' : 'text-slate-400'
                }`}
              >
                R$ {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#121E30] hover:bg-[#18263A] border border-[#1F2E45] text-xs font-semibold text-[#ACB0B0] hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-bold text-xs shadow-lg shadow-[#22C55E]/20 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando Venda...
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Confirmar Faturamento e Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
