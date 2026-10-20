import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { Perfil } from '../../../usuarios/domain/usuario.js';
import { PayloadToken, TokenService } from '../../domain/token.service.js';
import { PERFIS, ROTA_PUBLICA } from './decorators.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const alvos = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, alvos)) return true;

    const request = context.switchToHttp().getRequest<Request & { usuario?: PayloadToken }>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedError('Token não informado');

    const payload = await this.tokenService.verificar(token);
    request.usuario = payload;

    const perfisPermitidos = this.reflector.getAllAndOverride<Perfil[]>(PERFIS, alvos);
    if (perfisPermitidos && !perfisPermitidos.includes(payload.perfil)) {
      throw new ForbiddenError('Você não tem permissão para acessar este recurso');
    }
    return true;
  }
}
