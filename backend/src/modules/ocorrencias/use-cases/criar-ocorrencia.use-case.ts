import { Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { RotaRepository } from '../../rotas/domain/rota.repository.js';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository.js';
import { DadosAtualizacaoOcorrencia, Ocorrencia } from '../domain/ocorrencia.js';
import { OcorrenciaRepository } from '../domain/ocorrencia.repository.js';
import { validarVinculosDaOcorrencia } from './validar-vinculos-ocorrencia.js';

@Injectable()
export class CriarOcorrenciaUseCase {
  constructor(
    private readonly ocorrenciaRepository: OcorrenciaRepository,
    private readonly rotaRepository: RotaRepository,
    private readonly onibusRepository: OnibusRepository,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async executar(usuarioId: number, dados: DadosAtualizacaoOcorrencia): Promise<Ocorrencia> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario?.ativo) throw new UnauthorizedError('Usuário inexistente ou inativo');

    const ocorrencia = Ocorrencia.criar({ ...dados, usuarioId });
    await validarVinculosDaOcorrencia(ocorrencia, {
      rotaRepository: this.rotaRepository,
      onibusRepository: this.onibusRepository,
    });
    return this.ocorrenciaRepository.salvar(ocorrencia);
  }
}
