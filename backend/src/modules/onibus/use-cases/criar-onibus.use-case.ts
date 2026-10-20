import { Injectable } from '@nestjs/common';
import { ConflictError } from '../../../shared/domain/errors.js';
import { DadosOnibus, Onibus } from '../domain/onibus.js';
import { OnibusRepository } from '../domain/onibus.repository.js';

@Injectable()
export class CriarOnibusUseCase {
  constructor(private readonly onibusRepository: OnibusRepository) {}

  async executar(dados: DadosOnibus): Promise<Onibus> {
    const onibus = Onibus.criar(dados);

    if (await this.onibusRepository.buscarPorPlaca(onibus.placa)) {
      throw new ConflictError('Já existe um ônibus com essa placa');
    }

    return this.onibusRepository.salvar(onibus);
  }
}
