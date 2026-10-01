import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-[#1F2E45] bg-[#0B1424] text-xs text-[#ACB0B0]">
      <div>
        Exibindo <span className="font-semibold text-white font-mono">{startItem}</span> a{' '}
        <span className="font-semibold text-white font-mono">{endItem}</span> de{' '}
        <span className="font-semibold text-white font-mono">{totalItems}</span> registros
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-[#1F2E45] text-[#ACB0B0] hover:text-white hover:bg-[#18263A] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-mono font-medium text-white bg-[#121E30] border border-[#1F2E45] rounded-md">
          {page} / {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-[#1F2E45] text-[#ACB0B0] hover:text-white hover:bg-[#18263A] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
