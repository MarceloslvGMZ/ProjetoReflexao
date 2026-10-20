import { BuscarPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { RotaRepository } from '../domain/rota.repository.js';

export class BuscarRotaUseCase extends BuscarPorIdUseCase(RotaRepository, 'Rota não encontrada') {}
