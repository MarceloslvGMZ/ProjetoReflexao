import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnibusModule } from '../onibus/onibus.module.js';
import { PosicaoRepository } from './domain/posicao.repository.js';
import { PosicoesController } from './infrastructure/http/posicoes.controller.js';
import { PosicaoOrmEntity } from './infrastructure/persistence/posicao.orm-entity.js';
import { TypeOrmPosicaoRepository } from './infrastructure/persistence/typeorm-posicao.repository.js';
import { ListarPosicoesUseCase } from './use-cases/listar-posicoes.use-case.js';
import { RegistrarPosicaoUseCase } from './use-cases/registrar-posicao.use-case.js';

@Module({
  imports: [TypeOrmModule.forFeature([PosicaoOrmEntity]), OnibusModule],
  controllers: [PosicoesController],
  providers: [
    RegistrarPosicaoUseCase,
    ListarPosicoesUseCase,
    { provide: PosicaoRepository, useClass: TypeOrmPosicaoRepository },
  ],
})
export class PosicoesModule {}
