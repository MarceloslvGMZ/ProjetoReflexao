import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { Posicao } from '../domain/posicao.js';
import { PosicaoRepository } from '../domain/posicao.repository.js';

export interface PosicaoRegistrada {
  onibusId: number;
  placa: string;
  latitude: number;
  longitude: number;
  atualizadoEm: string;
  desatualizada: boolean;
}

export interface PosicaoDaFrota extends PosicaoRegistrada {
  modelo: string;
  rota: string | null;
  motorista: string | null;
}

@Injectable()
export class RegistrarPosicaoUseCase {
  constructor(
    private readonly posicoes: PosicaoRepository,
    private readonly onibus: OnibusRepository,
  ) {}

  async executar(
    onibusId: number,
    usuarioId: number,
    coordenadas: { latitude: number; longitude: number },
  ): Promise<PosicaoRegistrada> {
    const veiculo = await this.onibus.buscarPorId(onibusId);
    if (!veiculo) throw new NotFoundError('Ônibus não encontrado');

    const posicao = await this.posicoes.salvar(Posicao.registrar({ ...coordenadas, onibusId, usuarioId }));
    return {
      onibusId: posicao.onibusId,
      placa: veiculo.placa,
      latitude: posicao.latitude,
      longitude: posicao.longitude,
      atualizadoEm: posicao.atualizadoEm.toISOString(),
      desatualizada: false,
    };
  }
}
