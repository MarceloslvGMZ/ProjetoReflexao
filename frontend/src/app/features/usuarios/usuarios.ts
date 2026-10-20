import { Component } from '@angular/core';
import { TIPOS_PESSOA } from '../../core/models';
import type { ConfigRecurso } from '../../core/state/config-recurso';
import { rotuloOpcao } from '../../core/formularios/rotulos';
import { PaginaRecurso } from '../../shared/components/pagina-recurso/pagina-recurso';

@Component({
  selector: 'app-usuarios',
  imports: [PaginaRecurso],
  template: `<app-pagina-recurso [config]="config" />`,
})
export class UsuariosPage {
  protected readonly config = configUsuarios();
}

function configUsuarios(): ConfigRecurso {
  return {
    recurso: 'usuarios',
    titulo: 'Usuários',
    descricao: 'Contas de acesso. O perfil é copiado do tipo da pessoa e não pode ser escolhido aqui.',
    rotuloNovo: 'Cadastrar usuário',
    buscarEm: ['usuario'],
    colunas: [
      { id: 'usuario', rotulo: 'Usuário', tipo: 'texto' },
      { id: 'pessoaId', rotulo: 'Pessoa', tipo: 'referencia', referencia: { recurso: 'pessoas', exibir: 'nome' } },
      { id: 'perfil', rotulo: 'Perfil', tipo: 'selecao' },
      { id: 'ativo', rotulo: 'Ativo', tipo: 'booleano' },
    ],
    filtros: [
      {
        id: 'perfil',
        rotulo: 'Perfil',
        opcoes: TIPOS_PESSOA.map((tipo) => ({ valor: tipo, rotulo: rotuloOpcao(tipo) })),
      },
      {
        id: 'ativo',
        rotulo: 'Situação',
        opcoes: [
          { valor: 'true', rotulo: 'Ativos' },
          { valor: 'false', rotulo: 'Inativos' },
        ],
      },
    ],
    indicadores: ({ itens }) => [
      { rotulo: 'Total', valor: String(itens.length) },
      { rotulo: 'Ativos', valor: String(itens.filter((item) => item['ativo']).length) },
      { rotulo: 'Administradores', valor: String(itens.filter((item) => item['perfil'] === 'ADMINISTRADOR').length) },
    ],
  };
}
