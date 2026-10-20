import { Component, computed, input } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideCircleMinus, LucideClock, LucideInfo } from '@lucide/angular';
import type { TomBadge } from '../../../core/state/config-recurso';

@Component({
  selector: 'app-status-badge',
  imports: [LucideCircleCheck, LucideClock, LucideCircleAlert, LucideInfo, LucideCircleMinus],
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly texto = input.required<string>();
  readonly tom = input<TomBadge>('neutro');

  protected readonly classe = computed(() => {
    const tons: Record<TomBadge, string> = {
      sucesso: 'bg-sucesso-50 text-sucesso-700',
      alerta: 'bg-alerta-50 text-alerta-700',
      erro: 'bg-erro-50 text-erro-700',
      info: 'bg-info-50 text-info-700',
      neutro: 'bg-slate-100 text-slate-600',
    };
    return `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tons[this.tom()]}`;
  });
}
