import { Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import { HashService } from '../../usuarios/domain/hash.service.js';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository.js';
import { TokenService } from '../domain/token.service.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
  ) {}

  async executar(dados: { usuario: string; senha: string }): Promise<{ accessToken: string }> {
    const usuario = await this.usuarioRepository.buscarPorLogin(dados.usuario.trim().toLowerCase());
    const senhaConfere = usuario
      ? await this.hashService.comparar(dados.senha, usuario.senhaHash)
      : false;

    // Mesma mensagem para todos os casos, para não revelar quais logins existem.
    if (!usuario || !senhaConfere || !usuario.ativo) {
      throw new UnauthorizedError('Usuário ou senha inválidos');
    }

    const accessToken = await this.tokenService.gerar({
      sub: usuario.id!,
      usuario: usuario.usuario,
      perfil: usuario.perfil,
    });
    return { accessToken };
  }
}
