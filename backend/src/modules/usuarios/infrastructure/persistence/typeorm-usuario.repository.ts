import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { MensagemVinculo } from '../../../../shared/infrastructure/persistence/mensagem-vinculo.decorator.js';
import { TypeOrmCrudRepository } from '../../../../shared/infrastructure/persistence/typeorm-crud.repository.js';
import { Usuario } from '../../domain/usuario.js';
import { UsuarioRepository } from '../../domain/usuario.repository.js';
import { UsuarioOrmEntity } from './usuario.orm-entity.js';

@Injectable()
@MensagemVinculo('Usuário está vinculado a outros registros (ocorrências)')
export class TypeOrmUsuarioRepository
  extends TypeOrmCrudRepository<Usuario, UsuarioOrmEntity>
  implements UsuarioRepository
{
  protected override readonly ordemPadrao: FindOptionsOrder<UsuarioOrmEntity> = { usuario: 'ASC' };

  constructor(@InjectRepository(UsuarioOrmEntity) repository: Repository<UsuarioOrmEntity>) {
    super(repository, Usuario.restaurar);
  }

  buscarPorLogin(login: string): Promise<Usuario | null> {
    return this.buscarUmPor({ usuario: login });
  }

  buscarPorPessoaId(pessoaId: number): Promise<Usuario | null> {
    return this.buscarUmPor({ pessoaId });
  }
}
