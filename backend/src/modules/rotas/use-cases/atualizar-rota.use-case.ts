import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { PessoaRepository } from '../../pessoas/domain/pessoa.repository.js';
import { DadosRota, Rota } from '../domain/rota.js';
import { RotaRepository } from '../domain/rota.repository.js';
import { validarVinculosDaRota } from './validar-vinculos-rota.js';

@Injectable()
export class AtualizarRotaUseCase {
  constructor(
    private readonly rotaRepository: RotaRepository,
    private readonly onibusRepository: OnibusRepository,
    private readonly pessoaRepository: PessoaRepository,
  ) {}

  async executar(id: number, dados: DadosRota): Promise<Rota> {
    const rota = await this.rotaRepository.buscarPorId(id);
    if (!rota) throw new NotFoundError('Rota não encontrada');

    rota.atualizar(dados);
    await validarVinculosDaRota(rota, {
      rotaRepository: this.rotaRepository,
      onibusRepository: this.onibusRepository,
      pessoaRepository: this.pessoaRepository,
    });

    return this.rotaRepository.salvar(rota);
  }
}
