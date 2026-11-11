import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { ErpIconComponent, ErpIconName } from '../../shared/components/erp-icon/erp-icon.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

interface NavItem {
  label: string;
  route: string;
  icon: ErpIconName;
  badge?: () => number;
  badgeTone?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ErpIconComponent,
    ToastContainerComponent,
    CommandPaletteComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly store = inject(ErpStoreService);
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Overview', route: '/dashboard', icon: 'dashboard' },
    {
      label: 'Inventory',
      route: '/inventory',
      icon: 'inventory',
      badge: () => this.store.inventoryStats().alertCount,
      badgeTone: 'warning',
    },
    {
      label: 'Employees',
      route: '/employees',
      icon: 'employees',
      badge: () => this.store.employeeStats().pendingLeaveCount,
      badgeTone: 'info',
    },
    {
      label: 'Finance',
      route: '/finance',
      icon: 'finance',
      badge: () => this.store.financeStats().overdueCount,
      badgeTone: 'danger',
    },
    {
      label: 'Procurement',
      route: '/procurement',
      icon: 'procurement',
      badge: () => this.store.procurementStats().pendingApprovalsCount,
      badgeTone: 'warning',
    },
    {
      label: 'Supply Chain',
      route: '/supply-chain',
      icon: 'supply-chain',
      badge: () => this.store.supplyChainStats().delayedCount,
      badgeTone: 'danger',
    },
  ];

  readonly entityLabel = computed(() => this.store.activeEntity());

  toggleEntity(): void {
    this.store.activeEntity.update((curr) =>
      curr === 'Meridian Global Consolidated' ? 'Meridian North America LLC' : 'Meridian Global Consolidated'
    );
  }

  closeMobileNav(): void {
    this.mobileMenuOpen.set(false);
  }
}
