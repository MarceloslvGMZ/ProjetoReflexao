import { DomainError } from '../../../shared/domain/errors.js';

export interface DadosPosicao {
  onibusId: number;
  latitude: number;
  longitude: number;
  usuarioId: number;
}

/** Última coordenada conhecida de um ônibus. Há no máximo um registro por veículo. */
export class Posicao {
  private constructor(
    public readonly onibusId: number,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly atualizadoEm: Date,
    public readonly usuarioId: number,
  ) {}

  static registrar(dados: DadosPosicao, agora = new Date()): Posicao {
    if (!Number.isFinite(dados.latitude) || dados.latitude < -90 || dados.latitude > 90) {
      throw new DomainError('Latitude deve estar entre -90 e 90');
    }
    if (!Number.isFinite(dados.longitude) || dados.longitude < -180 || dados.longitude > 180) {
      throw new DomainError('Longitude deve estar entre -180 e 180');
    }
    return new Posicao(dados.onibusId, dados.latitude, dados.longitude, agora, dados.usuarioId);
  }
}

/** Depois desse prazo, o painel trata a posição como parada, não como veículo em movimento. */
export const POSICAO_RECENTE_MS = 2 * 60 * 1000;

export function posicaoDesatualizada(atualizadoEm: Date, agora = new Date()): boolean {
  return agora.getTime() - atualizadoEm.getTime() > POSICAO_RECENTE_MS;
}
