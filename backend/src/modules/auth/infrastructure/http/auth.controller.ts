import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import type { PayloadToken } from '../../domain/token.service.js';
import { AlterarSenhaUseCase } from '../../use-cases/alterar-senha.use-case.js';
import { LoginUseCase } from '../../use-cases/login.use-case.js';
import { AlterarSenhaDto, LoginDto } from './auth.dto.js';
import { Publico, UsuarioLogado } from './decorators.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly alterarSenha: AlterarSenhaUseCase,
  ) {}

  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  entrar(@Body() dto: LoginDto) {
    return this.login.executar(dto);
  }

  @Get('me')
  eu(@UsuarioLogado() usuario: PayloadToken) {
    return usuario;
  }

  @Patch('senha')
  @HttpCode(HttpStatus.NO_CONTENT)
  trocarSenha(@UsuarioLogado() usuario: PayloadToken, @Body() dto: AlterarSenhaDto) {
    return this.alterarSenha.executar(usuario.sub, dto);
  }
}
