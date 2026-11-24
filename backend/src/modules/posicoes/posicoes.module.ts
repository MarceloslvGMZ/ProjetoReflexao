import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { OnibusModule } from '../onibus/onibus.module.js';
import { PessoasModule } from '../pessoas/pessoas.module.js';
import { RotasModule } from '../rotas/rotas.module.js';
import { PosicaoRepository } from './domain/posicao.repository.js';
import { PosicoesController } from './infrastructure/http/posicoes.controller.js';
import { PosicaoOrmEntity } from './infrastructure/persistence/posicao.orm-entity.js';
import { TypeOrmPosicaoRepository } from './infrastructure/persistence/typeorm-posicao.repository.js';
import { PosicoesGateway } from './infrastructure/ws/posicoes.gateway.js';
import { EncerrarCompartilhamentoUseCase } from './use-cases/encerrar-compartilhamento.use-case.js';
import { ListarPosicoesUseCase } from './use-cases/listar-posicoes.use-case.js';
import { RegistrarPosicaoUseCase } from './use-cases/registrar-posicao.use-case.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PosicaoOrmEntity]),
    AuthModule,
    OnibusModule,
    RotasModule,
    PessoasModule,
  ],
  controllers: [PosicoesController],
  providers: [
    PosicoesGateway,
    RegistrarPosicaoUseCase,
    ListarPosicoesUseCase,
    EncerrarCompartilhamentoUseCase,
    { provide: PosicaoRepository, useClass: TypeOrmPosicaoRepository },
  ],
})
export class PosicoesModule {}
