import { Component, input } from '@angular/core';
import type { TomBadge } from '../../../core/state/config-recurso';
import { CLASSE_CARD } from '../../ui';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
})
export class StatCard {
  readonly rotulo = input.required<string>();
  readonly valor = input.required<string>();
  readonly detalhe = input<string>();
  readonly tom = input<TomBadge>('neutro');
  protected readonly card = CLASSE_CARD;
}
