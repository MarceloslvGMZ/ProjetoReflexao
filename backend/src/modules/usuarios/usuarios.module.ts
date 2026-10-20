import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PessoasModule } from '../pessoas/pessoas.module.js';
import { HashService } from './domain/hash.service.js';
import { UsuarioRepository } from './domain/usuario.repository.js';
import { BcryptHashService } from './infrastructure/crypto/bcrypt-hash.service.js';
import { UsuariosController } from './infrastructure/http/usuarios.controller.js';
import { TypeOrmUsuarioRepository } from './infrastructure/persistence/typeorm-usuario.repository.js';
import { UsuarioOrmEntity } from './infrastructure/persistence/usuario.orm-entity.js';
import { AdminInicialSeed } from './infrastructure/seed/admin-inicial.seed.js';
import { AtualizarUsuarioUseCase } from './use-cases/atualizar-usuario.use-case.js';
import { BuscarUsuarioUseCase } from './use-cases/buscar-usuario.use-case.js';
import { CriarUsuarioUseCase } from './use-cases/criar-usuario.use-case.js';
import { ListarUsuarioUseCase } from './use-cases/listar-usuario.use-case.js';
import { RemoverUsuarioUseCase } from './use-cases/remover-usuario.use-case.js';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioOrmEntity]), PessoasModule],
  controllers: [UsuariosController],
  providers: [
    CriarUsuarioUseCase,
    ListarUsuarioUseCase,
    BuscarUsuarioUseCase,
    AtualizarUsuarioUseCase,
    RemoverUsuarioUseCase,
    AdminInicialSeed,
    { provide: UsuarioRepository, useClass: TypeOrmUsuarioRepository },
    { provide: HashService, useClass: BcryptHashService },
  ],
  exports: [UsuarioRepository, HashService],
})
export class UsuariosModule {}
