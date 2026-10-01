import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Sale, Customer, Bicycle, WorkOrder } from '../../types/api';
import { useWorkshop } from '../../context/WorkshopContext';
import { customerService } from '../../services/customerService';
import { workOrderService } from '../../services/workOrderService';
import { bicycleService } from '../../services/bicycleService';

interface SalePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const SalePrintModal: React.FC<SalePrintModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  const { settings, logoUrl, workshopName, tradeName } = useWorkshop();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [bicycle, setBicycle] = useState<Bicycle | null>(null);

  useEffect(() => {
    if (isOpen && sale) {
      if (sale.customerId) {
        customerService.getById(sale.customerId).then(res => setCustomer(res)).catch(console.error);
      }
      if (sale.workOrderId) {
        workOrderService.getById(sale.workOrderId).then(res => {
          setWorkOrder(res);
          if (res.bicycleId) {
            bicycleService.getById(res.bicycleId).then(bRes => setBicycle(bRes)).catch(console.error);
          }
        }).catch(console.error);
      }
    } else {
      setCustomer(null);
      setWorkOrder(null);
      setBicycle(null);
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprovante de Venda ${sale.number}`}
      subtitle="Recibo detalhado de venda"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="flex justify-end no-print">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprovante
          </button>
        </div>

        {/* Printable Paper Canvas (Styled for high legibility, white print preview) */}
        <div
          id="printable-sale"
          className="bg-white text-slate-900 p-8 rounded-xl shadow-lg font-sans border border-slate-200 text-xs print-area"
        >
          {/* Company Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                <img
                  src={logoUrl}
                  alt={workshopName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                  {workshopName}
                </h1>
                <p className="text-xs text-slate-600 font-medium">{tradeName}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  CNPJ: {settings?.formattedCpfCnpj || settings?.cpfCnpj || '12.345.678/0001-99'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {settings?.address?.formattedAddressLine || 'São Paulo - SP'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-extrabold font-mono text-[#EF7410]">
                {sale.number}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Data: {new Date((sale as any).saleDate || sale.createdAt || sale.date).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Tel: {settings?.formattedPhone || settings?.phone || '(11) 3456-7890'}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50">
            <div>
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Dados do Cliente
              </span>
              <p className="font-semibold text-slate-950 text-sm mb-1">{sale.customerName || 'Consumidor Final'}</p>
              {customer && (
                <div className="text-[11px] text-slate-700 space-y-0.5">
                  {customer.cpfCnpj && <p><strong>CPF/CNPJ:</strong> {customer.cpfCnpj}</p>}
                  {(customer.phone || customer.cellPhone) && (
                    <p><strong>Telefone:</strong> {customer.cellPhone || customer.phone}</p>
                  )}
                  {customer.email && <p><strong>E-mail:</strong> {customer.email}</p>}
                  {customer.address && (
                    <p>
                      <strong>Endereço:</strong> {customer.address.street}, {customer.address.number}
                      {customer.address.complement && ` - ${customer.address.complement}`}
                      {customer.address.neighborhood && ` - ${customer.address.neighborhood}`}
                      {customer.address.city && ` - ${customer.address.city}/${customer.address.state}`}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Origin & Bicycle Info */}
            <div>
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Dados da Origem / Bicicleta
              </span>
              <p className="font-semibold text-slate-950 text-sm mb-1">
                {sale.workOrderNumber ? `Ordem de Serviço ${sale.workOrderNumber}` : 'Venda Direta / Balcão'}
              </p>
              {workOrder && bicycle && (
                <div className="text-[11px] text-slate-700 space-y-0.5 mt-2">
                  <p><strong>Marca:</strong> {bicycle.brand}</p>
                  {bicycle.color && <p><strong>Cor:</strong> {bicycle.color}</p>}
                  <p className="font-mono"><strong>Nº de Série:</strong> {bicycle.serialNumber || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
              Itens da Venda
            </span>
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-1.5 text-left">Descrição do Item</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Qtd</th>
                  <th className="border border-slate-300 p-1.5 text-right w-24">Valor Unit.</th>
                  <th className="border border-slate-300 p-1.5 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1.5 font-medium">
                      {item.productName || item.serviceName || 'Item'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{item.quantity}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono">
                      R$ {(Number(item.total) / item.quantity).toFixed(2)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono font-semibold">
                      R$ {Number(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Payments Box */}
          <div className="flex justify-end mt-6">
            <div className="w-64 border border-slate-300 rounded-lg p-3 bg-slate-50">
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-slate-600 font-semibold">Subtotal:</span>
                <span className="font-mono text-slate-900">R$ {Number(sale.subtotal).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between items-center mb-1 text-[11px] text-emerald-700">
                  <span className="font-semibold">Desconto:</span>
                  <span className="font-mono">- R$ {Number(sale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-300 mt-2 pt-2 text-sm">
                <span className="font-black text-slate-950 uppercase">Total:</span>
                <span className="font-bold text-[#EF7410] font-mono">
                  R$ {Number(sale.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payments Detail */}
          {sale.payments.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-3">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-2">
                Pagamentos Recebidos
              </span>
              <div className="flex gap-4 flex-wrap">
                {sale.payments.map((p, idx) => (
                  <div key={idx} className="bg-slate-100 px-3 py-1.5 rounded text-[11px] text-slate-700 font-medium">
                    {p.paymentMethodName || p.paymentMethod}: <span className="font-mono ml-1 font-bold">R$ {Number(p.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Message */}
          <div className="mt-8 text-center text-[10px] text-slate-500 italic">
            <p>{settings?.footerMessage || 'Obrigado por escolher a Nilson Bikes! Volte sempre.'}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
