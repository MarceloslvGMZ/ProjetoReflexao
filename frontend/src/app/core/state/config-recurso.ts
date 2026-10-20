import type { ParametrosConsulta } from '../api/api.service';
import type { ReferenciaCampo, TipoCampo } from '../formularios/formulario.model';

export type Registro = { id: number } & Record<string, unknown>;
export type TomBadge = 'sucesso' | 'alerta' | 'erro' | 'info' | 'neutro';

export interface Badge {
  texto: string;
  tom: TomBadge;
}

export interface ColunaLista {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  referencia?: ReferenciaCampo;
}

export interface FiltroLista {
  id: string;
  rotulo: string;
  opcoes?: readonly { valor: string; rotulo: string }[];
  referencia?: ReferenciaCampo;
  /** Quando verdadeiro, a lista é buscada de novo na API. */
  recarrega?: boolean;
  corresponde?: (item: Registro, valor: string, extras: unknown) => boolean;
}

export interface Indicador {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: TomBadge;
}

export interface ContextoLista {
  itens: Registro[];
  extras: unknown;
  carregadoEm: Date | null;
}

export interface ConfigRecurso {
  recurso: string;
  titulo: string;
  descricao: string;
  rotuloNovo: string;
  buscarEm: readonly string[];
  colunas?: readonly ColunaLista[];
  filtros?: readonly FiltroLista[];
  indicadores?: (contexto: ContextoLista) => Indicador[];
  badge?: (item: Registro, extras: unknown) => Badge | null;
  formatar?: Record<string, (valor: unknown, item: Registro) => string>;
  somenteLeituraNaEdicao?: readonly string[];
  podeAlterar?: (item: Registro) => boolean;
  extras?: () => Promise<unknown>;
  parametros?: (filtros: Readonly<Record<string, string>>) => ParametrosConsulta;
  acaoCriar?: string;
  acaoAtualizar?: string;
}
