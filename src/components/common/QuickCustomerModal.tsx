import React, { useState } from 'react';
import { User, Plus, X } from 'lucide-react';
import { Modal } from './Modal';
import { customerService, CreateCustomerDto } from '../../services/customerService';
import { Customer } from '../../types/api';
import { maskCpfCnpj, maskCellPhone } from '../../utils/maskUtils';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (newCustomer: Customer) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    cpfCnpj: '',
    phone: '',
    cellPhone: '',
    email: '',
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCpfCnpjBlur = async () => {
    if (!formData.cpfCnpj) return;
    const cleanCpfCnpj = formData.cpfCnpj.replace(/\D/g, '');
    if (!cleanCpfCnpj) return;

    try {
      const res = await customerService.getAll({ cpfCnpj: cleanCpfCnpj });
      const existing = res.items.find((c) => c.cpfCnpj?.replace(/\D/g, '') === cleanCpfCnpj);
      if (existing) {
        setErrorMsg(`Atenção: Já existe um cliente cadastrado com este CPF/CNPJ (${existing.name}).`);
      } else {
        if (errorMsg?.includes('CPF/CNPJ')) setErrorMsg(null);
      }
    } catch (err) {
      console.error('Failed to validate CPF/CNPJ', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.cpfCnpj.trim()) {
      setErrorMsg('Informe ao menos o nome completo e o CPF/CNPJ do cliente.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Final verification before submit
    if (formData.cpfCnpj) {
      const cleanCpfCnpj = formData.cpfCnpj.replace(/\D/g, '');
      if (cleanCpfCnpj) {
        try {
          const res = await customerService.getAll({ cpfCnpj: cleanCpfCnpj });
          const existing = res.items.find((c) => c.cpfCnpj?.replace(/\D/g, '') === cleanCpfCnpj);
          if (existing) {
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
      const created = await customerService.create(formData);
      onCustomerCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastro Rápido de Cliente"
      subtitle="Cadastre o cliente sem sair do processo atual"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Roberto Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white focus:border-[#EF7410] outline-hidden"
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
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono focus:border-[#EF7410] outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              WhatsApp / Celular *
            </label>
            <input
              type="text"
              placeholder="(35) 99999-9999"
              maxLength={15}
              value={formData.cellPhone || ''}
              onChange={(e) => setFormData({ ...formData, cellPhone: maskCellPhone(e.target.value) })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono focus:border-[#EF7410] outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              E-mail
            </label>
            <input
              type="email"
              placeholder="cliente@email.com"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white focus:border-[#EF7410] outline-hidden"
            />
          </div>
        </div>

        {/* Endereço Rápido */}
        <div className="p-3 rounded-xl bg-[#0B1424] border border-[#1F2E45] space-y-2">
          <span className="text-[11px] font-bold uppercase text-[#EF7410] block">
            Endereço (Opcional)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Rua / Logradouro"
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
                placeholder="Nº"
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
          <div className="grid grid-cols-2 gap-2">
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
            <input
              type="text"
              placeholder="Cidade / UF"
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
            Salvar e Selecionar Cliente
          </button>
        </div>
      </form>
    </Modal>
  );
};
