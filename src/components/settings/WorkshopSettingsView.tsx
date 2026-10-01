import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
  FileText,
} from 'lucide-react';
import { useWorkshop } from '../../context/WorkshopContext';
import { workshopService } from '../../services/workshopService';
import { WorkshopSettings } from '../../types/api';
import { maskCpfCnpj, maskCellPhone, maskPhoneOrCell, maskCep } from '../../utils/maskUtils';

export const WorkshopSettingsView: React.FC = () => {
  const { settings, logoUrl, workshopName, tradeName, refreshSettings } = useWorkshop();

  const [formData, setFormData] = useState<Partial<WorkshopSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName,
        tradeName: settings.tradeName,
        corporateName: settings.corporateName,
        cpfCnpj: maskCpfCnpj(settings.cpfCnpj),
        stateRegistration: settings.stateRegistration,
        phone: maskPhoneOrCell(settings.phone),
        whatsApp: maskCellPhone(settings.whatsApp),
        email: settings.email,
        website: settings.website,
        footerMessage: settings.footerMessage,
        additionalInformation: settings.additionalInformation,
        address: {
          street: settings.address?.street || '',
          number: settings.address?.number || '',
          complement: settings.address?.complement || '',
          neighborhood: settings.address?.neighborhood || '',
          city: settings.address?.city || '',
          state: settings.address?.state || 'SP',
          zipCode: maskCep(settings.address?.zipCode),
        },
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await workshopService.uploadLogo(file);
      await refreshSettings();
      setSuccessMessage('Logo da oficina atualizada com sucesso!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao enviar arquivo de imagem.');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Deseja realmente remover a logo da oficina?')) return;
    setIsUploadingLogo(true);
    try {
      await workshopService.deleteLogo();
      await refreshSettings();
      setSuccessMessage('Logo removida com sucesso.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao remover logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await workshopService.updateSettings(formData);
      await refreshSettings();
      setSuccessMessage('Configurações da oficina salvas com sucesso!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Configurações da Oficina
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Identidade visual, logotipo oficial, dados cadastrais e mensagens de documentos
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-xs text-[#22C55E] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Logo & Brand Identity Box */}
        <div className="p-6 rounded-xl border border-[#1F2E45] bg-[#0B1424] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#EF7410]">
            <Building2 className="w-4 h-4" />
            Logotipo & Identidade Visual da Marca
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Logo Preview */}
            <div className="relative w-28 h-28 rounded-xl bg-[#121E30] border-2 border-dashed border-[#1F2E45] overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={logoUrl}
                alt={workshopName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Logotipo Oficial da Oficina</h4>
              <p className="text-xs text-[#ACB0B0] max-w-md leading-relaxed">
                A imagem enviada será exibida no cabeçalho do sistema, sidebar e nos documentos
                impressos de Ordem de Serviço e Comprovante de Venda.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload-input"
                />
                <label
                  htmlFor="logo-upload-input"
                  className="px-3.5 py-2 rounded-lg bg-[#121E30] hover:bg-[#18263A] border border-[#1F2E45] text-white font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#EF7410]" />
                  {isUploadingLogo ? 'Enviando...' : 'Carregar Nova Logo'}
                </label>
                {settings?.hasLogo && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="px-3 py-2 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Legal Information */}
        <div className="p-6 rounded-xl border border-[#1F2E45] bg-[#0B1424] space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">
            Dados Empresariais & Fiscais
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Nome da Oficina (Nome Exibição) *
              </label>
              <input
                type="text"
                required
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={formData.corporateName || ''}
                onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                CNPJ / CPF
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00 ou 000.000.000-00"
                maxLength={18}
                value={formData.cpfCnpj || ''}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: maskCpfCnpj(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Inscrição Estadual
              </label>
              <input
                type="text"
                value={formData.stateRegistration || ''}
                onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Telefone</label>
              <input
                type="text"
                placeholder="(35) 3521-1122 ou (35) 99999-9999"
                maxLength={15}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: maskPhoneOrCell(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                WhatsApp Oficial
              </label>
              <input
                type="text"
                placeholder="(35) 99999-9999"
                maxLength={15}
                value={formData.whatsApp || ''}
                onChange={(e) => setFormData({ ...formData, whatsApp: maskCellPhone(e.target.value) })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Website</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-6 rounded-xl border border-[#1F2E45] bg-[#0B1424] space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">
            Endereço da Oficina
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Logradouro</label>
              <input
                type="text"
                value={formData.address?.street || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, street: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Número</label>
              <input
                type="text"
                value={formData.address?.number || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, number: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Bairro</label>
              <input
                type="text"
                value={formData.address?.neighborhood || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, neighborhood: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Cidade</label>
              <input
                type="text"
                value={formData.address?.city || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, city: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">Estado</label>
              <input
                type="text"
                value={formData.address?.state || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, state: e.target.value },
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">CEP</label>
              <input
                type="text"
                placeholder="00000-000"
                maxLength={9}
                value={formData.address?.zipCode || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, zipCode: maskCep(e.target.value) },
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Document printing messages */}
        <div className="p-6 rounded-xl border border-[#1F2E45] bg-[#0B1424] space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">
            Mensagens & Textos de Impressão (OS & Comprovantes)
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Mensagem de Rodapé
            </label>
            <input
              type="text"
              value={formData.footerMessage || ''}
              onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Informações Adicionais / Certificações Técnicas
            </label>
            <textarea
              rows={2}
              value={formData.additionalInformation || ''}
              onChange={(e) => setFormData({ ...formData, additionalInformation: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
