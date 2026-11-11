import { TestBed } from '@angular/core/testing';
import { ErpStoreService } from './erp-store.service';

describe('ErpStoreService', () => {
  let service: ErpStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErpStoreService);
  });

  it('should compute cross-module initial metrics cleanly', () => {
    expect(service.inventoryStats().totalSkus).toBeGreaterThan(0);
    expect(service.employeeStats().totalHeadcount).toBeGreaterThan(0);
    expect(service.financeStats().cashOnHand).toBeGreaterThan(0);
    expect(service.procurementStats().activeVendorsCount).toBeGreaterThan(0);
    expect(service.supplyChainStats().activeShipmentsCount).toBeGreaterThan(0);
  });

  it('should create a replenishment PO from low-stock inventory SKU', () => {
    const initialPoCount = service.purchaseOrders().length;
    const lowStockItem = service.inventoryStats().alerts[0];
    expect(lowStockItem).toBeDefined();

    const po = service.createRestockPo(lowStockItem.id, 75);
    expect(po).toBeTruthy();
    expect(service.purchaseOrders().length).toBe(initialPoCount + 1);
    expect(po?.status).toBe('Pending Approval');
    expect(po?.lines[0].quantity).toBe(75);
  });

  it('should increment inventory stock and post AP payable bill when PO is received', () => {
    const orderedPo = service.purchaseOrders().find((p) => p.status === 'Ordered');
    expect(orderedPo).toBeDefined();
    if (!orderedPo) return;

    const line = orderedPo.lines[0];
    const beforeQty = service.inventory().find((i) => i.id === line.skuId)?.quantity ?? 0;
    const beforeInvoices = service.invoices().length;

    service.advancePurchaseOrder(orderedPo.id, 'Received');

    const afterQty = service.inventory().find((i) => i.id === line.skuId)?.quantity ?? 0;
    expect(afterQty).toBe(beforeQty + line.quantity);
    expect(service.invoices().length).toBe(beforeInvoices + 1);
    expect(service.purchaseOrders().find((p) => p.id === orderedPo.id)?.status).toBe('Received');
  });

  it('should update cash and AR balance when marking receivable invoice paid', () => {
    const openAr = service.invoices().find((i) => i.kind === 'Receivable' && i.status === 'Open');
    expect(openAr).toBeDefined();
    if (!openAr) return;

    const cashBefore = service.financeStats().cashOnHand;
    const arBefore = service.financeStats().accountsReceivable;

    service.markInvoicePaid(openAr.id);

    expect(service.financeStats().cashOnHand).toBe(cashBefore + openAr.amount);
    expect(service.financeStats().accountsReceivable).toBe(arBefore - openAr.amount);
  });

  it('should advance shipment stage and clear delay flags', () => {
    const delayedShp = service.shipments().find((s) => s.delayed);
    expect(delayedShp).toBeDefined();
    if (!delayedShp) return;

    service.advanceShipment(delayedShp.id);
    const updated = service.shipments().find((s) => s.id === delayedShp.id);
    expect(updated?.delayed).toBeFalse();
  });
});
