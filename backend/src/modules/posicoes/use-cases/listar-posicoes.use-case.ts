import { Injectable } from '@nestjs/common';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { posicaoDesatualizada } from '../domain/posicao.js';
import { PosicaoRepository } from '../domain/posicao.repository.js';
import { PosicaoRegistrada } from './registrar-posicao.use-case.js';

@Injectable()
export class ListarPosicoesUseCase {
  constructor(
    private readonly posicoes: PosicaoRepository,
    private readonly onibus: OnibusRepository,
  ) {}

  async executar(agora = new Date()): Promise<PosicaoRegistrada[]> {
    const [posicoes, frota] = await Promise.all([this.posicoes.listar(), this.onibus.listar()]);
    const placas = new Map(frota.map((veiculo) => [veiculo.id, veiculo.placa]));

    return posicoes.flatMap((posicao) => {
      const placa = placas.get(posicao.onibusId);
      if (!placa) return [];
      return [
        {
          onibusId: posicao.onibusId,
          placa,
          latitude: posicao.latitude,
          longitude: posicao.longitude,
          atualizadoEm: posicao.atualizadoEm.toISOString(),
          desatualizada: posicaoDesatualizada(posicao.atualizadoEm, agora),
        },
      ];
    });
  }
}
