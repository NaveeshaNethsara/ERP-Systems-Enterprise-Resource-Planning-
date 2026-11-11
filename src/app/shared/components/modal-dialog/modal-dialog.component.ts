import { Component, HostListener, input, output } from '@angular/core';
import { ErpIconComponent } from '../erp-icon/erp-icon.component';

@Component({
  selector: 'app-modal-dialog',
  standalone: true,
  imports: [ErpIconComponent],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="closed.emit()" role="presentation">
        <div
          class="modal-card"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
        >
          <header class="modal-header">
            <div>
              <h3>{{ title() }}</h3>
              @if (description()) {
                <p class="modal-desc">{{ description() }}</p>
              }
            </div>
            <button type="button" class="btn btn-ghost btn-sm icon-close" (click)="closed.emit()" aria-label="Close modal">
              <app-erp-icon name="close" [size]="18" />
            </button>
          </header>
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgba(15, 23, 42, 0.48);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-card {
      width: min(560px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      animation: popIn var(--transition-fast);
    }

    @keyframes popIn {
      from {
        transform: translateY(8px) scale(0.985);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-subtle);

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .modal-desc {
        margin: 3px 0 0;
        font-size: 12.5px;
        color: var(--text-secondary);
      }
    }

    .icon-close {
      padding: 0;
      width: 30px;
      height: 30px;
    }

    .modal-body {
      padding: 20px;
    }
  `,
})
export class ModalDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
