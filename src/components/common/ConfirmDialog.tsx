import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  isLoading = false,
}) => {
  const confirmStyles = {
    primary: 'bg-[#EF7410] hover:bg-[#EF7410]/90 text-white',
    danger: 'bg-[#EF4444] hover:bg-[#EF4444]/90 text-white',
    warning: 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white',
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-lg bg-[#18263A] text-[#EF7410] shrink-0 border border-[#1F2E45]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-[#ACB0B0] leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F2E45]">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium rounded-lg text-[#ACB0B0] hover:text-white hover:bg-[#18263A] transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 ${confirmStyles}`}
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
