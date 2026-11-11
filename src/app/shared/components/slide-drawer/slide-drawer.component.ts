import { Component, HostListener, input, output } from '@angular/core';
import { ErpIconComponent } from '../erp-icon/erp-icon.component';

@Component({
  selector: 'app-slide-drawer',
  standalone: true,
  imports: [ErpIconComponent],
  template: `
    @if (open()) {
      <div class="drawer-backdrop" (click)="closed.emit()" role="presentation">
        <aside
          class="drawer-panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
        >
          <header class="drawer-header">
            <div class="drawer-title-wrap">
              @if (subtitle()) {
                <span class="drawer-subtitle mono">{{ subtitle() }}</span>
              }
              <h2>{{ title() }}</h2>
            </div>
            <button type="button" class="btn btn-ghost btn-sm icon-close" (click)="closed.emit()" aria-label="Close panel">
              <app-erp-icon name="close" [size]="18" />
            </button>
          </header>
          <div class="drawer-body">
            <ng-content />
          </div>
          <footer class="drawer-footer">
            <ng-content select="[drawer-footer]" />
          </footer>
        </aside>
      </div>
    }
  `,
  styles: `
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: rgba(15, 23, 42, 0.42);
      display: flex;
      justify-content: flex-end;
    }

    .drawer-panel {
      width: min(500px, 100vw);
      height: 100%;
      background: var(--bg-surface);
      border-left: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      animation: slideIn var(--transition-base);
    }

    @keyframes slideIn {
      from {
        transform: translateX(24px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .drawer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .drawer-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;

      .drawer-subtitle {
        font-size: 11px;
        font-weight: 600;
        color: var(--accent-primary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      h2 {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .icon-close {
      padding: 0;
      width: 32px;
      height: 32px;
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .drawer-footer:empty {
      display: none;
    }

    .drawer-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-canvas);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
  `,
})
export class SlideDrawerComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
