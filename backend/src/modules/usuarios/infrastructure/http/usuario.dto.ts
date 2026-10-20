import { Campo } from '../../../../shared/infrastructure/http/formulario/campo.decorator.js';

export class CriarUsuarioDto {
  @Campo({ rotulo: 'Pessoa', referencia: { recurso: 'pessoas', exibir: 'nome' } })
  pessoaId: number;

  @Campo({ rotulo: 'Usuário', ajuda: '3 a 30 caracteres: letras, números, ponto ou sublinhado' })
  usuario: string;

  @Campo({ rotulo: 'Senha', tipo: 'senha', ajuda: 'Mínimo de 8 caracteres, com letras e números' })
  senha: string;
}

export class AtualizarUsuarioDto {
  @Campo({ rotulo: 'Usuário' })
  usuario: string;

  @Campo({ rotulo: 'Ativo' })
  ativo: boolean;
}
