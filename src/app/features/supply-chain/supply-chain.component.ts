import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FreightMode, Shipment, ShipmentStage, WarehouseName } from '../../core/models/erp.models';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { ErpIconComponent } from '../../shared/components/erp-icon/erp-icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ModalDialogComponent } from '../../shared/components/modal-dialog/modal-dialog.component';
import { SlideDrawerComponent } from '../../shared/components/slide-drawer/slide-drawer.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-supply-chain',
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
  templateUrl: './supply-chain.component.html',
  styleUrl: './supply-chain.component.scss',
})
export class SupplyChainComponent {
  readonly store = inject(ErpStoreService);
  readonly modes: FreightMode[] = ['Ocean Freight', 'Air Express', 'Ground LTL', 'Rail Intermodal'];
  readonly stages: ShipmentStage[] = ['Dispatched', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered'];
  readonly warehouses: WarehouseName[] = ['Chicago Hub', 'Austin Plant', 'Rotterdam DC', 'Singapore Port'];

  readonly activeTab = signal<'shipments' | 'hubs'>('shipments');
  readonly searchQuery = signal('');
  readonly modeFilter = signal('All');
  readonly stageFilter = signal('All');

  readonly selectedShipmentId = signal<string | null>(null);
  readonly selectedShipment = computed(
    () => this.store.shipments().find((s) => s.id === this.selectedShipmentId()) ?? null
  );
  readonly createModalOpen = signal(false);
  readonly delayReasonInput = signal('Carrier port congestion hold (+24h)');

  newShipment = {
    carrier: 'FedEx Freight Priority',
    mode: 'Ground LTL' as FreightMode,
    origin: 'Austin Plant',
    destination: 'Chicago Hub',
    eta: '2026-11-17',
    linkedPoNumber: '',
    weightKg: 1200,
    freightCost: 1450,
    incoterms: 'DDP' as 'FOB' | 'CIF' | 'DDP' | 'EXW',
  };

  readonly filteredShipments = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const mode = this.modeFilter();
    const stage = this.stageFilter();

    return this.store.shipments().filter((s) => {
      if (mode !== 'All' && s.mode !== mode) return false;
      if (stage === 'Delayed' && !s.delayed) return false;
      if (stage !== 'All' && stage !== 'Delayed' && s.stage !== stage) return false;
      if (
        q &&
        !s.trackingId.toLowerCase().includes(q) &&
        !s.carrier.toLowerCase().includes(q) &&
        !s.origin.toLowerCase().includes(q) &&
        !s.destination.toLowerCase().includes(q) &&
        !(s.linkedPoNumber ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  });

  stageIndex(stage: ShipmentStage): number {
    return this.stages.indexOf(stage);
  }

  submitNewShipment(): void {
    if (!this.newShipment.carrier.trim() || !this.newShipment.origin.trim()) return;
    this.store.createShipment({
      ...this.newShipment,
      carrier: this.newShipment.carrier.trim(),
      origin: this.newShipment.origin.trim(),
      weightKg: Math.max(1, Number(this.newShipment.weightKg) || 100),
      freightCost: Math.max(50, Number(this.newShipment.freightCost) || 500),
    });
    this.createModalOpen.set(false);
  }

  flagDelay(shipment: Shipment): void {
    const reason = this.delayReasonInput().trim();
    if (!reason) return;
    this.store.flagShipmentDelay(shipment.id, reason);
  }
}
