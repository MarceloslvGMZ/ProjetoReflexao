import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: number;
  tipo: 'sucesso' | 'erro';
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly itens = signal<ToastItem[]>([]);
  private proximoId = 0;

  sucesso(texto: string): void {
    this.mostrar('sucesso', texto);
  }

  erro(texto: string): void {
    this.mostrar('erro', texto);
  }

  remover(id: number): void {
    this.itens.update((itens) => itens.filter((item) => item.id !== id));
  }

  private mostrar(tipo: ToastItem['tipo'], texto: string): void {
    const id = ++this.proximoId;
    this.itens.update((itens) => [...itens, { id, tipo, texto }]);
    setTimeout(() => this.remover(id), 5000);
  }
}
