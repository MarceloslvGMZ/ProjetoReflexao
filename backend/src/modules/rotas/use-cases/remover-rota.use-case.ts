import { RemoverPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { RotaRepository } from '../domain/rota.repository.js';

export class RemoverRotaUseCase extends RemoverPorIdUseCase(RotaRepository, 'Rota não encontrada') {}
