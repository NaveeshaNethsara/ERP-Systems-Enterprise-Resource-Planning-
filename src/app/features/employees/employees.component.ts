import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Department, Employee, EmploymentStatus, WarehouseName } from '../../core/models/erp.models';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { ErpIconComponent } from '../../shared/components/erp-icon/erp-icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ModalDialogComponent } from '../../shared/components/modal-dialog/modal-dialog.component';
import { SlideDrawerComponent } from '../../shared/components/slide-drawer/slide-drawer.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-employees',
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
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent {
  readonly store = inject(ErpStoreService);

  readonly departments: Department[] = ['Engineering', 'Operations', 'Finance', 'Procurement', 'Logistics'];
  readonly locations: (WarehouseName | 'HQ Corporate')[] = [
    'HQ Corporate',
    'Chicago Hub',
    'Austin Plant',
    'Rotterdam DC',
    'Singapore Port',
  ];
  readonly statuses: EmploymentStatus[] = ['Active', 'On Leave', 'Probation'];

  readonly activeTab = signal<'directory' | 'leave' | 'departments'>('directory');
  readonly searchQuery = signal('');
  readonly departmentFilter = signal('All');
  readonly statusFilter = signal('All');

  readonly selectedEmployeeId = signal<string | null>(null);
  readonly selectedEmployee = computed(
    () => this.store.employees().find((e) => e.id === this.selectedEmployeeId()) ?? null
  );
  readonly onboardModalOpen = signal(false);

  newEmployee = this.blankEmployeeForm();

  readonly filteredEmployees = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const dept = this.departmentFilter();
    const st = this.statusFilter();

    return this.store.employees().filter((emp) => {
      if (dept !== 'All' && emp.department !== dept) return false;
      if (st !== 'All' && emp.status !== st) return false;
      if (
        q &&
        !emp.name.toLowerCase().includes(q) &&
        !emp.employeeCode.toLowerCase().includes(q) &&
        !emp.role.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  });

  readonly departmentBreakdown = computed(() => {
    const staff = this.store.employees();
    const totalPayroll = staff.reduce((s, e) => s + e.baseSalary / 12, 0) || 1;
    return this.departments.map((dept) => {
      const members = staff.filter((e) => e.department === dept);
      const monthlyPayroll = members.reduce((s, e) => s + e.baseSalary / 12, 0);
      return {
        department: dept,
        headcount: members.length,
        monthlyPayroll,
        sharePct: Math.round((monthlyPayroll / totalPayroll) * 100),
      };
    });
  });

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  submitNewEmployee(): void {
    if (!this.newEmployee.name.trim() || !this.newEmployee.role.trim()) return;
    this.store.addEmployee({
      ...this.newEmployee,
      name: this.newEmployee.name.trim(),
      email:
        this.newEmployee.email.trim() ||
        `${this.newEmployee.name.trim().toLowerCase().replace(/\s+/g, '.')}@meridian-erp.io`,
      role: this.newEmployee.role.trim(),
      baseSalary: Math.max(30000, Number(this.newEmployee.baseSalary) || 85000),
    });
    this.newEmployee = this.blankEmployeeForm();
    this.onboardModalOpen.set(false);
  }

  private blankEmployeeForm() {
    return {
      name: '',
      email: '',
      phone: '+1 (312) 555-0190',
      role: '',
      department: 'Operations' as Department,
      location: 'Chicago Hub' as WarehouseName | 'HQ Corporate',
      manager: 'Elena Rostova',
      baseSalary: 96000,
      costCenter: 'CC-200 Manufacturing',
    };
  }
}
