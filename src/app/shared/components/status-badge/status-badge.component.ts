import { Component, computed, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  // Inventory
  Optimal: 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'danger',
  // Employees & Leave
  Active: 'success',
  'On Leave': 'warning',
  Probation: 'info',
  Approved: 'success',
  Pending: 'warning',
  Declined: 'danger',
  // Finance
  Paid: 'success',
  Reconciled: 'success',
  Posted: 'info',
  Open: 'info',
  Overdue: 'danger',
  Income: 'success',
  Expense: 'warning',
  Journal: 'neutral',
  Receivable: 'info',
  Payable: 'warning',
  // Procurement
  Draft: 'neutral',
  'Pending Approval': 'warning',
  Ordered: 'info',
  Received: 'success',
  // Supply Chain
  Dispatched: 'neutral',
  'In Transit': 'info',
  Customs: 'warning',
  'Out for Delivery': 'info',
  Delivered: 'success',
  Delayed: 'danger',
  Healthy: 'success',
  Congested: 'warning',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="'badge badge-' + resolvedTone()">
      <span class="dot" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      line-height: 1.3;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .badge-success {
      color: var(--status-success-text);
      background: var(--status-success-bg);
      border-color: var(--status-success-border);
    }

    .badge-warning {
      color: var(--status-warning-text);
      background: var(--status-warning-bg);
      border-color: var(--status-warning-border);
    }

    .badge-danger {
      color: var(--status-danger-text);
      background: var(--status-danger-bg);
      border-color: var(--status-danger-border);
    }

    .badge-info {
      color: var(--status-info-text);
      background: var(--status-info-bg);
      border-color: var(--status-info-border);
    }

    .badge-neutral {
      color: var(--status-neutral-text);
      background: var(--status-neutral-bg);
      border-color: var(--status-neutral-border);
    }
  `,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone | undefined>(undefined);

  readonly resolvedTone = computed<BadgeTone>(
    () => this.tone() ?? STATUS_TONE_MAP[this.label()] ?? 'neutral'
  );
}
