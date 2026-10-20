import type { Perfil } from '../../usuarios/domain/usuario.js';

// O payload do JWT pode ser lido por qualquer um; nunca coloque dados sensíveis aqui.
export interface PayloadToken {
  sub: number;
  usuario: string;
  perfil: Perfil;
}

export abstract class TokenService {
  abstract gerar(payload: PayloadToken): Promise<string>;
  abstract verificar(token: string): Promise<PayloadToken>;
}
