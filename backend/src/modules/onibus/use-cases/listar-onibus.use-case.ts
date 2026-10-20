import { ListarUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { OnibusRepository } from '../domain/onibus.repository.js';

export class ListarOnibusUseCase extends ListarUseCase(OnibusRepository) {}
