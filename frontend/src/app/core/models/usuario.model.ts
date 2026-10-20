import type { TipoPessoa } from './pessoa.model';

/** O perfil do usuário é copiado do tipo da pessoa vinculada. */
export type Perfil = TipoPessoa;

export interface Usuario {
  id: number;
  pessoaId: number;
  usuario: string;
  perfil: Perfil;
  ativo: boolean;
}

/** Payload do token devolvido por `GET /auth/me`. */
export interface UsuarioLogado {
  sub: number;
  usuario: string;
  perfil: Perfil;
}
