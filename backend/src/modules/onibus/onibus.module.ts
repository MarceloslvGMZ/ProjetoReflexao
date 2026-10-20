import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtualizarOnibusUseCase } from './use-cases/atualizar-onibus.use-case.js';
import { BuscarOnibusUseCase } from './use-cases/buscar-onibus.use-case.js';
import { CriarOnibusUseCase } from './use-cases/criar-onibus.use-case.js';
import { ListarOnibusUseCase } from './use-cases/listar-onibus.use-case.js';
import { RemoverOnibusUseCase } from './use-cases/remover-onibus.use-case.js';
import { OnibusRepository } from './domain/onibus.repository.js';
import { OnibusController } from './infrastructure/http/onibus.controller.js';
import { OnibusOrmEntity } from './infrastructure/persistence/onibus.orm-entity.js';
import { TypeOrmOnibusRepository } from './infrastructure/persistence/typeorm-onibus.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([OnibusOrmEntity])],
  controllers: [OnibusController],
  providers: [
    CriarOnibusUseCase,
    ListarOnibusUseCase,
    BuscarOnibusUseCase,
    AtualizarOnibusUseCase,
    RemoverOnibusUseCase,
    { provide: OnibusRepository, useClass: TypeOrmOnibusRepository },
  ],
  exports: [OnibusRepository],
})
export class OnibusModule {}
