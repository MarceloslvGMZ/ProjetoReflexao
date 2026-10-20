import { Usuario } from '../../domain/usuario.js';

// Define o que sai na resposta HTTP; o senhaHash nunca deve ser exposto.
export const UsuarioPresenter = {
  paraHttp(usuario: Usuario) {
    const { id, pessoaId, usuario: login, perfil, ativo } = usuario;
    return { id, pessoaId, usuario: login, perfil, ativo };
  },
};
