import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    title: 'Overview — Meridian ERP',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'inventory',
    title: 'Inventory Management — Meridian ERP',
    loadComponent: () =>
      import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'employees',
    title: 'Employee Management — Meridian ERP',
    loadComponent: () =>
      import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
  },
  {
    path: 'finance',
    title: 'Finance & Accounting — Meridian ERP',
    loadComponent: () =>
      import('./features/finance/finance.component').then((m) => m.FinanceComponent),
  },
  {
    path: 'procurement',
    title: 'Procurement — Meridian ERP',
    loadComponent: () =>
      import('./features/procurement/procurement.component').then((m) => m.ProcurementComponent),
  },
  {
    path: 'supply-chain',
    title: 'Supply Chain Management — Meridian ERP',
    loadComponent: () =>
      import('./features/supply-chain/supply-chain.component').then((m) => m.SupplyChainComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
