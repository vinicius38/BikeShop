import React from 'react';
import { WorkOrderStatus } from '../../types/api';
import { WORK_ORDER_STATUS_LABELS, SALE_STATUS_LABELS } from '../../utils/statusUtils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  status?: WorkOrderStatus | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
}) => {
  let resolvedVariant = variant || 'neutral';

  let displayChildren = children;
  if (typeof children === 'string') {
    if (WORK_ORDER_STATUS_LABELS[children]) {
      displayChildren = WORK_ORDER_STATUS_LABELS[children];
    } else if (SALE_STATUS_LABELS[children]) {
      displayChildren = SALE_STATUS_LABELS[children];
    }
  } else if (!children && status && typeof status === 'string') {
    displayChildren = WORK_ORDER_STATUS_LABELS[status] || SALE_STATUS_LABELS[status] || status;
  }

  if (status) {
    switch (status) {
      case 'Open':
        resolvedVariant = 'info';
        break;
      case 'WaitingApproval':
        resolvedVariant = 'warning';
        break;
      case 'Approved':
        resolvedVariant = 'primary';
        break;
      case 'InProgress':
        resolvedVariant = 'primary';
        break;
      case 'WaitingParts':
        resolvedVariant = 'warning';
        break;
      case 'Ready':
        resolvedVariant = 'success';
        break;
      case 'Delivered':
      case 'Completed':
      case 'Paid':
        resolvedVariant = 'success';
        break;
      case 'Cancelled':
      case 'Rejected':
        resolvedVariant = 'danger';
        break;
      default:
        resolvedVariant = 'neutral';
    }
  }

  const styles = {
    primary: 'bg-[#EF7410]/15 text-[#EF7410] border border-[#EF7410]/30',
    success: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
    danger: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
    info: 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30',
    neutral: 'bg-[#18263A] text-[#ACB0B0] border border-[#1F2E45]',
    default: 'bg-[#18263A] text-[#F8F8F8] border border-[#1F2E45]',
  }[resolvedVariant];

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md tracking-wide uppercase font-mono ${sizeStyles} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {displayChildren}
    </span>
  );
};
