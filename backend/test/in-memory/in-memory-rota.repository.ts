import { Rota, Turno } from '../../src/modules/rotas/domain/rota.js';
import { RotaRepository } from '../../src/modules/rotas/domain/rota.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryRotaRepository extends InMemoryRepository<Rota> implements RotaRepository {
  constructor() {
    super((id, rota) => Rota.restaurar(id, rota));
  }

  async listarAtivasPorTurno(turno: Turno) {
    return this.filtrar((rota) => rota.ativo && rota.turno === turno);
  }
}
