import { Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideX } from '@lucide/angular';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  imports: [LucideCircleCheck, LucideCircleAlert, LucideX],
  templateUrl: './toast.html',
})
export class Toast {
  protected readonly toasts = inject(ToastService);

  protected classe(tipo: 'sucesso' | 'erro'): string {
    const cor = tipo === 'erro' ? 'border-erro-600/30 text-erro-700' : 'border-sucesso-600/30 text-sucesso-700';
    return `pointer-events-auto flex items-start gap-2 rounded-xl border bg-white p-3 text-sm shadow-md ${cor}`;
  }
}
