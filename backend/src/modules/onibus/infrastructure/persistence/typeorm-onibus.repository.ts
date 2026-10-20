import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MensagemVinculo } from '../../../../shared/infrastructure/persistence/mensagem-vinculo.decorator.js';
import { TypeOrmCrudRepository } from '../../../../shared/infrastructure/persistence/typeorm-crud.repository.js';
import { Onibus } from '../../domain/onibus.js';
import { OnibusRepository } from '../../domain/onibus.repository.js';
import { OnibusOrmEntity } from './onibus.orm-entity.js';

@Injectable()
@MensagemVinculo('Ônibus está vinculado a outros registros (rotas ou ocorrências)')
export class TypeOrmOnibusRepository
  extends TypeOrmCrudRepository<Onibus, OnibusOrmEntity>
  implements OnibusRepository
{
  constructor(@InjectRepository(OnibusOrmEntity) repository: Repository<OnibusOrmEntity>) {
    super(repository, Onibus.restaurar);
  }

  buscarPorPlaca(placa: string): Promise<Onibus | null> {
    return this.buscarUmPor({ placa });
  }
}
