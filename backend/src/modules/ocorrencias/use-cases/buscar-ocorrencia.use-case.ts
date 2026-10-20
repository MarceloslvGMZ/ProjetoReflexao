import { BuscarPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { OcorrenciaRepository } from '../domain/ocorrencia.repository.js';

export class BuscarOcorrenciaUseCase extends BuscarPorIdUseCase(
  OcorrenciaRepository,
  'Ocorrência não encontrada',
) {}
