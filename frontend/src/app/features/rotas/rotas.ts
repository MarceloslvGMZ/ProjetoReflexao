import { Component } from '@angular/core';
import { TURNOS } from '../../core/models';
import type { ConfigRecurso, Registro } from '../../core/state/config-recurso';
import { rotuloOpcao } from '../../core/formularios/rotulos';
import { formatarHora } from '../../shared/formatacao';
import { PaginaRecurso } from '../../shared/components/pagina-recurso/pagina-recurso';

@Component({
  selector: 'app-rotas',
  imports: [PaginaRecurso],
  template: `<app-pagina-recurso [config]="config" />`,
})
export class RotasPage {
  protected readonly config = configRotas();
}

function configRotas(): ConfigRecurso {
  return {
    recurso: 'rotas',
    titulo: 'Rotas e itinerários',
    descricao: 'Percursos, horários e o veículo de cada rota.',
    rotuloNovo: 'Criar rota',
    buscarEm: ['nome', 'origem', 'destino'],
    badge: (item) =>
      item['ativo'] ? { texto: 'Ativa', tom: 'sucesso' } : { texto: 'Inativa', tom: 'neutro' },
    filtros: [
      {
        id: 'turno',
        rotulo: 'Turno',
        opcoes: TURNOS.map((turno) => ({ valor: turno, rotulo: rotuloOpcao(turno) })),
      },
      {
        id: 'ativo',
        rotulo: 'Situação',
        opcoes: [
          { valor: 'true', rotulo: 'Ativas' },
          { valor: 'false', rotulo: 'Inativas' },
        ],
      },
    ],
    indicadores: ({ itens, carregadoEm }) => {
      const ativas = itens.filter((item) => item['ativo']).length;
      return [
        { rotulo: 'Total de rotas', valor: String(itens.length) },
        { rotulo: 'Rotas ativas', valor: String(ativas) },
        { rotulo: 'Manhã', valor: String(porTurno(itens, 'MANHA')) },
        {
          rotulo: 'Lista atualizada',
          valor: carregadoEm ? formatarHora(carregadoEm) : '—',
          detalhe: `${porTurno(itens, 'TARDE')} à tarde · ${porTurno(itens, 'NOITE')} à noite`,
        },
      ];
    },
  };
}

function porTurno(itens: readonly Registro[], turno: string): number {
  return itens.filter((item) => item['turno'] === turno).length;
}
