import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import { PessoaRepository } from '../../pessoas/domain/pessoa.repository.js';
import { HashService } from '../domain/hash.service.js';
import { Usuario } from '../domain/usuario.js';
import { UsuarioRepository } from '../domain/usuario.repository.js';

@Injectable()
export class CriarUsuarioUseCase {
    constructor(
        private readonly pessoaRepository: PessoaRepository,
        private readonly usuarioRepository: UsuarioRepository,
        private readonly hashService: HashService,
    ) {}

    async executar(dados: { pessoaId: number; usuario: string; senha: string }): Promise<Usuario> {
        const pessoa = await this.pessoaRepository.buscarPorId(dados.pessoaId);
        if(!pessoa) throw new NotFoundError('Pessoa não encontrada');

        if(await this.usuarioRepository.buscarPorPessoaId(dados.pessoaId)) {
            throw new ConflictError('Usuário já cadastrado para esta pessoa');
        }

        const login = Usuario.normalizarLogin(dados.usuario);
        if (await this.usuarioRepository.buscarPorLogin(login)) {
            throw new ConflictError('Usuário já cadastrado');
        }

        Usuario.validarSenha(dados.senha);

        const usuario = Usuario.criar({
            pessoaId: dados.pessoaId,
            usuario: login,
            senhaHash: await this.hashService.gerar(dados.senha),
            perfil: pessoa.tipo,
        });

        return this.usuarioRepository.salvar(usuario);
    }
}