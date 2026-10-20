import { Injectable } from '@nestjs/common';
import { Ocorrencia } from '../domain/ocorrencia.js';
import { FiltroOcorrencias, OcorrenciaRepository } from '../domain/ocorrencia.repository.js';

@Injectable()
export class ListarOcorrenciasUseCase {
  constructor(private readonly ocorrenciaRepository: OcorrenciaRepository) {}

  executar(filtro: FiltroOcorrencias = {}): Promise<Ocorrencia[]> {
    return this.ocorrenciaRepository.listar(filtro);
  }
}
