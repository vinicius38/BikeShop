import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#1F2E45] bg-[#0B1424]/50 my-6">
      <div className="p-4 rounded-xl bg-[#121E30] text-[#ACB0B0] border border-[#1F2E45] mb-4">
        <Icon className="w-8 h-8 text-[#EF7410]" />
      </div>
      <h4 className="text-base font-semibold text-[#F8F8F8] tracking-tight">{title}</h4>
      <p className="text-xs text-[#ACB0B0] max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
