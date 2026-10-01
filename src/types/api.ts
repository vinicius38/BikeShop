export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
  traceId: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roleId: number;
  roleName: string;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface WorkshopAddress {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  formattedZipCode?: string;
  formattedAddressLine?: string;
}

export interface WorkshopSettings {
  id: number;
  companyName: string;
  tradeName: string;
  corporateName: string;
  cpfCnpj: string;
  formattedCpfCnpj: string;
  stateRegistration: string;
  phone: string;
  formattedPhone: string;
  whatsApp: string;
  formattedWhatsApp: string;
  email: string;
  website: string;
  address: WorkshopAddress;
  hasLogo: boolean;
  logoFileName: string | null;
  logoContentType: string | null;
  logoUrl: string;
  footerMessage: string;
  additionalInformation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface DashboardData {
  openWorkOrders: number;
  waitingApprovalWorkOrders: number;
  inProgressWorkOrders: number;
  waitingPartsWorkOrders: number;
  readyWorkOrders: number;
  deliveredWorkOrders: number;
  totalActiveWorkOrders: number;
  salesTodayCount: number;
  salesTodayAmount: number;
  salesThisMonthCount: number;
  salesThisMonthAmount: number;
  lowStockProductsCount: number;
  lowStockProducts: LowStockProductSummary[];
}

export interface LowStockProductSummary {
  id: number;
  code: string;
  name: string;
  stockQuantity: number;
  minimumStockQuantity: number;
  unit: string;
}

export interface Address {
  id?: number;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Customer {
  id: number;
  name: string;
  cpfCnpj: string;
  phone: string | null;
  cellPhone: string | null;
  email: string | null;
  birthDate: string | null;
  notes: string | null;
  isActive: boolean;
  address?: Address | null;
  bicyclesCount: number;
  workOrdersCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Bicycle {
  id: number;
  customerId: number;
  customerName: string;
  brand: string;
  model: string;
  color: string;
  frameSize: string | null;
  serialNumber: string | null;
  type: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface Product {
  id: number;
  code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  supplierId: number | null;
  supplierName: string | null;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStockQuantity: number;
  unit: string;
  isLowStock: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  price?: number;
  salePrice?: number;
  cost?: number;
  costPrice?: number;
  estimatedTimeMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  email: string | null;
  phone: string | null;
  cellPhone: string | null;
  contactPerson: string | null;
  address?: Address | null;
  isActive: boolean;
  createdAt: string;
}

export type WorkOrderStatus =
  | 'Open'
  | 'WaitingApproval'
  | 'Approved'
  | 'InProgress'
  | 'WaitingParts'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export interface WorkOrderItem {
  id: number;
  workOrderId: number;
  itemType: 'Product' | 'Service';
  itemTypeName?: string;
  productId: number | null;
  productSku?: string | null;
  productName?: string | null;
  serviceId: number | null;
  serviceName?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total?: number;
  subtotal?: number;
  notes?: string | null;
}

export interface WorkOrderStatusHistory {
  id: number;
  previousStatus: string;
  previousStatusName: string;
  newStatus: string;
  newStatusName: string;
  reason: string | null;
  changedByUserName: string | null;
  changedAt: string;
}

export interface WorkOrder {
  id: number;
  number: string;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  bicycleId: number;
  bicycleSummary: string;
  bicycleBrand: string;
  bicycleModel: string;
  bicycleSerialNumber: string | null;
  openingDate: string;
  expectedDate: string | null;
  completionDate: string | null;
  status: WorkOrderStatus;
  statusName: string;
  description: string;
  customerComplaint: string | null;
  technicalEvaluation: string | null;
  technicalNotes: string | null;
  discount: number;
  additionalCharge: number;
  subtotal: number;
  total: number;
  requestedTotal: number;
  approvedTotal: number | null;
  approvalStatus: string;
  approvalStatusName: string;
  approvalDate: string | null;
  approvedByUserName: string | null;
  approvalNotes: string | null;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  createdByUserName: string;
  saleId: number | null;
  saleNumber: string | null;
  items: WorkOrderItem[];
  statusHistory: WorkOrderStatusHistory[];
  createdAt: string;
  updatedAt: string | null;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number | null;
  productName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SalePayment {
  id: number;
  saleId: number;
  paymentMethod: string;
  paymentMethodName: string;
  amount: number;
  paidAt: string;
  transactionReference: string | null;
}

export interface Sale {
  id: number;
  number: string;
  date: string;
  customerId: number | null;
  customerName: string | null;
  workOrderId: number | null;
  workOrderNumber: string | null;
  originType: string;
  originTypeName: string;
  subtotal: number;
  discount: number;
  additionalCharge: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  status: string;
  statusName: string;
  isFullyPaid: boolean;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  movementType: string;
  movementTypeName: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  referenceType: string | null;
  referenceId: number | null;
  reason: string | null;
  createdByUserName: string;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: string[];
}

export interface Permission {
  id: number;
  name: string;
  module: string;
  description: string;
  code?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'sale' | 'workOrder' | 'customer' | 'stock';
  badge: string;
}
