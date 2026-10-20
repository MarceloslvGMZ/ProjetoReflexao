import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MensagemVinculo } from '../../../../shared/infrastructure/persistence/mensagem-vinculo.decorator.js';
import { TypeOrmCrudRepository } from '../../../../shared/infrastructure/persistence/typeorm-crud.repository.js';
import { Rota, Turno } from '../../domain/rota.js';
import { RotaRepository } from '../../domain/rota.repository.js';
import { RotaOrmEntity } from './rota.orm-entity.js';

@Injectable()
@MensagemVinculo('Rota está vinculada a uma ou mais ocorrências')
export class TypeOrmRotaRepository
  extends TypeOrmCrudRepository<Rota, RotaOrmEntity>
  implements RotaRepository
{
  constructor(@InjectRepository(RotaOrmEntity) repository: Repository<RotaOrmEntity>) {
    super(repository, Rota.restaurar);
  }

  async listarAtivasPorTurno(turno: Turno): Promise<Rota[]> {
    const lista = await this.repository.findBy({ turno, ativo: true });
    return lista.map((orm) => this.paraDominio(orm));
  }
}
