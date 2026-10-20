import { Onibus } from '../../src/modules/onibus/domain/onibus.js';
import { OnibusRepository } from '../../src/modules/onibus/domain/onibus.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryOnibusRepository extends InMemoryRepository<Onibus> implements OnibusRepository {
  constructor() {
    super((id, onibus) => Onibus.restaurar(id, onibus));
  }

  async buscarPorPlaca(placa: string) {
    return this.buscarUm((onibus) => onibus.placa === placa);
  }
}
