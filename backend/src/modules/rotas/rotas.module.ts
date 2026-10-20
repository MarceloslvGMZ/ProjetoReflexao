import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnibusModule } from '../onibus/onibus.module.js';
import { PessoasModule } from '../pessoas/pessoas.module.js';
import { RotaRepository } from './domain/rota.repository.js';
import { RotasController } from './infrastructure/http/rotas.controller.js';
import { RotaOrmEntity } from './infrastructure/persistence/rota.orm-entity.js';
import { TypeOrmRotaRepository } from './infrastructure/persistence/typeorm-rota.repository.js';
import { AtualizarRotaUseCase } from './use-cases/atualizar-rota.use-case.js';
import { BuscarRotaUseCase } from './use-cases/buscar-rota.use-case.js';
import { CriarRotaUseCase } from './use-cases/criar-rota.use-case.js';
import { ListarRotasUseCase } from './use-cases/listar-rotas.use-case.js';
import { RemoverRotaUseCase } from './use-cases/remover-rota.use-case.js';

@Module({
  // OnibusModule e PessoasModule exportam suas portas, usadas para validar os vínculos da rota.
  imports: [TypeOrmModule.forFeature([RotaOrmEntity]), OnibusModule, PessoasModule],
  controllers: [RotasController],
  providers: [
    CriarRotaUseCase,
    ListarRotasUseCase,
    BuscarRotaUseCase,
    AtualizarRotaUseCase,
    RemoverRotaUseCase,
    { provide: RotaRepository, useClass: TypeOrmRotaRepository },
  ],
  exports: [RotaRepository],
})
export class RotasModule {}
