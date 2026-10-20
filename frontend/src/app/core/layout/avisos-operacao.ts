import { Injectable, signal } from '@angular/core';

/** Incrementado depois de criar, editar ou excluir, para o layout recarregar os avisos. */
@Injectable({ providedIn: 'root' })
export class AvisosOperacao {
  readonly versao = signal(0);

  atualizar(): void {
    this.versao.update((valor) => valor + 1);
  }
}
