import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import { UsuarioRepository } from '../domain/usuario.repository.js';
import { Usuario } from '../domain/usuario.js';

@Injectable()
export class AtualizarUsuarioUseCase {
    constructor(
        private readonly usuarioRepository: UsuarioRepository
    ) {}

    async executar(id: number, dados: { usuario: string; ativo: boolean }): Promise<Usuario> {
        const usuario = await this.usuarioRepository.buscarPorId(id);
        if (!usuario) throw new NotFoundError('Usuário não encontrado');

        usuario.atualizar(dados);

        const mesmoLogin = await this.usuarioRepository.buscarPorLogin(usuario.usuario);
        if (mesmoLogin && mesmoLogin.id !== id) {
            throw new ConflictError('Usuário com este login já existe');
        }
        
        return this.usuarioRepository.salvar(usuario);
    }
}