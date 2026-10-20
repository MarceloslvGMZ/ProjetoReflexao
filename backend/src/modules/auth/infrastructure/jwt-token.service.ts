import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import { PayloadToken, TokenService } from '../domain/token.service.js';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  gerar(payload: PayloadToken): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async verificar(token: string): Promise<PayloadToken> {
    try {
      return await this.jwtService.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedError('Token inválido ou expirado');
    }
  }
}
