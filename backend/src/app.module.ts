import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OcorrenciasModule } from './modules/ocorrencias/ocorrencias.module.js';
import { OnibusModule } from './modules/onibus/onibus.module.js';
import { PessoasModule } from './modules/pessoas/pessoas.module.js';
import { RotasModule } from './modules/rotas/rotas.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { DomainErrorFilter } from './shared/infrastructure/http/domain-error.filter.js';
import { FormulariosModule } from './shared/infrastructure/http/formulario/formularios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_STORAGE', './database.sqlite'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    OnibusModule,
    PessoasModule,
    RotasModule,
    UsuariosModule,
    AuthModule,
    OcorrenciasModule,
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
