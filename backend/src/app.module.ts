import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OcorrenciasModule } from './modules/ocorrencias/ocorrencias.module.js';
import { PosicoesModule } from './modules/posicoes/posicoes.module.js';
import { OnibusModule } from './modules/onibus/onibus.module.js';
import { PessoasModule } from './modules/pessoas/pessoas.module.js';
import { RotasModule } from './modules/rotas/rotas.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { DomainErrorFilter } from './shared/infrastructure/http/domain-error.filter.js';
import { FormulariosModule } from './shared/infrastructure/http/formulario/formularios.module.js';
import { opcoesDoBanco } from './shared/infrastructure/persistence/opcoes-do-banco.js';

const pastaBackend = join(dirname(fileURLToPath(import.meta.url)), '..');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(pastaBackend, '.env'), join(pastaBackend, '..', '.env.local')],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => opcoesDoBanco(config),
    }),
    OnibusModule,
    PessoasModule,
    RotasModule,
    UsuariosModule,
    AuthModule,
    OcorrenciasModule,
    PosicoesModule,
    FormulariosModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    },
  ],
})
export class AppModule {}
