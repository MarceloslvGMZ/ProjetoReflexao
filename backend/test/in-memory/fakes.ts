import { PayloadToken, TokenService } from '../../src/modules/auth/domain/token.service.js';
import { HashService } from '../../src/modules/usuarios/domain/hash.service.js';

// O bcrypt é lento de propósito; nos testes unitários um hash previsível basta.
export class FakeHashService implements HashService {
  async gerar(texto: string) {
    return `hash:${texto}`;
  }

  async comparar(texto: string, hash: string) {
    return hash === `hash:${texto}`;
  }
}

export class FakeTokenService implements TokenService {
  async gerar(payload: PayloadToken) {
    return `token-do-usuario-${payload.sub}`;
  }

  async verificar(): Promise<PayloadToken> {
    throw new Error('Não usado nos testes unitários');
  }
}
