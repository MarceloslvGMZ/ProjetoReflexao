import { Injectable } from '@nestjs/common';
import { PosicaoRepository } from '../domain/posicao.repository.js';

@Injectable()
export class EncerrarCompartilhamentoUseCase {
  constructor(private readonly posicoes: PosicaoRepository) {}

  executar(onibusId: number): Promise<void> {
    return this.posicoes.remover(onibusId);
  }
}
