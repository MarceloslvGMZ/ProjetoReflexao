import { RemoverPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { OnibusRepository } from '../domain/onibus.repository.js';

export class RemoverOnibusUseCase extends RemoverPorIdUseCase(OnibusRepository, 'Ônibus não encontrado') {}
