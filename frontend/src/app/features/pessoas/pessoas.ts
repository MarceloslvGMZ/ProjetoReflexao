import { Component } from '@angular/core';
import { TIPOS_PESSOA } from '../../core/models';
import type { ConfigRecurso, Registro } from '../../core/state/config-recurso';
import { rotuloOpcao } from '../../core/formularios/rotulos';
import { formatarCpf } from '../../shared/formatacao';
import { PaginaRecurso } from '../../shared/components/pagina-recurso/pagina-recurso';

@Component({
  selector: 'app-pessoas',
  imports: [PaginaRecurso],
  template: `<app-pagina-recurso [config]="config" />`,
})
export class PessoasPage {
  protected readonly config = configPessoas();
}

function configPessoas(): ConfigRecurso {
  return {
    recurso: 'pessoas',
    titulo: 'Pessoas',
    descricao: 'Estudantes, motoristas e administradores do transporte.',
    rotuloNovo: 'Cadastrar pessoa',
    buscarEm: ['nome', 'cpf', 'matricula'],
    formatar: { cpf: (valor) => formatarCpf(String(valor ?? '')) },
    somenteLeituraNaEdicao: ['tipo'],
    filtros: [
      {
        id: 'tipo',
        rotulo: 'Tipo',
        opcoes: TIPOS_PESSOA.map((tipo) => ({ valor: tipo, rotulo: rotuloOpcao(tipo) })),
      },
    ],
    indicadores: ({ itens }) => [
      { rotulo: 'Total', valor: String(itens.length) },
      { rotulo: 'Motoristas', valor: String(contar(itens, 'MOTORISTA')) },
      { rotulo: 'Estudantes', valor: String(contar(itens, 'ESTUDANTE')) },
      { rotulo: 'Administradores', valor: String(contar(itens, 'ADMINISTRADOR')) },
    ],
  };
}

function contar(itens: readonly Registro[], tipo: string): number {
  return itens.filter((item) => item['tipo'] === tipo).length;
}
