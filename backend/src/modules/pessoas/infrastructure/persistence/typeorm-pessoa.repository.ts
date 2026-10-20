import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MensagemVinculo } from '../../../../shared/infrastructure/persistence/mensagem-vinculo.decorator.js';
import { TypeOrmCrudRepository } from '../../../../shared/infrastructure/persistence/typeorm-crud.repository.js';
import { Pessoa } from '../../domain/pessoa.js';
import { PessoaRepository } from '../../domain/pessoa.repository.js';
import { PessoaOrmEntity } from './pessoa.orm-entity.js';

@Injectable()
@MensagemVinculo('Pessoa está vinculada a outros registros (rotas ou usuário)')
export class TypeOrmPessoaRepository
  extends TypeOrmCrudRepository<Pessoa, PessoaOrmEntity>
  implements PessoaRepository
{
  constructor(@InjectRepository(PessoaOrmEntity) repository: Repository<PessoaOrmEntity>) {
    super(repository, Pessoa.restaurar);
  }

  buscarPorCpf(cpf: string): Promise<Pessoa | null> {
    return this.buscarUmPor({ cpf });
  }

  buscarPorMatricula(matricula: string): Promise<Pessoa | null> {
    return this.buscarUmPor({ matricula });
  }
}
