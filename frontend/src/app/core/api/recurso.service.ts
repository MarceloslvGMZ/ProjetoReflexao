import { Injectable, inject } from '@angular/core';
import { ApiService, ParametrosConsulta } from './api.service';

/**
 * Leitura e remoção genéricas por nome de recurso (`onibus`, `pessoas`, ...).
 * Criação e edição não ficam aqui: são enviadas pelo formulário dinâmico,
 * que usa o método e o caminho descritos pela própria API.
 */
@Injectable({ providedIn: 'root' })
export class RecursoService {
  private readonly api = inject(ApiService);

  listar<T>(recurso: string, filtros?: ParametrosConsulta): Promise<T[]> {
    return this.api.get<T[]>(`/${recurso}`, filtros);
  }

  buscar<T>(recurso: string, id: number): Promise<T> {
    return this.api.get<T>(`/${recurso}/${id}`);
  }

  remover(recurso: string, id: number): Promise<void> {
    return this.api.enviar<void>('DELETE', `/${recurso}/${id}`);
  }
}
