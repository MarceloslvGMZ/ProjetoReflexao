import { Ocorrencia } from '../../src/modules/ocorrencias/domain/ocorrencia.js';
import {
  FiltroOcorrencias,
  OcorrenciaRepository,
} from '../../src/modules/ocorrencias/domain/ocorrencia.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryOcorrenciaRepository
  extends InMemoryRepository<Ocorrencia>
  implements OcorrenciaRepository
{
  constructor() {
    super((id, ocorrencia) => Ocorrencia.restaurar(id, ocorrencia));
  }

  override async listar(filtro: FiltroOcorrencias = {}) {
    return this.filtrar(
      (o) =>
        (filtro.rotaId === undefined || o.rotaId === filtro.rotaId) &&
        (filtro.onibusId === undefined || o.onibusId === filtro.onibusId) &&
        (filtro.usuarioId === undefined || o.usuarioId === filtro.usuarioId),
    ).sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime() || b.id! - a.id!);
  }
}
