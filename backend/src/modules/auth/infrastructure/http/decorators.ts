import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Perfil } from '../../../usuarios/domain/usuario.js';
import type { PayloadToken } from '../../domain/token.service.js';

export const ROTA_PUBLICA = 'rotaPublica';
export const PERFIS = 'perfis';

/** Libera a rota sem token. */
export const Publico = () => SetMetadata(ROTA_PUBLICA, true);

/** Restringe a rota aos perfis informados. */
export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS, perfis);

/** Injeta no parâmetro os dados do usuário que fez a requisição. */
export const UsuarioLogado = createParamDecorator(
  (_dados: unknown, context: ExecutionContext): PayloadToken =>
    context.switchToHttp().getRequest<{ usuario: PayloadToken }>().usuario,
);
