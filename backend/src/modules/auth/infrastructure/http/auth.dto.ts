import { Campo } from '../../../../shared/infrastructure/http/formulario/campo.decorator.js';

export class LoginDto {
  @Campo({ rotulo: 'Usuário' })
  usuario: string;

  @Campo({ rotulo: 'Senha', tipo: 'senha' })
  senha: string;
}

export class AlterarSenhaDto {
  @Campo({ rotulo: 'Senha atual', tipo: 'senha' })
  senhaAtual: string;

  @Campo({ rotulo: 'Nova senha', tipo: 'senha', ajuda: 'Mínimo de 8 caracteres, com letras e números' })
  novaSenha: string;
}
