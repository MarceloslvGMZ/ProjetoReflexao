import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import type { DescricaoFormulario } from './formulario.model';

@Injectable({ providedIn: 'root' })
export class FormulariosService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  /** Os metadados só mudam quando o backend reinicia, então ficam em cache durante a sessão. */
  private readonly cache = new Map<string, Promise<DescricaoFormulario>>();

  buscar(recurso: string, acao: string): Promise<DescricaoFormulario> {
    const chave = `${recurso}/${acao}`;
    let descricao = this.cache.get(chave);
    if (!descricao) {
      descricao = this.api.get<DescricaoFormulario>(`/formularios/${chave}`).catch((erro) => {
        this.cache.delete(chave);
        throw erro;
      });
      this.cache.set(chave, descricao);
    }
    return descricao;
  }

  /** O usuário logado pode enviar o formulário? Usa os `perfis` lidos por reflexão no backend. */
  podeEnviar(descricao: Pick<DescricaoFormulario, 'perfis'>): boolean {
    return this.auth.possuiPerfil(descricao.perfis);
  }
}
