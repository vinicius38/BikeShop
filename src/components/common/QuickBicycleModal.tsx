import React, { useState } from 'react';
import { Bike, Plus } from 'lucide-react';
import { Modal } from './Modal';
import { bicycleService, CreateBicycleDto } from '../../services/bicycleService';
import { Bicycle, Customer } from '../../types/api';

interface QuickBicycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onBicycleCreated: (newBicycle: Bicycle) => void;
}

export const QuickBicycleModal: React.FC<QuickBicycleModalProps> = ({
  isOpen,
  onClose,
  customer,
  onBicycleCreated,
}) => {
  const [formData, setFormData] = useState<Omit<CreateBicycleDto, 'customerId'>>({
    brand: '',
    model: '',
    color: '',
    frameSize: '17" (M)',
    serialNumber: '',
    type: 'Mountain Bike (MTB)',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.model.trim()) {
      setErrorMsg('Informe ao menos a marca e o modelo da bicicleta.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await bicycleService.create({
        ...formData,
        customerId: customer.id,
      });
      onBicycleCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar bicicleta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastro Rápido de Bicicleta"
      subtitle={`Vinculada ao cliente: ${customer.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Marca *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Specialized, Trek..."
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden focus:border-[#EF7410]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Modelo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Chisel, Rockhopper..."
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden focus:border-[#EF7410]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Cor *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Laranja / Preto"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden focus:border-[#EF7410]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Quadro
            </label>
            <input
              type="text"
              placeholder="Ex: 17, 19, M, L"
              value={formData.frameSize || ''}
              onChange={(e) => setFormData({ ...formData, frameSize: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono outline-hidden focus:border-[#EF7410]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white outline-hidden"
            >
              <option value="Mountain Bike (MTB)">MTB</option>
              <option value="Speed / Road">Speed</option>
              <option value="Gravel">Gravel</option>
              <option value="E-Bike / Elétrica">E-Bike</option>
              <option value="Urbana / Passeio">Urbana</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
            Número do Quadro / Série
          </label>
          <input
            type="text"
            placeholder="Ex: WSBC604123456X"
            value={formData.serialNumber || ''}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono outline-hidden focus:border-[#EF7410]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#ACB0B0] hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold flex items-center gap-1.5 shadow-md"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Salvar e Selecionar Bicicleta
          </button>
        </div>
      </form>
    </Modal>
  );
};
