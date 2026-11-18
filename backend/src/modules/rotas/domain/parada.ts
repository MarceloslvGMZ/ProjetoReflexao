import { DomainError } from '../../../shared/domain/errors.js';

export const SENTIDOS_PARADA = ['IDA', 'VOLTA'] as const;
export type SentidoParada = (typeof SENTIDOS_PARADA)[number];

export const TIPOS_PARADA = ['PARADA', 'PASSAGEM'] as const;
export type TipoParada = (typeof TIPOS_PARADA)[number];

/** Ponto na ordem do percurso: parada de aluno ou passagem só para forçar a rua. */
export interface Parada {
  nome: string;
  latitude: number;
  longitude: number;
  sentido: SentidoParada;
  tipo: TipoParada;
}

export const LIMITE_PARADAS_POR_SENTIDO = 20;

export function normalizarParadas(valor: unknown): Parada[] {
  if (valor == null) return [];
  if (!Array.isArray(valor)) throw new DomainError('Paradas devem ser uma lista');

  const lista = valor.map((item, indice) => {
    const posicao = indice + 1;
    if (!item || typeof item !== 'object') {
      throw new DomainError(`A parada ${posicao} está incompleta`);
    }
    const registro = item as Record<string, unknown>;
    const nome = String(registro['nome'] ?? '').trim();
    const latitude = Number(registro['latitude']);
    const longitude = Number(registro['longitude']);
    if (!nome) throw new DomainError(`A parada ${posicao} precisa de um nome`);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new DomainError(`A parada ${posicao} está fora do mapa`);
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new DomainError(`A parada ${posicao} está fora do mapa`);
    }
    return {
      nome,
      latitude,
      longitude,
      sentido: sentidoDe(registro['sentido'], posicao),
      tipo: tipoDe(registro['tipo'], posicao),
    };
  });

  const ida = lista.filter((parada) => parada.sentido === 'IDA').length;
  const volta = lista.filter((parada) => parada.sentido === 'VOLTA').length;
  if (ida > LIMITE_PARADAS_POR_SENTIDO) {
    throw new DomainError(`A ida aceita no máximo ${LIMITE_PARADAS_POR_SENTIDO} pontos`);
  }
  if (volta > LIMITE_PARADAS_POR_SENTIDO) {
    throw new DomainError(`A volta aceita no máximo ${LIMITE_PARADAS_POR_SENTIDO} pontos`);
  }
  return lista;
}

/** Parada antiga sem sentido entra na ida. */
function sentidoDe(valor: unknown, posicao: number): SentidoParada {
  if (valor == null || valor === '') return 'IDA';
  if (valor === 'IDA' || valor === 'VOLTA') return valor;
  throw new DomainError(`A parada ${posicao} tem sentido inválido`);
}

/** Sem tipo, é parada de aluno. */
function tipoDe(valor: unknown, posicao: number): TipoParada {
  if (valor == null || valor === '') return 'PARADA';
  if (valor === 'PARADA' || valor === 'PASSAGEM') return valor;
  throw new DomainError(`A parada ${posicao} tem tipo inválido`);
}
