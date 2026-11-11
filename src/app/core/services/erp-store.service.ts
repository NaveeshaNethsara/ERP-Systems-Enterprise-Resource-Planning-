import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  SEED_EMPLOYEES,
  SEED_GL_ACCOUNTS,
  SEED_HUBS,
  SEED_INVENTORY,
  SEED_INVOICES,
  SEED_LEAVE_REQUESTS,
  SEED_MONTHLY_FINANCIALS,
  SEED_PURCHASE_ORDERS,
  SEED_SHIPMENTS,
  SEED_TRANSACTIONS,
  SEED_VENDORS,
} from '../data/seed-data';
import {
  Department,
  DistributionHub,
  Employee,
  EmploymentStatus,
  ErpSearchResult,
  FreightMode,
  GlAccount,
  InventoryCategory,
  InventoryItem,
  Invoice,
  LeaveRequest,
  LedgerEntryType,
  LedgerTransaction,
  MonthlyFinancialPoint,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  Shipment,
  ShipmentStage,
  StockStatus,
  Vendor,
  WarehouseName,
} from '../models/erp.models';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'meridian_erp_state_v1';
const TODAY = '2026-11-12';

interface PersistedErpState {
  inventory: InventoryItem[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  glAccounts: GlAccount[];
  transactions: LedgerTransaction[];
  invoices: Invoice[];
  monthlyFinancials: MonthlyFinancialPoint[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  shipments: Shipment[];
  hubs: DistributionHub[];
}

const SHIPMENT_STAGES: ShipmentStage[] = [
  'Dispatched',
  'In Transit',
  'Customs',
  'Out for Delivery',
  'Delivered',
];

@Injectable({ providedIn: 'root' })
export class ErpStoreService {
  private readonly toast = inject(ToastService);

  private readonly initialState = this.loadInitialState();

  readonly inventory = signal<InventoryItem[]>(this.initialState.inventory);
  readonly employees = signal<Employee[]>(this.initialState.employees);
  readonly leaveRequests = signal<LeaveRequest[]>(this.initialState.leaveRequests);
  readonly glAccounts = signal<GlAccount[]>(this.initialState.glAccounts);
  readonly transactions = signal<LedgerTransaction[]>(this.initialState.transactions);
  readonly invoices = signal<Invoice[]>(this.initialState.invoices);
  readonly monthlyFinancials = signal<MonthlyFinancialPoint[]>(this.initialState.monthlyFinancials);
  readonly vendors = signal<Vendor[]>(this.initialState.vendors);
  readonly purchaseOrders = signal<PurchaseOrder[]>(this.initialState.purchaseOrders);
  readonly shipments = signal<Shipment[]>(this.initialState.shipments);
  readonly hubs = signal<DistributionHub[]>(this.initialState.hubs);

  readonly activeEntity = signal<'Meridian North America LLC' | 'Meridian Global Consolidated'>(
    'Meridian Global Consolidated'
  );
  readonly commandPaletteOpen = signal(false);

  constructor() {
    effect(() => {
      const snapshot: PersistedErpState = {
        inventory: this.inventory(),
        employees: this.employees(),
        leaveRequests: this.leaveRequests(),
        glAccounts: this.glAccounts(),
        transactions: this.transactions(),
        invoices: this.invoices(),
        monthlyFinancials: this.monthlyFinancials(),
        vendors: this.vendors(),
        purchaseOrders: this.purchaseOrders(),
        shipments: this.shipments(),
        hubs: this.hubs(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore storage quota restrictions
      }
    });
  }

  // ---------- Computed Cross-Module KPIs ----------

  readonly inventoryStats = computed(() => {
    const items = this.inventory();
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalValuation = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const alerts = items.filter((i) => i.quantity <= i.reorderPoint);
    const outOfStockCount = items.filter((i) => i.quantity === 0).length;
    const lowStockCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.reorderPoint).length;
    return {
      totalSkus: items.length,
      totalUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      alertCount: alerts.length,
      alerts,
    };
  });

  readonly employeeStats = computed(() => {
    const staff = this.employees();
    const leaves = this.leaveRequests();
    const activeCount = staff.filter((e) => e.status === 'Active').length;
    const onLeaveCount = staff.filter((e) => e.status === 'On Leave').length;
    const annualPayroll = staff.reduce((sum, e) => sum + e.baseSalary, 0);
    const pendingLeaveCount = leaves.filter((l) => l.status === 'Pending').length;
    return {
      totalHeadcount: staff.length,
      activeCount,
      onLeaveCount,
      monthlyPayroll: annualPayroll / 12,
      pendingLeaveCount,
    };
  });

  readonly financeStats = computed(() => {
    const accounts = this.glAccounts();
    const invs = this.invoices();
    const cash = accounts.find((a) => a.code === '1010')?.balance ?? 0;
    const ar = invs
      .filter((i) => i.kind === 'Receivable' && i.status !== 'Paid')
      .reduce((sum, i) => sum + i.amount, 0);
    const ap = invs
      .filter((i) => i.kind === 'Payable' && i.status !== 'Paid')
      .reduce((sum, i) => sum + i.amount, 0);
    const overdueCount = invs.filter((i) => i.status === 'Overdue').length;
    const months = this.monthlyFinancials();
    const latest = months[months.length - 1] ?? { revenue: 0, expenses: 0 };
    const netMarginPct =
      latest.revenue > 0 ? Math.round(((latest.revenue - latest.expenses) / latest.revenue) * 1000) / 10 : 0;

    return {
      cashOnHand: cash,
      accountsReceivable: ar,
      accountsPayable: ap,
      overdueCount,
      monthlyRevenue: latest.revenue,
      monthlyExpenses: latest.expenses,
      netMarginPct,
    };
  });

  readonly procurementStats = computed(() => {
    const pos = this.purchaseOrders();
    const vnds = this.vendors();
    const openPos = pos.filter((p) => p.status !== 'Received');
    const openPoValue = openPos.reduce((sum, p) => sum + p.totalAmount, 0);
    const pendingApprovalsCount = pos.filter((p) => p.status === 'Pending Approval').length;
    const orderedCount = pos.filter((p) => p.status === 'Ordered').length;
    const avgLeadTimeDays =
      vnds.length > 0 ? Math.round((vnds.reduce((s, v) => s + v.avgLeadTimeDays, 0) / vnds.length) * 10) / 10 : 0;

    return {
      openPoValue,
      openPoCount: openPos.length,
      pendingApprovalsCount,
      orderedCount,
      activeVendorsCount: vnds.length,
      avgLeadTimeDays,
    };
  });

  readonly supplyChainStats = computed(() => {
    const list = this.shipments();
    const active = list.filter((s) => s.stage !== 'Delivered');
    const delayedCount = active.filter((s) => s.delayed).length;
    const onTimeCount = list.filter((s) => !s.delayed).length;
    const onTimeRatePct = list.length > 0 ? Math.round((onTimeCount / list.length) * 1000) / 10 : 100;
    const freightSpendMtd = list.reduce((sum, s) => sum + s.freightCost, 0);

    return {
      activeShipmentsCount: active.length,
      delayedCount,
      onTimeRatePct,
      freightSpendMtd,
      deliveredCount: list.filter((s) => s.stage === 'Delivered').length,
    };
  });

  readonly pendingAttentionCount = computed(
    () =>
      this.procurementStats().pendingApprovalsCount +
      this.employeeStats().pendingLeaveCount +
      this.supplyChainStats().delayedCount
  );

  // ---------- Helpers ----------

  getStockStatus(item: InventoryItem): StockStatus {
    if (item.quantity <= 0) return 'Out of Stock';
    if (item.quantity <= item.reorderPoint) return 'Low Stock';
    return 'Optimal';
  }

  getVendorName(vendorId: string): string {
    return this.vendors().find((v) => v.id === vendorId)?.name ?? 'Approved Supplier';
  }

  // ---------- Inventory Actions ----------

  adjustStock(itemId: string, delta: number, reason: string, reference = 'ADJ-MANUAL'): void {
    let updatedName = '';
    let newQty = 0;

    this.inventory.update((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const nextQty = Math.max(0, item.quantity + delta);
        const appliedDelta = nextQty - item.quantity;
        updatedName = item.name;
        newQty = nextQty;
        return {
          ...item,
          quantity: nextQty,
          lastUpdated: TODAY,
          movements: [
            {
              id: `mov-${Date.now()}`,
              date: TODAY,
              delta: appliedDelta,
              reason: reason || 'Inventory Cycle Adjustment',
              reference,
              actor: 'Ops Operator',
            },
            ...item.movements,
          ],
        };
      })
    );

    if (updatedName) {
      this.toast.show(
        'Inventory Adjusted',
        `${updatedName} updated to ${newQty} units (${delta >= 0 ? '+' : ''}${delta}).`,
        'info'
      );
    }
  }

  addInventoryItem(payload: {
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
  }): void {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      ...payload,
      lastUpdated: TODAY,
      movements: [
        {
          id: `mov-${Date.now()}`,
          date: TODAY,
          delta: payload.quantity,
          reason: 'Initial Opening Balance',
          reference: 'INIT-SKU',
          actor: 'Ops Operator',
        },
      ],
    };
    this.inventory.update((items) => [newItem, ...items]);
    this.toast.show('SKU Registered', `${payload.sku} — ${payload.name} added to ${payload.warehouse}.`, 'success');
  }

  createRestockPo(itemId: string, overrideQty?: number): PurchaseOrder | null {
    const item = this.inventory().find((i) => i.id === itemId);
    if (!item) return null;

    const vendor = this.vendors().find((v) => v.id === item.preferredVendorId) ?? this.vendors()[0];
    const targetQty = overrideQty ?? Math.max(item.reorderPoint * 2 - item.quantity, 50);
    const poNumber = this.nextPoNumber();
    const expected = this.addDays(TODAY, vendor.avgLeadTimeDays);
    const line: PurchaseOrderLine = {
      skuId: item.id,
      sku: item.sku,
      itemName: item.name,
      quantity: targetQty,
      unitCost: item.unitCost,
    };
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
      destination: item.warehouse,
      createdDate: TODAY,
      expectedDate: expected,
      status: 'Pending Approval',
      lines: [line],
      totalAmount: Math.round(targetQty * item.unitCost * 100) / 100,
      notes: `Auto-generated replenishment requisition for ${item.sku} (below reorder point ${item.reorderPoint})`,
    };

    this.purchaseOrders.update((list) => [newPo, ...list]);
    this.toast.show(
      `Requisition ${poNumber} Created`,
      `${targetQty} ${item.unit} of ${item.sku} routed to Procurement (${vendor.name}).`,
      'success'
    );
    return newPo;
  }

  // ---------- Employee & HR Actions ----------

  addEmployee(payload: {
    name: string;
    email: string;
    phone: string;
    role: string;
    department: Department;
    location: WarehouseName | 'HQ Corporate';
    manager: string;
    baseSalary: number;
    costCenter: string;
  }): void {
    const nextNum = 1072 + this.employees().length;
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: `EMP-${nextNum}`,
      ...payload,
      status: 'Active',
      hireDate: TODAY,
      ptoBalanceDays: 15,
    };
    this.employees.update((list) => [newEmp, ...list]);
    this.toast.show('Employee Onboarded', `${newEmp.name} (${newEmp.employeeCode}) added to ${newEmp.department}.`, 'success');
  }

  updateEmployeeStatus(empId: string, status: EmploymentStatus): void {
    const target = this.employees().find((e) => e.id === empId);
    this.employees.update((list) => list.map((e) => (e.id === empId ? { ...e, status } : e)));
    if (target) {
      this.toast.show('Status Updated', `${target.name} marked as ${status}.`, 'info');
    }
  }

  resolveLeaveRequest(requestId: string, decision: 'Approved' | 'Declined'): void {
    const req = this.leaveRequests().find((l) => l.id === requestId);
    if (!req) return;

    this.leaveRequests.update((list) => list.map((l) => (l.id === requestId ? { ...l, status: decision } : l)));

    if (decision === 'Approved') {
      this.employees.update((staff) =>
        staff.map((e) =>
          e.id === req.employeeId
            ? {
                ...e,
                ptoBalanceDays: Math.max(0, e.ptoBalanceDays - (req.leaveType === 'Annual PTO' ? req.days : 0)),
                status: req.startDate <= TODAY ? 'On Leave' : e.status,
              }
            : e
        )
      );
    }

    this.toast.show(
      `Leave ${decision}`,
      `${req.employeeName} — ${req.leaveType} (${req.days}d) ${decision.toLowerCase()}.`,
      decision === 'Approved' ? 'success' : 'warning'
    );
  }

  // ---------- Finance & Accounting Actions ----------

  postLedgerTransaction(payload: {
    reference: string;
    description: string;
    counterparty: string;
    glAccountCode: string;
    type: LedgerEntryType;
    amount: number;
  }): void {
    const account = this.glAccounts().find((a) => a.code === payload.glAccountCode);
    const txn: LedgerTransaction = {
      id: `txn-${Date.now()}`,
      date: TODAY,
      reference: payload.reference || `JRN-2026-${Math.floor(100 + Math.random() * 899)}`,
      description: payload.description,
      counterparty: payload.counterparty,
      glAccountCode: payload.glAccountCode,
      glAccountName: account?.name ?? 'General Ledger Account',
      type: payload.type,
      amount: payload.amount,
      status: 'Posted',
    };

    this.transactions.update((list) => [txn, ...list]);

    this.glAccounts.update((accounts) =>
      accounts.map((acc) => {
        if (acc.code === '1010') {
          const cashDelta = payload.type === 'Income' ? payload.amount : payload.type === 'Expense' ? -payload.amount : 0;
          return { ...acc, balance: acc.balance + cashDelta };
        }
        if (acc.code === payload.glAccountCode) {
          return { ...acc, balance: acc.balance + payload.amount };
        }
        return acc;
      })
    );

    if (payload.type === 'Income' || payload.type === 'Expense') {
      this.monthlyFinancials.update((pts) =>
        pts.map((pt, idx) =>
          idx === pts.length - 1
            ? {
                ...pt,
                revenue: pt.revenue + (payload.type === 'Income' ? payload.amount : 0),
                expenses: pt.expenses + (payload.type === 'Expense' ? payload.amount : 0),
              }
            : pt
        )
      );
    }

    this.toast.show(
      'Ledger Entry Posted',
      `${txn.reference} ($${payload.amount.toLocaleString()}) posted to GL ${payload.glAccountCode}.`,
      'success'
    );
  }

  markInvoicePaid(invoiceId: string): void {
    const inv = this.invoices().find((i) => i.id === invoiceId);
    if (!inv || inv.status === 'Paid') return;

    this.invoices.update((list) => list.map((i) => (i.id === invoiceId ? { ...i, status: 'Paid' } : i)));

    const isReceivable = inv.kind === 'Receivable';
    this.glAccounts.update((accounts) =>
      accounts.map((acc) => {
        if (acc.code === '1010') {
          return { ...acc, balance: acc.balance + (isReceivable ? inv.amount : -inv.amount) };
        }
        if (isReceivable && acc.code === '1200') {
          return { ...acc, balance: Math.max(0, acc.balance - inv.amount) };
        }
        if (!isReceivable && acc.code === '2000') {
          return { ...acc, balance: Math.max(0, acc.balance - inv.amount) };
        }
        return acc;
      })
    );

    const txn: LedgerTransaction = {
      id: `txn-${Date.now()}`,
      date: TODAY,
      reference: inv.invoiceNumber,
      description: isReceivable ? `AR Settlement — ${inv.linkedRef}` : `AP Payment — ${inv.linkedRef}`,
      counterparty: inv.counterparty,
      glAccountCode: isReceivable ? '1200' : '2000',
      glAccountName: isReceivable ? 'Accounts Receivable' : 'Accounts Payable',
      type: isReceivable ? 'Income' : 'Expense',
      amount: inv.amount,
      status: 'Reconciled',
    };
    this.transactions.update((list) => [txn, ...list]);

    this.toast.show(
      isReceivable ? 'Payment Received' : 'Vendor Bill Paid',
      `${inv.invoiceNumber} ($${inv.amount.toLocaleString()}) settled and reconciled in GL.`,
      'success'
    );
  }

  // ---------- Procurement Actions ----------

  createPurchaseOrder(payload: {
    vendorId: string;
    destination: WarehouseName;
    expectedDate: string;
    skuId: string;
    quantity: number;
    notes: string;
  }): void {
    const vendor = this.vendors().find((v) => v.id === payload.vendorId);
    const skuItem = this.inventory().find((i) => i.id === payload.skuId);
    if (!vendor || !skuItem) return;

    const poNumber = this.nextPoNumber();
    const totalAmount = Math.round(payload.quantity * skuItem.unitCost * 100) / 100;
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
      destination: payload.destination,
      createdDate: TODAY,
      expectedDate: payload.expectedDate,
      status: 'Pending Approval',
      lines: [
        {
          skuId: skuItem.id,
          sku: skuItem.sku,
          itemName: skuItem.name,
          quantity: payload.quantity,
          unitCost: skuItem.unitCost,
        },
      ],
      totalAmount,
      notes: payload.notes || 'Standard procurement order',
    };

    this.purchaseOrders.update((list) => [newPo, ...list]);
    this.toast.show('Purchase Order Created', `${poNumber} submitted for approval ($${totalAmount.toLocaleString()}).`, 'success');
  }

  advancePurchaseOrder(poId: string, nextStatus: PurchaseOrderStatus): void {
    const po = this.purchaseOrders().find((p) => p.id === poId);
    if (!po || po.status === nextStatus) return;

    this.purchaseOrders.update((list) => list.map((p) => (p.id === poId ? { ...p, status: nextStatus } : p)));

    if (nextStatus === 'Ordered') {
      // Automatically create a corresponding inbound shipment if none exists yet
      const existingShp = this.shipments().find((s) => s.linkedPoNumber === po.poNumber);
      if (!existingShp) {
        const vendor = this.vendors().find((v) => v.id === po.vendorId);
        const trackingId = `SHP-${8851 + this.shipments().length}`;
        const newShipment: Shipment = {
          id: `shp-${Date.now()}`,
          trackingId,
          carrier: vendor?.country === 'United States' ? 'XPO Logistics LTL' : 'DHL Global Forwarding',
          mode: vendor?.country === 'United States' ? 'Ground LTL' : 'Air Express',
          origin: vendor?.country ?? 'Supplier Facility',
          destination: po.destination,
          eta: po.expectedDate,
          stage: 'Dispatched',
          delayed: false,
          linkedPoNumber: po.poNumber,
          weightKg: Math.max(120, po.lines.reduce((s, l) => s + l.quantity * 4, 0)),
          freightCost: Math.round(Math.max(480, po.totalAmount * 0.06)),
          incoterms: 'FOB',
          milestones: [
            { stage: 'Dispatched', location: `${vendor?.name ?? 'Vendor'} Dock`, timestamp: 'Nov 12, 09:00', completed: true },
            { stage: 'In Transit', location: 'Regional Carrier Relay', timestamp: 'Pending', completed: false },
            { stage: 'Customs', location: 'Port / Domestic Clearance', timestamp: 'Pending', completed: false },
            { stage: 'Out for Delivery', location: `${po.destination} Drayage`, timestamp: 'Pending', completed: false },
            { stage: 'Delivered', location: `${po.destination} Receiving`, timestamp: 'Pending', completed: false },
          ],
        };
        this.shipments.update((s) => [newShipment, ...s]);
      }
      this.toast.show('PO Issued to Vendor', `${po.poNumber} dispatched to ${po.vendorName} & tracking queued.`, 'info');
      return;
    }

    if (nextStatus === 'Received') {
      // 1. Update Inventory Stock & Movement Log
      for (const line of po.lines) {
        this.inventory.update((items) =>
          items.map((item) =>
            item.id === line.skuId
              ? {
                  ...item,
                  quantity: item.quantity + line.quantity,
                  lastUpdated: TODAY,
                  movements: [
                    {
                      id: `mov-${Date.now()}-${line.sku}`,
                      date: TODAY,
                      delta: line.quantity,
                      reason: 'PO Receipt',
                      reference: po.poNumber,
                      actor: 'Receiving Dock',
                    },
                    ...item.movements,
                  ],
                }
              : item
          )
        );
      }

      // 2. Post AP Payable Invoice & GL Entry in Finance
      const billNo = `BILL-2026-${883 + this.invoices().length}`;
      const newBill: Invoice = {
        id: `invc-${Date.now()}`,
        invoiceNumber: billNo,
        kind: 'Payable',
        counterparty: po.vendorName,
        issueDate: TODAY,
        dueDate: this.addDays(TODAY, 30),
        amount: po.totalAmount,
        status: 'Open',
        linkedRef: po.poNumber,
      };
      this.invoices.update((list) => [newBill, ...list]);

      this.glAccounts.update((accs) =>
        accs.map((acc) => {
          if (acc.code === '1400' || acc.code === '2000') {
            return { ...acc, balance: acc.balance + po.totalAmount };
          }
          return acc;
        })
      );

      this.transactions.update((txns) => [
        {
          id: `txn-${Date.now()}`,
          date: TODAY,
          reference: po.poNumber,
          description: `Inventory Receipt — ${po.lines.map((l) => `${l.quantity}x ${l.sku}`).join(', ')}`,
          counterparty: po.vendorName,
          glAccountCode: '1400',
          glAccountName: 'Inventory Asset Valuation',
          type: 'Expense',
          amount: po.totalAmount,
          status: 'Posted',
        },
        ...txns,
      ]);

      // 3. Update Vendor Spend YTD
      this.vendors.update((vnds) =>
        vnds.map((v) => (v.id === po.vendorId ? { ...v, spendYtd: v.spendYtd + po.totalAmount } : v))
      );

      // 4. Mark linked shipment delivered if present
      this.shipments.update((shps) =>
        shps.map((s) =>
          s.linkedPoNumber === po.poNumber
            ? {
                ...s,
                stage: 'Delivered',
                delayed: false,
                milestones: s.milestones.map((m) => ({
                  ...m,
                  completed: true,
                  timestamp: m.timestamp === 'Pending' ? 'Nov 12, Received' : m.timestamp,
                })),
              }
            : s
        )
      );

      this.toast.show(
        `${po.poNumber} Received & Synced`,
        `Inventory stocked, ${billNo} posted to Finance AP, and Supply Chain closed.`,
        'success'
      );
      return;
    }

    this.toast.show(`PO ${nextStatus}`, `${po.poNumber} moved to ${nextStatus}.`, 'success');
  }

  // ---------- Supply Chain Actions ----------

  advanceShipment(shipmentId: string): void {
    const shp = this.shipments().find((s) => s.id === shipmentId);
    if (!shp) return;

    const currentIdx = SHIPMENT_STAGES.indexOf(shp.stage);
    const nextIdx = Math.min(SHIPMENT_STAGES.length - 1, currentIdx + 1);
    const nextStage = SHIPMENT_STAGES[nextIdx];

    this.shipments.update((list) =>
      list.map((s) => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          stage: nextStage,
          delayed: false,
          delayReason: undefined,
          milestones: s.milestones.map((m, idx) =>
            idx <= nextIdx
              ? {
                  ...m,
                  completed: true,
                  timestamp: m.timestamp === 'Pending' ? 'Nov 12, Updated' : m.timestamp,
                }
              : m
          ),
        };
      })
    );

    this.toast.show(
      'Shipment Milestone Updated',
      `${shp.trackingId} progressed to ${nextStage}.`,
      nextStage === 'Delivered' ? 'success' : 'info'
    );
  }

  flagShipmentDelay(shipmentId: string, reason: string): void {
    const shp = this.shipments().find((s) => s.id === shipmentId);
    if (!shp) return;
    this.shipments.update((list) =>
      list.map((s) => (s.id === shipmentId ? { ...s, delayed: true, delayReason: reason } : s))
    );
    this.toast.show('Exception Logged', `${shp.trackingId} flagged for delay: ${reason}`, 'warning');
  }

  createShipment(payload: {
    carrier: string;
    mode: FreightMode;
    origin: string;
    destination: WarehouseName | string;
    eta: string;
    linkedPoNumber: string;
    weightKg: number;
    freightCost: number;
    incoterms: 'FOB' | 'CIF' | 'DDP' | 'EXW';
  }): void {
    const trackingId = `SHP-${8851 + this.shipments().length}`;
    const newShp: Shipment = {
      id: `shp-${Date.now()}`,
      trackingId,
      ...payload,
      stage: 'Dispatched',
      delayed: false,
      milestones: [
        { stage: 'Dispatched', location: payload.origin, timestamp: 'Nov 12, 10:15', completed: true },
        { stage: 'In Transit', location: 'Carrier Linehaul', timestamp: 'Pending', completed: false },
        { stage: 'Customs', location: 'Port Clearance', timestamp: 'Pending', completed: false },
        { stage: 'Out for Delivery', location: 'Final Mile Drayage', timestamp: 'Pending', completed: false },
        { stage: 'Delivered', location: payload.destination, timestamp: 'Pending', completed: false },
      ],
    };
    this.shipments.update((list) => [newShp, ...list]);
    this.toast.show('Shipment Dispatched', `${trackingId} via ${payload.carrier} is now active.`, 'success');
  }

  // ---------- Unified Global Command Search ----------

  searchAll(rawQuery: string): ErpSearchResult[] {
    const q = rawQuery.trim().toLowerCase();
    const results: ErpSearchResult[] = [];

    for (const item of this.inventory()) {
      if (!q || item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.warehouse.toLowerCase().includes(q)) {
        results.push({
          id: item.id,
          module: 'Inventory',
          route: '/inventory',
          title: `${item.sku} — ${item.name}`,
          subtitle: `${item.warehouse} • ${item.quantity} ${item.unit} on hand`,
          badge: this.getStockStatus(item),
        });
      }
    }

    for (const emp of this.employees()) {
      if (!q || emp.name.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q)) {
        results.push({
          id: emp.id,
          module: 'Employees',
          route: '/employees',
          title: `${emp.name} (${emp.employeeCode})`,
          subtitle: `${emp.role} • ${emp.department} • ${emp.location}`,
          badge: emp.status,
        });
      }
    }

    for (const po of this.purchaseOrders()) {
      if (!q || po.poNumber.toLowerCase().includes(q) || po.vendorName.toLowerCase().includes(q)) {
        results.push({
          id: po.id,
          module: 'Procurement',
          route: '/procurement',
          title: `${po.poNumber} — ${po.vendorName}`,
          subtitle: `Dest: ${po.destination} • $${po.totalAmount.toLocaleString()}`,
          badge: po.status,
        });
      }
    }

    for (const inv of this.invoices()) {
      if (!q || inv.invoiceNumber.toLowerCase().includes(q) || inv.counterparty.toLowerCase().includes(q)) {
        results.push({
          id: inv.id,
          module: 'Finance',
          route: '/finance',
          title: `${inv.invoiceNumber} — ${inv.counterparty}`,
          subtitle: `${inv.kind} • Due ${inv.dueDate} • $${inv.amount.toLocaleString()}`,
          badge: inv.status,
        });
      }
    }

    for (const shp of this.shipments()) {
      if (!q || shp.trackingId.toLowerCase().includes(q) || shp.carrier.toLowerCase().includes(q) || shp.origin.toLowerCase().includes(q)) {
        results.push({
          id: shp.id,
          module: 'Supply Chain',
          route: '/supply-chain',
          title: `${shp.trackingId} — ${shp.carrier}`,
          subtitle: `${shp.origin} → ${shp.destination} • ETA ${shp.eta}`,
          badge: shp.delayed ? 'Delayed' : shp.stage,
        });
      }
    }

    return results.slice(0, 14);
  }

  resetDemoData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.inventory.set(structuredClone(SEED_INVENTORY));
    this.employees.set(structuredClone(SEED_EMPLOYEES));
    this.leaveRequests.set(structuredClone(SEED_LEAVE_REQUESTS));
    this.glAccounts.set(structuredClone(SEED_GL_ACCOUNTS));
    this.transactions.set(structuredClone(SEED_TRANSACTIONS));
    this.invoices.set(structuredClone(SEED_INVOICES));
    this.monthlyFinancials.set(structuredClone(SEED_MONTHLY_FINANCIALS));
    this.vendors.set(structuredClone(SEED_VENDORS));
    this.purchaseOrders.set(structuredClone(SEED_PURCHASE_ORDERS));
    this.shipments.set(structuredClone(SEED_SHIPMENTS));
    this.hubs.set(structuredClone(SEED_HUBS));
    this.toast.show('Demo Dataset Restored', 'All 5 ERP modules reset to clean operational baseline.', 'info');
  }

  private loadInitialState(): PersistedErpState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedErpState>;
        if (parsed.inventory && parsed.employees && parsed.purchaseOrders && parsed.shipments && parsed.invoices) {
          return {
            inventory: parsed.inventory,
            employees: parsed.employees,
            leaveRequests: parsed.leaveRequests ?? structuredClone(SEED_LEAVE_REQUESTS),
            glAccounts: parsed.glAccounts ?? structuredClone(SEED_GL_ACCOUNTS),
            transactions: parsed.transactions ?? structuredClone(SEED_TRANSACTIONS),
            invoices: parsed.invoices,
            monthlyFinancials: parsed.monthlyFinancials ?? structuredClone(SEED_MONTHLY_FINANCIALS),
            vendors: parsed.vendors ?? structuredClone(SEED_VENDORS),
            purchaseOrders: parsed.purchaseOrders,
            shipments: parsed.shipments,
            hubs: parsed.hubs ?? structuredClone(SEED_HUBS),
          };
        }
      }
    } catch {
      // Fallback cleanly to seed data
    }
    return {
      inventory: structuredClone(SEED_INVENTORY),
      employees: structuredClone(SEED_EMPLOYEES),
      leaveRequests: structuredClone(SEED_LEAVE_REQUESTS),
      glAccounts: structuredClone(SEED_GL_ACCOUNTS),
      transactions: structuredClone(SEED_TRANSACTIONS),
      invoices: structuredClone(SEED_INVOICES),
      monthlyFinancials: structuredClone(SEED_MONTHLY_FINANCIALS),
      vendors: structuredClone(SEED_VENDORS),
      purchaseOrders: structuredClone(SEED_PURCHASE_ORDERS),
      shipments: structuredClone(SEED_SHIPMENTS),
      hubs: structuredClone(SEED_HUBS),
    };
  }

  private nextPoNumber(): string {
    const seq = 93 + this.purchaseOrders().length;
    return `PO-2026-0${seq}`;
  }

  private addDays(isoDate: string, days: number): string {
    const d = new Date(isoDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
