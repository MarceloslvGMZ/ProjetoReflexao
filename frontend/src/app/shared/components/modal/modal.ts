import { Component, OnDestroy, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { TrapFocus } from '../../directives/trap-focus';

let proximoId = 0;

@Component({
  selector: 'app-modal',
  imports: [LucideX, TrapFocus],
  templateUrl: './modal.html',
})
export class Modal implements OnDestroy {
  readonly titulo = input.required<string>();
  readonly fechado = output<void>();

  protected readonly idTitulo = `modal-titulo-${++proximoId}`;
  private readonly origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  constructor() {
    document.body.classList.add('overflow-hidden');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
    this.origem?.focus();
  }

  protected fechar(): void {
    this.fechado.emit();
  }
}
