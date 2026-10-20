import { Usuario } from './usuario.js';

export abstract class UsuarioRepository {
    abstract salvar(usuario: Usuario): Promise<Usuario>;
    abstract buscarPorId(id: number): Promise<Usuario | null>;
    abstract buscarPorLogin(login: string): Promise<Usuario | null>;
    abstract buscarPorPessoaId(pessoaId: number): Promise<Usuario | null>;
    abstract listar(): Promise<Usuario[]>;
    abstract remover(id: number): Promise<void>;
}