import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { paraErroApi } from './erro-api';

export type MetodoEscrita = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ParametrosConsulta = Record<string, string | number | boolean | null | undefined>;

/** Cliente HTTP da API. Toda falha é convertida em `ErroApi`. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  url(caminho: string): string {
    return `${environment.apiUrl}/${caminho.replace(/^\//, '')}`;
  }

  get<T>(caminho: string, parametros?: ParametrosConsulta): Promise<T> {
    return this.requisitar<T>('GET', caminho, { params: paraHttpParams(parametros) });
  }

  /** Usado pelo formulário dinâmico com o `metodo` e o `caminho` descritos em `GET /formularios`. */
  enviar<T>(metodo: MetodoEscrita, caminho: string, corpo?: unknown): Promise<T> {
    return this.requisitar<T>(metodo, caminho, { body: corpo });
  }

  private async requisitar<T>(
    metodo: string,
    caminho: string,
    opcoes: { body?: unknown; params?: HttpParams },
  ): Promise<T> {
    try {
      return await firstValueFrom(this.http.request<T>(metodo, this.url(caminho), opcoes));
    } catch (erro) {
      throw paraErroApi(erro);
    }
  }
}

function paraHttpParams(parametros?: ParametrosConsulta): HttpParams | undefined {
  if (!parametros) return undefined;
  return Object.entries(parametros).reduce(
    (params, [chave, valor]) =>
      valor === null || valor === undefined || valor === '' ? params : params.set(chave, valor),
    new HttpParams(),
  );
}
