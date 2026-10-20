import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { TokenService } from './domain/token.service.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { AuthGuard } from './infrastructure/http/auth.guard.js';
import { JwtTokenService } from './infrastructure/jwt-token.service.js';
import { AlterarSenhaUseCase } from './use-cases/alterar-senha.use-case.js';
import { LoginUseCase } from './use-cases/login.use-case.js';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: Number(config.get('JWT_EXPIRES_IN', 3600)) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    AlterarSenhaUseCase,
    { provide: TokenService, useClass: JwtTokenService },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
