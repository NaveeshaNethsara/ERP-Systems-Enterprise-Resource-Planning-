import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { ErpIconComponent } from '../../shared/components/erp-icon/erp-icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, ErpIconComponent, KpiCardComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly store = inject(ErpStoreService);
  readonly hoveredMonthIdx = signal<number | null>(null);

  readonly chartMax = computed(() => {
    const pts = this.store.monthlyFinancials();
    const maxVal = Math.max(...pts.map((p) => Math.max(p.revenue, p.expenses)), 100000);
    return Math.ceil(maxVal / 50000) * 50000;
  });

  readonly activeChartPoint = computed(() => {
    const pts = this.store.monthlyFinancials();
    const idx = this.hoveredMonthIdx();
    return idx !== null && pts[idx] ? pts[idx] : pts[pts.length - 1];
  });

  readonly pendingPos = computed(() =>
    this.store.purchaseOrders().filter((p) => p.status === 'Pending Approval')
  );

  readonly pendingLeaves = computed(() =>
    this.store.leaveRequests().filter((l) => l.status === 'Pending')
  );

  readonly activeShipments = computed(() =>
    this.store.shipments().filter((s) => s.stage !== 'Delivered').slice(0, 4)
  );

  barHeightPct(value: number): number {
    return Math.max(6, Math.round((value / this.chartMax()) * 100));
  }
}
