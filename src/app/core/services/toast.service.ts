import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  title: string;
  detail?: string;
  variant: 'success' | 'info' | 'warning' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<ToastMessage[]>([]);

  show(title: string, detail?: string, variant: ToastMessage['variant'] = 'success', durationMs = 4200): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, title, detail, variant }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
