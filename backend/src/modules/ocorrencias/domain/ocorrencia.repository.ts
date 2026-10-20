import { Ocorrencia } from './ocorrencia.js';

export interface FiltroOcorrencias {
  rotaId?: number;
  onibusId?: number;
  usuarioId?: number;
}

export abstract class OcorrenciaRepository {
  abstract salvar(ocorrencia: Ocorrencia): Promise<Ocorrencia>;
  abstract buscarPorId(id: number): Promise<Ocorrencia | null>;
  /** Mais recentes primeiro. */
  abstract listar(filtro?: FiltroOcorrencias): Promise<Ocorrencia[]>;
  abstract remover(id: number): Promise<void>;
}
