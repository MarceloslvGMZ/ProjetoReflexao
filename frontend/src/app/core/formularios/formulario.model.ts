import type { Perfil } from '../models';

/** Espelho de `backend/src/shared/infrastructure/http/formulario/campo.decorator.ts`. */
export type TipoCampo =
  | 'texto'
  | 'senha'
  | 'numero'
  | 'booleano'
  | 'selecao'
  | 'data-hora'
  | 'referencia';

export interface ReferenciaCampo {
  /** Recurso listado em `GET /{recurso}` para montar as opções. */
  recurso: string;
  /** Propriedade do item exibida como rótulo da opção. */
  exibir: string;
}

export interface DescricaoCampo {
  nome: string;
  rotulo: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
  opcoes?: readonly string[];
  referencia?: ReferenciaCampo;
  /** O campo só se aplica (e passa a ser obrigatório) quando outro campo tiver o valor informado. */
  obrigatorioSe?: { campo: string; igual: string };
  exemplo?: string;
  ajuda?: string;
}

/** Espelho de `formularios.service.ts` do backend (`GET /formularios/:recurso/:acao`). */
export interface DescricaoFormulario {
  recurso: string;
  acao: string;
  metodo: 'POST' | 'PUT' | 'PATCH';
  /** Pode conter `:id`, ex.: `/onibus/:id`. */
  caminho: string;
  /** Vazio = qualquer usuário logado. */
  perfis: Perfil[];
  campos: DescricaoCampo[];
}
