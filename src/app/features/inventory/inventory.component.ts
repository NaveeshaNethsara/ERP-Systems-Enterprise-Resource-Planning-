import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InventoryCategory,
  InventoryItem,
  StockStatus,
  WarehouseName,
} from '../../core/models/erp.models';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { ErpIconComponent } from '../../shared/components/erp-icon/erp-icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ModalDialogComponent } from '../../shared/components/modal-dialog/modal-dialog.component';
import { SlideDrawerComponent } from '../../shared/components/slide-drawer/slide-drawer.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

type SortField = 'sku' | 'name' | 'quantity' | 'value';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ErpIconComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    SlideDrawerComponent,
    ModalDialogComponent,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  readonly store = inject(ErpStoreService);

  readonly categories: InventoryCategory[] = ['Raw Materials', 'Sub-Assemblies', 'Finished Goods', 'Packaging'];
  readonly warehouses: WarehouseName[] = ['Chicago Hub', 'Austin Plant', 'Rotterdam DC', 'Singapore Port'];

  // Filter & Sort Signals
  readonly searchQuery = signal('');
  readonly categoryFilter = signal<string>('All');
  readonly warehouseFilter = signal<string>('All');
  readonly statusFilter = signal<string>('All');
  readonly sortField = signal<SortField>('sku');
  readonly sortAsc = signal(true);

  // Drawer & Modal State
  readonly selectedItemId = signal<string | null>(null);
  readonly selectedItem = computed(() =>
    this.store.inventory().find((i) => i.id === this.selectedItemId()) ?? null
  );
  readonly createModalOpen = signal(false);

  // Stock Adjustment Form State inside Drawer
  readonly adjustDelta = signal<number>(25);
  readonly adjustReason = signal<string>('Cycle Count Adjustment');
  readonly adjustRef = signal<string>('CC-2026-11');

  // Create New SKU Form State
  newSku = this.blankSkuForm();

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.categoryFilter();
    const wh = this.warehouseFilter();
    const st = this.statusFilter();
    const field = this.sortField();
    const asc = this.sortAsc();

    const list = this.store.inventory().filter((item) => {
      if (cat !== 'All' && item.category !== cat) return false;
      if (wh !== 'All' && item.warehouse !== wh) return false;
      if (st !== 'All' && this.store.getStockStatus(item) !== st) return false;
      if (
        q &&
        !item.sku.toLowerCase().includes(q) &&
        !item.name.toLowerCase().includes(q) &&
        !item.binLocation.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (field === 'sku') cmp = a.sku.localeCompare(b.sku);
      else if (field === 'name') cmp = a.name.localeCompare(b.name);
      else if (field === 'quantity') cmp = a.quantity - b.quantity;
      else cmp = a.quantity * a.unitCost - b.quantity * b.unitCost;
      return asc ? cmp : -cmp;
    });
  });

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortAsc.update((v) => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  openDetail(item: InventoryItem): void {
    this.selectedItemId.set(item.id);
    this.adjustDelta.set(25);
    this.adjustReason.set('Cycle Count Adjustment');
  }

  applyAdjustment(sign: 1 | -1): void {
    const item = this.selectedItem();
    const qty = Math.abs(Number(this.adjustDelta()) || 0);
    if (!item || qty === 0) return;
    this.store.adjustStock(item.id, sign * qty, this.adjustReason(), this.adjustRef());
  }

  submitNewSku(): void {
    if (!this.newSku.sku.trim() || !this.newSku.name.trim()) return;
    this.store.addInventoryItem({
      ...this.newSku,
      sku: this.newSku.sku.trim().toUpperCase(),
      name: this.newSku.name.trim(),
      binLocation: this.newSku.binLocation.trim().toUpperCase() || 'A-01-01',
      quantity: Math.max(0, Number(this.newSku.quantity) || 0),
      reorderPoint: Math.max(1, Number(this.newSku.reorderPoint) || 20),
      unitCost: Math.max(0.01, Number(this.newSku.unitCost) || 10),
    });
    this.newSku = this.blankSkuForm();
    this.createModalOpen.set(false);
  }

  stockRatioPct(item: InventoryItem): number {
    const ceiling = Math.max(item.reorderPoint * 3, 1);
    return Math.min(100, Math.round((item.quantity / ceiling) * 100));
  }

  statusTone(status: StockStatus): string {
    if (status === 'Out of Stock') return 'danger';
    if (status === 'Low Stock') return 'warning';
    return 'success';
  }

  private blankSkuForm() {
    return {
      sku: '',
      name: '',
      category: 'Raw Materials' as InventoryCategory,
      warehouse: 'Chicago Hub' as WarehouseName,
      binLocation: 'B-04-01',
      quantity: 100,
      reorderPoint: 40,
      unitCost: 45,
      unit: 'units',
      preferredVendorId: this.store.vendors()[0]?.id ?? 'vnd-1',
    };
  }
}
