export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  Open: 'Aberta',
  WaitingApproval: 'Aguardando Aprovação',
  Approved: 'Aprovada',
  InProgress: 'Em Andamento',
  WaitingParts: 'Aguardando Peças',
  Ready: 'Pronta',
  Delivered: 'Entregue',
  Cancelled: 'Cancelada',
};

export const getWorkOrderStatusLabel = (status?: string | null): string => {
  if (!status) return '';
  return WORK_ORDER_STATUS_LABELS[status] || status;
};

export const SALE_STATUS_LABELS: Record<string, string> = {
  Open: 'Em Aberto',
  Completed: 'Concluída',
  Cancelled: 'Cancelada',
};

export const getSaleStatusLabel = (status?: string | null): string => {
  if (!status) return '';
  return SALE_STATUS_LABELS[status] || status;
};
