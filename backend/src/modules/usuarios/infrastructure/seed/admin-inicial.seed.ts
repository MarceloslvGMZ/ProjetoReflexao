import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pessoa } from '../../../pessoas/domain/pessoa.js';
import { PessoaRepository } from '../../../pessoas/domain/pessoa.repository.js';
import { UsuarioRepository } from '../../domain/usuario.repository.js';
import { CriarUsuarioUseCase } from '../../use-cases/criar-usuario.use-case.js';

// Sem nenhum usuário, ninguém conseguiria fazer login para cadastrar o primeiro administrador.
@Injectable()
export class AdminInicialSeed implements OnApplicationBootstrap {
  constructor(
    private readonly config: ConfigService,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly pessoaRepository: PessoaRepository,
    private readonly criarUsuario: CriarUsuarioUseCase,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.usuarioRepository.listar()).length > 0) return;

    const cpf = this.config.getOrThrow<string>('ADMIN_CPF');
    const pessoa =
      (await this.pessoaRepository.buscarPorCpf(cpf)) ??
      (await this.pessoaRepository.salvar(
        Pessoa.criar({ nome: 'Administrador', cpf, tipo: 'ADMINISTRADOR' }),
      ));

    await this.criarUsuario.executar({
      pessoaId: pessoa.id!,
      usuario: this.config.getOrThrow<string>('ADMIN_USUARIO'),
      senha: this.config.getOrThrow<string>('ADMIN_SENHA'),
    });
  }
}
