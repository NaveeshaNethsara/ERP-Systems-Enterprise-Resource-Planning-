import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseOrder, PurchaseOrderStatus, WarehouseName } from '../../core/models/erp.models';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { ErpIconComponent } from '../../shared/components/erp-icon/erp-icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ModalDialogComponent } from '../../shared/components/modal-dialog/modal-dialog.component';
import { SlideDrawerComponent } from '../../shared/components/slide-drawer/slide-drawer.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    ErpIconComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    SlideDrawerComponent,
    ModalDialogComponent,
  ],
  templateUrl: './procurement.component.html',
  styleUrl: './procurement.component.scss',
})
export class ProcurementComponent {
  readonly store = inject(ErpStoreService);
  readonly warehouses: WarehouseName[] = ['Chicago Hub', 'Austin Plant', 'Rotterdam DC', 'Singapore Port'];
  readonly poStatuses: PurchaseOrderStatus[] = ['Pending Approval', 'Approved', 'Ordered', 'Received', 'Draft'];

  readonly activeTab = signal<'orders' | 'vendors'>('orders');
  readonly searchQuery = signal('');
  readonly statusFilter = signal('All');

  readonly selectedPoId = signal<string | null>(null);
  readonly selectedPo = computed(
    () => this.store.purchaseOrders().find((p) => p.id === this.selectedPoId()) ?? null
  );
  readonly createModalOpen = signal(false);

  newPo = this.blankPoForm();

  readonly filteredPos = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.statusFilter();

    return this.store.purchaseOrders().filter((po) => {
      if (st !== 'All' && po.status !== st) return false;
      if (
        q &&
        !po.poNumber.toLowerCase().includes(q) &&
        !po.vendorName.toLowerCase().includes(q) &&
        !po.lines.some((l) => l.sku.toLowerCase().includes(q) || l.itemName.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  });

  readonly estimatedOrderTotal = computed(() => {
    const sku = this.store.inventory().find((i) => i.id === this.newPo.skuId);
    const qty = Math.max(0, Number(this.newPo.quantity) || 0);
    return sku ? sku.unitCost * qty : 0;
  });

  nextActionFor(po: PurchaseOrder): { label: string; next: PurchaseOrderStatus } | null {
    switch (po.status) {
      case 'Draft':
        return { label: 'Submit', next: 'Pending Approval' };
      case 'Pending Approval':
        return { label: 'Approve PO', next: 'Approved' };
      case 'Approved':
        return { label: 'Issue to Vendor', next: 'Ordered' };
      case 'Ordered':
        return { label: 'Receive Goods', next: 'Received' };
      default:
        return null;
    }
  }

  submitNewPo(): void {
    if (!this.newPo.vendorId || !this.newPo.skuId || this.newPo.quantity <= 0) return;
    this.store.createPurchaseOrder({
      ...this.newPo,
      quantity: Math.max(1, Number(this.newPo.quantity) || 1),
    });
    this.newPo = this.blankPoForm();
    this.createModalOpen.set(false);
  }

  private blankPoForm() {
    return {
      vendorId: this.store.vendors()[0]?.id ?? 'vnd-1',
      destination: 'Chicago Hub' as WarehouseName,
      expectedDate: '2026-11-26',
      skuId: this.store.inventory()[0]?.id ?? 'inv-1',
      quantity: 100,
      notes: '',
    };
  }
}
