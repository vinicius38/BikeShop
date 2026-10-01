import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlight?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl border transition-all duration-200 ${
        highlight
          ? 'bg-[#121E30] border-[#EF7410]/40 shadow-lg shadow-[#EF7410]/5'
          : 'bg-[#0B1424] border-[#1F2E45] hover:border-[#2A3F60]'
      } ${onClick ? 'cursor-pointer hover:bg-[#121E30]' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#ACB0B0]">
          {title}
        </span>
        <div
          className={`p-2.5 rounded-lg border ${
            highlight
              ? 'bg-[#EF7410]/15 text-[#EF7410] border-[#EF7410]/30'
              : 'bg-[#121E30] text-[#ACB0B0] border-[#1F2E45]'
          }`}
        >
          <Icon className="w-5 h-5 text-current" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-extrabold text-[#F8F8F8] tracking-tight font-mono tabular-nums">
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 text-xs pt-1">
            <span
              className={`font-semibold font-mono ${
                trend.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            {trend.label && (
              <span className="text-[#ACB0B0] text-[11px]">{trend.label}</span>
            )}
          </div>
        )}

        {subtitle && !trend && (
          <p className="text-xs text-[#ACB0B0] pt-1">{subtitle}</p>
        )}
      </div>

      {highlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#EF7410] to-[#EF7410]/30 rounded-t-xl" />
      )}
    </div>
  );
};
