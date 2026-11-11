export type WarehouseName = 'Chicago Hub' | 'Austin Plant' | 'Rotterdam DC' | 'Singapore Port';

export type InventoryCategory = 'Raw Materials' | 'Sub-Assemblies' | 'Finished Goods' | 'Packaging';

export type StockStatus = 'Optimal' | 'Low Stock' | 'Out of Stock';

export interface StockMovement {
  id: string;
  date: string;
  delta: number;
  reason: string;
  reference: string;
  actor: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  warehouse: WarehouseName;
  binLocation: string;
  quantity: number;
  reorderPoint: number;
  unitCost: number;
  unit: string;
  preferredVendorId: string;
  lastUpdated: string;
  movements: StockMovement[];
}

export type Department = 'Engineering' | 'Operations' | 'Finance' | 'Procurement' | 'Logistics';

export type EmploymentStatus = 'Active' | 'On Leave' | 'Probation';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: Department;
  location: WarehouseName | 'HQ Corporate';
  manager: string;
  baseSalary: number;
  status: EmploymentStatus;
  hireDate: string;
  ptoBalanceDays: number;
  costCenter: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Declined';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: 'Annual PTO' | 'Medical Leave' | 'Training' | 'Parental Leave';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface GlAccount {
  code: string;
  name: string;
  type: AccountType;
  balance: number;
}

export type LedgerEntryType = 'Income' | 'Expense' | 'Journal';
export type LedgerStatus = 'Posted' | 'Pending' | 'Reconciled';

export interface LedgerTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  counterparty: string;
  glAccountCode: string;
  glAccountName: string;
  type: LedgerEntryType;
  amount: number;
  status: LedgerStatus;
}

export type InvoiceKind = 'Receivable' | 'Payable';
export type InvoiceStatus = 'Open' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  kind: InvoiceKind;
  counterparty: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  linkedRef: string;
}

export interface MonthlyFinancialPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: string;
  contactName: string;
  email: string;
  country: string;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60';
  avgLeadTimeDays: number;
  onTimeRate: number;
  rating: number;
  spendYtd: number;
}

export type PurchaseOrderStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Received';

export interface PurchaseOrderLine {
  skuId: string;
  sku: string;
  itemName: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  destination: WarehouseName;
  createdDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  totalAmount: number;
  notes: string;
}

export type FreightMode = 'Ocean Freight' | 'Air Express' | 'Ground LTL' | 'Rail Intermodal';
export type ShipmentStage = 'Dispatched' | 'In Transit' | 'Customs' | 'Out for Delivery' | 'Delivered';

export interface ShipmentMilestone {
  stage: ShipmentStage;
  location: string;
  timestamp: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  trackingId: string;
  carrier: string;
  mode: FreightMode;
  origin: string;
  destination: WarehouseName | string;
  eta: string;
  stage: ShipmentStage;
  delayed: boolean;
  delayReason?: string;
  linkedPoNumber?: string;
  weightKg: number;
  freightCost: number;
  incoterms: 'FOB' | 'CIF' | 'DDP' | 'EXW';
  milestones: ShipmentMilestone[];
}

export interface DistributionHub {
  name: WarehouseName;
  region: string;
  capacityPct: number;
  activeDockDoors: number;
  totalDockDoors: number;
  inboundShipments: number;
  outboundOrdersToday: number;
  health: 'Healthy' | 'Congested';
}

export interface ErpSearchResult {
  id: string;
  module: 'Inventory' | 'Employees' | 'Finance' | 'Procurement' | 'Supply Chain';
  route: string;
  title: string;
  subtitle: string;
  badge: string;
}
