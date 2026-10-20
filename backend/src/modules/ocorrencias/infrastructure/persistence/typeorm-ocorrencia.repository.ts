import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { TypeOrmCrudRepository } from '../../../../shared/infrastructure/persistence/typeorm-crud.repository.js';
import { Ocorrencia } from '../../domain/ocorrencia.js';
import { FiltroOcorrencias, OcorrenciaRepository } from '../../domain/ocorrencia.repository.js';
import { OcorrenciaOrmEntity } from './ocorrencia.orm-entity.js';

@Injectable()
export class TypeOrmOcorrenciaRepository
  extends TypeOrmCrudRepository<Ocorrencia, OcorrenciaOrmEntity>
  implements OcorrenciaRepository
{
  constructor(@InjectRepository(OcorrenciaOrmEntity) repository: Repository<OcorrenciaOrmEntity>) {
    super(repository, Ocorrencia.restaurar);
  }

  override async listar(filtro: FiltroOcorrencias = {}): Promise<Ocorrencia[]> {
    // Só entram no WHERE os filtros informados; o TypeORM não aceita `undefined` como valor.
    const where: FindOptionsWhere<OcorrenciaOrmEntity> = {};
    if (filtro.rotaId !== undefined) where.rotaId = filtro.rotaId;
    if (filtro.onibusId !== undefined) where.onibusId = filtro.onibusId;
    if (filtro.usuarioId !== undefined) where.usuarioId = filtro.usuarioId;

    const lista = await this.repository.find({ where, order: { dataHora: 'DESC', id: 'DESC' } });
    return lista.map((orm) => this.paraDominio(orm));
  }
}
