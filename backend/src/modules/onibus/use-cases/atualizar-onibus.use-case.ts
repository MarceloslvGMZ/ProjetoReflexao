import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import { DadosOnibus, Onibus } from '../domain/onibus.js';
import { OnibusRepository } from '../domain/onibus.repository.js';

@Injectable()
export class AtualizarOnibusUseCase {
  constructor(private readonly onibusRepository: OnibusRepository) {}

  async executar(id: number, dados: DadosOnibus): Promise<Onibus> {
    const onibus = await this.onibusRepository.buscarPorId(id);
    if (!onibus) throw new NotFoundError('Ônibus não encontrado');

    onibus.atualizar(dados);

    const mesmaPlaca = await this.onibusRepository.buscarPorPlaca(onibus.placa);
    if (mesmaPlaca && mesmaPlaca.id !== onibus.id) {
      throw new ConflictError('Já existe um ônibus com essa placa');
    }

    return this.onibusRepository.salvar(onibus);
  }
}
