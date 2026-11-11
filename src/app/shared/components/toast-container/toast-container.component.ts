import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { ErpIconComponent } from '../erp-icon/erp-icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [ErpIconComponent],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-item toast-' + toast.variant" role="status">
          <div class="toast-icon">
            @switch (toast.variant) {
              @case ('success') {
                <app-erp-icon name="check" [size]="16" />
              }
              @case ('warning') {
                <app-erp-icon name="alert" [size]="16" />
              }
              @case ('danger') {
                <app-erp-icon name="alert" [size]="16" />
              }
              @default {
                <app-erp-icon name="file-text" [size]="16" />
              }
            }
          </div>
          <div class="toast-content">
            <strong>{{ toast.title }}</strong>
            @if (toast.detail) {
              <span>{{ toast.detail }}</span>
            }
          </div>
          <button
            type="button"
            class="toast-dismiss"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <app-erp-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 90;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(370px, calc(100vw - 32px));
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background: var(--brand-ink);
      color: #f8fafc;
      border: 1px solid #334155;
      box-shadow: var(--shadow-lg);
      animation: toastIn var(--transition-fast);
    }

    @keyframes toastIn {
      from {
        transform: translateY(10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .toast-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-success .toast-icon {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .toast-info .toast-icon {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    .toast-warning .toast-icon {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .toast-danger .toast-icon {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        font-size: 13px;
        font-weight: 600;
      }

      span {
        font-size: 12px;
        color: #cbd5e1;
        line-height: 1.4;
      }
    }

    .toast-dismiss {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        color: #ffffff;
      }
    }
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
