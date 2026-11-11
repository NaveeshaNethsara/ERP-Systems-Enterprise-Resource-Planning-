import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LedgerEntryType } from '../../core/models/erp.models';
import { ErpStoreService } from '../../core/services/erp-store.service';
import { ErpIconComponent } from '../../shared/components/erp-icon/erp-icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ModalDialogComponent } from '../../shared/components/modal-dialog/modal-dialog.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    ErpIconComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    ModalDialogComponent,
  ],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss',
})
export class FinanceComponent {
  readonly store = inject(ErpStoreService);

  readonly activeTab = signal<'ledger' | 'invoices' | 'accounts'>('ledger');
  readonly txnSearch = signal('');
  readonly txnTypeFilter = signal('All');

  readonly invoiceKindFilter = signal('All');
  readonly invoiceStatusFilter = signal('All');

  readonly entryModalOpen = signal(false);

  newEntry = {
    reference: '',
    description: '',
    counterparty: '',
    glAccountCode: '4000',
    type: 'Income' as LedgerEntryType,
    amount: 12500,
  };

  readonly filteredTransactions = computed(() => {
    const q = this.txnSearch().trim().toLowerCase();
    const type = this.txnTypeFilter();

    return this.store.transactions().filter((t) => {
      if (type !== 'All' && t.type !== type) return false;
      if (
        q &&
        !t.reference.toLowerCase().includes(q) &&
        !t.counterparty.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q) &&
        !t.glAccountCode.includes(q)
      ) {
        return false;
      }
      return true;
    });
  });

  readonly filteredInvoices = computed(() => {
    const kind = this.invoiceKindFilter();
    const status = this.invoiceStatusFilter();
    return this.store.invoices().filter((inv) => {
      if (kind !== 'All' && inv.kind !== kind) return false;
      if (status !== 'All' && inv.status !== status) return false;
      return true;
    });
  });

  submitJournalEntry(): void {
    if (!this.newEntry.description.trim() || !this.newEntry.counterparty.trim()) return;
    const amt = Math.max(1, Number(this.newEntry.amount) || 0);
    this.store.postLedgerTransaction({
      reference: this.newEntry.reference.trim(),
      description: this.newEntry.description.trim(),
      counterparty: this.newEntry.counterparty.trim(),
      glAccountCode: this.newEntry.glAccountCode,
      type: this.newEntry.type,
      amount: amt,
    });
    this.newEntry = {
      reference: '',
      description: '',
      counterparty: '',
      glAccountCode: '4000',
      type: 'Income',
      amount: 12500,
    };
    this.entryModalOpen.set(false);
  }
}
