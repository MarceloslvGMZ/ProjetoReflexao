import { BuscarPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { OnibusRepository } from '../domain/onibus.repository.js';

export class BuscarOnibusUseCase extends BuscarPorIdUseCase(OnibusRepository, 'Ônibus não encontrado') {}
