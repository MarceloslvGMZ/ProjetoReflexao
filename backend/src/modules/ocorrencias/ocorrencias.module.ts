import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnibusModule } from '../onibus/onibus.module.js';
import { RotasModule } from '../rotas/rotas.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { OcorrenciaRepository } from './domain/ocorrencia.repository.js';
import { OcorrenciasController } from './infrastructure/http/ocorrencias.controller.js';
import { OcorrenciaOrmEntity } from './infrastructure/persistence/ocorrencia.orm-entity.js';
import { TypeOrmOcorrenciaRepository } from './infrastructure/persistence/typeorm-ocorrencia.repository.js';
import { AtualizarOcorrenciaUseCase } from './use-cases/atualizar-ocorrencia.use-case.js';
import { BuscarOcorrenciaUseCase } from './use-cases/buscar-ocorrencia.use-case.js';
import { CriarOcorrenciaUseCase } from './use-cases/criar-ocorrencia.use-case.js';
import { ListarOcorrenciasUseCase } from './use-cases/listar-ocorrencias.use-case.js';
import { RemoverOcorrenciaUseCase } from './use-cases/remover-ocorrencia.use-case.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcorrenciaOrmEntity]),
    OnibusModule,
    RotasModule,
    UsuariosModule,
  ],
  controllers: [OcorrenciasController],
  providers: [
    CriarOcorrenciaUseCase,
    ListarOcorrenciasUseCase,
    BuscarOcorrenciaUseCase,
    AtualizarOcorrenciaUseCase,
    RemoverOcorrenciaUseCase,
    { provide: OcorrenciaRepository, useClass: TypeOrmOcorrenciaRepository },
  ],
})
export class OcorrenciasModule {}
