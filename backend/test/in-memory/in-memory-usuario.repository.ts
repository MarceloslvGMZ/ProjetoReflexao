import { Usuario } from '../../src/modules/usuarios/domain/usuario.js';
import { UsuarioRepository } from '../../src/modules/usuarios/domain/usuario.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryUsuarioRepository extends InMemoryRepository<Usuario> implements UsuarioRepository {
  constructor() {
    super((id, usuario) => Usuario.restaurar(id, usuario));
  }

  async buscarPorLogin(login: string) {
    return this.buscarUm((usuario) => usuario.usuario === login);
  }

  async buscarPorPessoaId(pessoaId: number) {
    return this.buscarUm((usuario) => usuario.pessoaId === pessoaId);
  }
}
