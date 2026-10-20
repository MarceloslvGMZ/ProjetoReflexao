import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PessoaRepository } from './domain/pessoa.repository.js';
import { PessoasController } from './infrastructure/http/pessoas.controller.js';
import { PessoaOrmEntity } from './infrastructure/persistence/pessoa.orm-entity.js';
import { TypeOrmPessoaRepository } from './infrastructure/persistence/typeorm-pessoa.repository.js';
import { AtualizarPessoaUseCase } from './use-cases/atualizar-pessoa.use-case.js';
import { BuscarPessoaUseCase } from './use-cases/buscar-pessoa.use-case.js';
import { CriarPessoaUseCase } from './use-cases/criar-pessoa.use-case.js';
import { ListarPessoasUseCase } from './use-cases/listar-pessoas.use-case.js';
import { RemoverPessoaUseCase } from './use-cases/remover-pessoa.use-case.js';

@Module({
  imports: [TypeOrmModule.forFeature([PessoaOrmEntity])],
  controllers: [PessoasController],
  providers: [
    CriarPessoaUseCase,
    ListarPessoasUseCase,
    BuscarPessoaUseCase,
    AtualizarPessoaUseCase,
    RemoverPessoaUseCase,
    { provide: PessoaRepository, useClass: TypeOrmPessoaRepository },
  ],
  exports: [PessoaRepository],
})
export class PessoasModule {}
