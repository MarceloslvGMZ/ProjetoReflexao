import { DomainError } from '../../../shared/domain/errors.js';

/** Local marcado no mapa, na ordem em que o ônibus deve passar. */
export interface Parada {
  nome: string;
  latitude: number;
  longitude: number;
}

export const LIMITE_PARADAS = 20;

export function normalizarParadas(valor: unknown): Parada[] {
  if (valor == null) return [];
  if (!Array.isArray(valor)) throw new DomainError('Paradas devem ser uma lista');
  if (valor.length > LIMITE_PARADAS) {
    throw new DomainError(`Uma rota aceita no máximo ${LIMITE_PARADAS} paradas`);
  }

  return valor.map((item, indice) => {
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
    return { nome, latitude, longitude };
  });
}
