import React, { useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { Modal } from '../common/Modal';
import { WorkOrder, Customer, Bicycle } from '../../types/api';
import { useWorkshop } from '../../context/WorkshopContext';
import { getWorkOrderStatusLabel } from '../../utils/statusUtils';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';

interface WorkOrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
}

export const WorkOrderPrintModal: React.FC<WorkOrderPrintModalProps> = ({
  isOpen,
  onClose,
  workOrder,
}) => {
  const { settings, logoUrl, workshopName, tradeName } = useWorkshop();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bicycle, setBicycle] = useState<Bicycle | null>(null);

  useEffect(() => {
    if (isOpen && workOrder) {
      if (workOrder.customerId) {
        customerService.getById(workOrder.customerId).then(res => setCustomer(res)).catch(console.error);
      }
      if (workOrder.bicycleId) {
        bicycleService.getById(workOrder.bicycleId).then(res => setBicycle(res)).catch(console.error);
      }
    } else {
      setCustomer(null);
      setBicycle(null);
    }
  }, [isOpen, workOrder]);

  if (!isOpen || !workOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const services = (workOrder.items || []).filter(
    (i) => i.itemType === 'Service' || (i as any).itemTypeName === 'Service' || (i as any).itemType === 2
  );
  const products = (workOrder.items || []).filter(
    (i) => i.itemType === 'Product' || (i as any).itemTypeName === 'Product' || (i as any).itemType === 1
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impressão de Ordem de Serviço"
      subtitle="Visualização do documento com cabeçalho oficial e campos de assinatura"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Print trigger button at top */}
        <div className="flex justify-end gap-2 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Documento
          </button>
        </div>

        {/* Printable Paper Canvas (Styled for high legibility, white print preview) */}
        <div
          id="printable-work-order"
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
                  {settings?.address?.formattedAddressLine ||
                    'Passos - MG / São Paulo - SP'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-extrabold font-mono text-[#EF7410]">
                {workOrder.number}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Data: {new Date(workOrder.openingDate).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-slate-600">
                Status: <strong className="uppercase">{getWorkOrderStatusLabel(workOrder.statusName || workOrder.status)}</strong>
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Tel: {settings?.formattedPhone || settings?.phone || '(11) 3456-7890'}
              </p>
            </div>
          </div>

          {/* Customer & Bike Info Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50">
            <div>
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Dados do Cliente
              </span>
              <p className="font-semibold text-slate-950 text-sm mb-1">{workOrder.customerName}</p>
              <div className="text-[11px] text-slate-700 space-y-0.5">
                {customer?.cpfCnpj && <p><strong>CPF/CNPJ:</strong> {customer.cpfCnpj}</p>}
                {(workOrder.customerPhone || customer?.phone || customer?.cellPhone) && (
                  <p><strong>Telefone:</strong> {workOrder.customerPhone || customer?.cellPhone || customer?.phone}</p>
                )}
                {customer?.email && <p><strong>E-mail:</strong> {customer.email}</p>}
                {customer?.address && (
                  <p>
                    <strong>Endereço:</strong> {customer.address.street}, {customer.address.number}
                    {customer.address.complement && ` - ${customer.address.complement}`}
                    {customer.address.neighborhood && ` - ${customer.address.neighborhood}`}
                    {customer.address.city && ` - ${customer.address.city}/${customer.address.state}`}
                  </p>
                )}
              </div>
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Dados da Bicicleta
              </span>
              <p className="font-semibold text-slate-950 text-sm mb-1">
                {bicycle?.brand || workOrder.bicycleBrand}
              </p>
              <div className="text-[11px] text-slate-700 space-y-0.5">
                {(bicycle?.color) && <p><strong>Cor:</strong> {bicycle.color}</p>}
                <p className="font-mono"><strong>Nº de Série:</strong> {bicycle?.serialNumber || workOrder.bicycleSerialNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Problem & Diagnosis */}
          <div className="border border-slate-300 rounded-lg p-3 mb-4">
            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
              Reclamação & Diagnóstico Técnico
            </span>
            <p className="text-slate-700 leading-relaxed mb-2">
              <strong>Problema Relatado:</strong> {workOrder.description || workOrder.customerComplaint || 'Revisão periódica geral.'}
            </p>
            {workOrder.technicalEvaluation && (
              <p className="text-slate-700 leading-relaxed">
                <strong>Parecer Técnico:</strong> {workOrder.technicalEvaluation}
              </p>
            )}
          </div>

          {/* Services Table */}
          {services.length > 0 && (
            <div className="mb-4">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Serviços Executados
              </span>
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5 text-left">Descrição do Serviço</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Qtd</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Valor Unit.</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td className="border border-slate-300 p-1.5 font-medium">
                        {s.description || s.serviceName || 'Serviço executado'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{s.quantity}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        R$ {Number(s.unitPrice).toFixed(2)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-medium">
                        R$ {(s.unitPrice * s.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Products Table */}
          {products.length > 0 && (
            <div className="mb-4">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-1">
                Peças & Acessórios Aplicados
              </span>
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5 text-left">Peça / Produto</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Qtd</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Valor Unit.</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="border border-slate-300 p-1.5 font-medium">
                        <span>{p.description || p.productName || 'Peça / Componente'}</span>
                        {p.productSku && (
                          <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                            (SKU: {p.productSku})
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{p.quantity}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        R$ {Number(p.unitPrice).toFixed(2)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-medium">
                        R$ {(p.unitPrice * p.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals Summary */}
          <div className="flex justify-end mb-6">
            <div className="w-64 border border-slate-300 rounded-lg p-2.5 bg-slate-50 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Itens:</span>
                <span className="font-mono">R$ {Number(workOrder.subtotal).toFixed(2)}</span>
              </div>
              {workOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto:</span>
                  <span className="font-mono">- R$ {Number(workOrder.discount).toFixed(2)}</span>
                </div>
              )}
              {workOrder.additionalCharge > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Acréscimo:</span>
                  <span className="font-mono">+ R$ {Number(workOrder.additionalCharge).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-950 text-sm">
                <span>TOTAL OS:</span>
                <span className="font-mono text-[#EF7410]">R$ {Number(workOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-[10px] text-slate-500 text-center italic mb-8">
            {settings?.footerMessage ||
              'Nilson Bikes - Performance, Tecnologia e Mobilidade com máxima precisão técnica!'}
          </p>

          {/* Signature lines */}
          <div className="grid grid-cols-2 gap-12 pt-4 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 mb-1 w-3/4 mx-auto" />
              <p className="font-semibold text-slate-900">{workshopName}</p>
              <p className="text-[10px] text-slate-500">Técnico Responsável</p>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-1 w-3/4 mx-auto" />
              <p className="font-semibold text-slate-900">{workOrder.customerName}</p>
              <p className="text-[10px] text-slate-500">Assinatura do Cliente</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
