import { ListarUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { RotaRepository } from '../domain/rota.repository.js';

export class ListarRotasUseCase extends ListarUseCase(RotaRepository) {}
