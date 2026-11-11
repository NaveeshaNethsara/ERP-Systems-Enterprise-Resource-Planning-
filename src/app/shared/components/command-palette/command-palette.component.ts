import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ErpSearchResult } from '../../../core/models/erp.models';
import { ErpStoreService } from '../../../core/services/erp-store.service';
import { ErpIconComponent } from '../erp-icon/erp-icon.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [FormsModule, ErpIconComponent, StatusBadgeComponent],
  template: `
    @if (store.commandPaletteOpen()) {
      <div class="palette-backdrop" (click)="close()" role="presentation">
        <div
          class="palette-card"
          role="dialog"
          aria-modal="true"
          aria-label="Global ERP Search"
          (click)="$event.stopPropagation()"
        >
          <div class="palette-search-row">
            <app-erp-icon name="search" [size]="18" />
            <input
              type="text"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
              placeholder="Search SKUs, employees, PO numbers, invoices, or tracking IDs..."
              autofocus
            />
            <button type="button" class="kbd-esc" (click)="close()">ESC</button>
          </div>

          <div class="palette-results">
            @if (results().length === 0) {
              <div class="empty-state">
                <strong>No matching ERP records</strong>
                <p>Try searching by SKU-1088, EMP-1004, PO-2026, INV-2026, or SHP-8841.</p>
              </div>
            } @else {
              @for (item of results(); track item.id) {
                <button type="button" class="result-row" (click)="navigateTo(item)">
                  <div class="result-meta">
                    <span class="module-pill">{{ item.module }}</span>
                    <div class="result-text">
                      <strong>{{ item.title }}</strong>
                      <span>{{ item.subtitle }}</span>
                    </div>
                  </div>
                  <app-status-badge [label]="item.badge" />
                </button>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .palette-backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      background: rgba(15, 23, 42, 0.48);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 84px 16px 16px;
    }

    .palette-card {
      width: min(640px, 100%);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .palette-search-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-muted);

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        color: var(--text-primary);
        background: transparent;
      }

      .kbd-esc {
        padding: 3px 7px;
        border-radius: 4px;
        border: 1px solid var(--border-strong);
        background: var(--bg-subtle);
        color: var(--text-secondary);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
    }

    .palette-results {
      max-height: 400px;
      overflow-y: auto;
      padding: 6px;
    }

    .result-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: background-color var(--transition-fast);

      &:hover {
        background: var(--bg-subtle);
      }
    }

    .result-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .module-pill {
      flex-shrink: 0;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 600;
      min-width: 88px;
      text-align: center;
    }

    .result-text {
      display: flex;
      flex-direction: column;
      min-width: 0;

      strong {
        font-size: 13px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      span {
        font-size: 12px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `,
})
export class CommandPaletteComponent {
  readonly store = inject(ErpStoreService);
  private readonly router = inject(Router);
  readonly query = signal('');
  readonly results = computed(() => this.store.searchAll(this.query()));

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.store.commandPaletteOpen.update((v) => !v);
    } else if (event.key === 'Escape' && this.store.commandPaletteOpen()) {
      this.close();
    }
  }

  navigateTo(result: ErpSearchResult): void {
    this.close();
    this.router.navigateByUrl(result.route);
  }

  close(): void {
    this.store.commandPaletteOpen.set(false);
    this.query.set('');
  }
}
