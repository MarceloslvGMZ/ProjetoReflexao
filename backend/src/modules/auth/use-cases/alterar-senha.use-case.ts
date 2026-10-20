import { Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../../shared/domain/errors.js';
import { HashService } from '../../usuarios/domain/hash.service.js';
import { Usuario } from '../../usuarios/domain/usuario.js';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository.js';

@Injectable()
export class AlterarSenhaUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly hashService: HashService,
  ) {}

  async executar(usuarioId: number, dados: { senhaAtual: string; novaSenha: string }): Promise<void> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuário não encontrado');

    if (!(await this.hashService.comparar(dados.senhaAtual, usuario.senhaHash))) {
      throw new DomainError('Senha atual incorreta');
    }

    Usuario.validarSenha(dados.novaSenha);
    usuario.alterarSenha(await this.hashService.gerar(dados.novaSenha));

    await this.usuarioRepository.salvar(usuario);
  }
}
