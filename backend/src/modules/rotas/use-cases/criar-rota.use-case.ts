import { Injectable } from '@nestjs/common';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { PessoaRepository } from '../../pessoas/domain/pessoa.repository.js';
import { DadosRota, Rota } from '../domain/rota.js';
import { RotaRepository } from '../domain/rota.repository.js';
import { validarVinculosDaRota } from './validar-vinculos-rota.js';

@Injectable()
export class CriarRotaUseCase {
  constructor(
    private readonly rotaRepository: RotaRepository,
    private readonly onibusRepository: OnibusRepository,
    private readonly pessoaRepository: PessoaRepository,
  ) {}

  async executar(dados: DadosRota): Promise<Rota> {
    const rota = Rota.criar(dados);
    await validarVinculosDaRota(rota, {
      rotaRepository: this.rotaRepository,
      onibusRepository: this.onibusRepository,
      pessoaRepository: this.pessoaRepository,
    });
    return this.rotaRepository.salvar(rota);
  }
}
