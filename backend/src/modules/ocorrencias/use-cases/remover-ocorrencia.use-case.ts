import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { OcorrenciaRepository } from '../domain/ocorrencia.repository.js';
import { garantirAutorOuAdministrador, Solicitante } from './garantir-permissao.js';

@Injectable()
export class RemoverOcorrenciaUseCase {
  constructor(private readonly ocorrenciaRepository: OcorrenciaRepository) {}

  async executar(id: number, solicitante: Solicitante): Promise<void> {
    const ocorrencia = await this.ocorrenciaRepository.buscarPorId(id);
    if (!ocorrencia) throw new NotFoundError('Ocorrência não encontrada');
    garantirAutorOuAdministrador(ocorrencia, solicitante);

    await this.ocorrenciaRepository.remover(id);
  }
}
