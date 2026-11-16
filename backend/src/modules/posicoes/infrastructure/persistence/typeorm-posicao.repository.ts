import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Posicao } from '../../domain/posicao.js';
import { PosicaoRepository } from '../../domain/posicao.repository.js';
import { PosicaoOrmEntity } from './posicao.orm-entity.js';

@Injectable()
export class TypeOrmPosicaoRepository implements PosicaoRepository {
  constructor(@InjectRepository(PosicaoOrmEntity) private readonly repository: Repository<PosicaoOrmEntity>) {}

  async salvar(posicao: Posicao): Promise<Posicao> {
    await this.repository.save({
      onibusId: posicao.onibusId,
      latitude: posicao.latitude,
      longitude: posicao.longitude,
      atualizadoEm: posicao.atualizadoEm,
      usuarioId: posicao.usuarioId,
    });
    return posicao;
  }

  async remover(onibusId: number): Promise<void> {
    await this.repository.delete({ onibusId });
  }

  async listar(): Promise<Posicao[]> {
    const linhas = await this.repository.find({ order: { onibusId: 'ASC' } });
    return linhas.map((linha) =>
      Posicao.registrar(
        {
          onibusId: linha.onibusId,
          latitude: linha.latitude,
          longitude: linha.longitude,
          usuarioId: linha.usuarioId,
        },
        new Date(linha.atualizadoEm),
      ),
    );
  }
}
