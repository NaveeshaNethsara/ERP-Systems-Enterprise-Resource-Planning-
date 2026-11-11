import { Component, input } from '@angular/core';
import { ErpIconComponent, ErpIconName } from '../erp-icon/erp-icon.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [ErpIconComponent],
  template: `
    <article class="kpi-card erp-card">
      <div class="kpi-top">
        <span class="kpi-label">{{ label() }}</span>
        <span class="kpi-icon" [class]="'kpi-icon tone-' + tone()">
          <app-erp-icon [name]="icon()" [size]="16" />
        </span>
      </div>
      <div class="kpi-value num">{{ value() }}</div>
      <div class="kpi-footer">
        @if (trend()) {
          <span class="kpi-trend" [class]="'kpi-trend trend-' + trendDirection()">
            {{ trend() }}
          </span>
        }
        @if (hint()) {
          <span class="kpi-hint">{{ hint() }}</span>
        }
      </div>
    </article>
  `,
  styles: `
    .kpi-card {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color var(--transition-fast);

      &:hover {
        border-color: var(--border-strong);
      }
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .kpi-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.01em;
    }

    .kpi-icon {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;

      &.tone-info {
        background: var(--status-info-bg);
        color: var(--status-info-text);
        border-color: var(--status-info-border);
      }
      &.tone-success {
        background: var(--status-success-bg);
        color: var(--status-success-text);
        border-color: var(--status-success-border);
      }
      &.tone-warning {
        background: var(--status-warning-bg);
        color: var(--status-warning-text);
        border-color: var(--status-warning-border);
      }
      &.tone-danger {
        background: var(--status-danger-bg);
        color: var(--status-danger-text);
        border-color: var(--status-danger-border);
      }
      &.tone-neutral {
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border-color: var(--border-subtle);
      }
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.15;
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 18px;
      font-size: 12px;
    }

    .kpi-trend {
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;

      &.trend-up {
        color: var(--status-success-text);
        background: var(--status-success-bg);
      }
      &.trend-down {
        color: var(--status-danger-text);
        background: var(--status-danger-bg);
      }
      &.trend-neutral {
        color: var(--text-secondary);
        background: var(--bg-subtle);
      }
    }

    .kpi-hint {
      color: var(--text-muted);
    }
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input<ErpIconName>('dashboard');
  readonly tone = input<'info' | 'success' | 'warning' | 'danger' | 'neutral'>('info');
  readonly trend = input<string>('');
  readonly trendDirection = input<'up' | 'down' | 'neutral'>('neutral');
  readonly hint = input<string>('');
}
