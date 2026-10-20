import { Injectable, inject } from '@angular/core';
import { RecursoService } from '../api/recurso.service';
import type { ReferenciaCampo } from './formulario.model';

export interface OpcaoReferencia {
  valor: number;
  rotulo: string;
}

type Item = Record<string, unknown>;

/** Opções dos campos do tipo `referencia`, carregadas de `GET /{recurso}` com cache por recurso. */
@Injectable({ providedIn: 'root' })
export class ReferenciasService {
  private readonly recursos = inject(RecursoService);
  private readonly cache = new Map<string, Promise<Item[]>>();

  async opcoes(referencia: ReferenciaCampo): Promise<OpcaoReferencia[]> {
    const itens = await this.itens(referencia.recurso);
    return itens
      .map((item) => ({
        valor: Number(item['id']),
        rotulo: String(item[referencia.exibir] ?? `#${String(item['id'])}`),
      }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  }

  /** Deve ser chamado sempre que um registro do recurso for criado, alterado ou removido. */
  invalidar(recurso: string): void {
    this.cache.delete(recurso);
  }

  private itens(recurso: string): Promise<Item[]> {
    let itens = this.cache.get(recurso);
    if (!itens) {
      itens = this.recursos.listar<Item>(recurso).catch((erro) => {
        this.cache.delete(recurso);
        throw erro;
      });
      this.cache.set(recurso, itens);
    }
    return itens;
  }
}
