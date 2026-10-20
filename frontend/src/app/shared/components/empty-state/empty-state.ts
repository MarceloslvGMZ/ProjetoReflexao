import { Component, input } from '@angular/core';
import { LucideSearchX } from '@lucide/angular';

@Component({
  selector: 'app-empty-state',
  imports: [LucideSearchX],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly titulo = input.required<string>();
  readonly descricao = input('');
}
