import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { RotaRepository } from '../../rotas/domain/rota.repository.js';
import { DadosAtualizacaoOcorrencia, Ocorrencia } from '../domain/ocorrencia.js';
import { OcorrenciaRepository } from '../domain/ocorrencia.repository.js';
import { garantirAutorOuAdministrador, Solicitante } from './garantir-permissao.js';
import { validarVinculosDaOcorrencia } from './validar-vinculos-ocorrencia.js';

@Injectable()
export class AtualizarOcorrenciaUseCase {
  constructor(
    private readonly ocorrenciaRepository: OcorrenciaRepository,
    private readonly rotaRepository: RotaRepository,
    private readonly onibusRepository: OnibusRepository,
  ) {}

  async executar(
    id: number,
    solicitante: Solicitante,
    dados: DadosAtualizacaoOcorrencia,
  ): Promise<Ocorrencia> {
    const ocorrencia = await this.ocorrenciaRepository.buscarPorId(id);
    if (!ocorrencia) throw new NotFoundError('Ocorrência não encontrada');
    garantirAutorOuAdministrador(ocorrencia, solicitante);

    ocorrencia.atualizar(dados);
    await validarVinculosDaOcorrencia(ocorrencia, {
      rotaRepository: this.rotaRepository,
      onibusRepository: this.onibusRepository,
    });

    return this.ocorrenciaRepository.salvar(ocorrencia);
  }
}
