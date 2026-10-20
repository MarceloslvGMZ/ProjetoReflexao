import { Component, inject } from '@angular/core';
import { RecursoService } from '../../core/api/recurso.service';
import type { Onibus, Rota } from '../../core/models';
import type { ConfigRecurso } from '../../core/state/config-recurso';
import { formatarHora } from '../../shared/formatacao';
import { PaginaRecurso } from '../../shared/components/pagina-recurso/pagina-recurso';

@Component({
  selector: 'app-onibus',
  imports: [PaginaRecurso],
  template: `<app-pagina-recurso [config]="config" />`,
})
export class OnibusPage {
  protected readonly config = configOnibus();
}

function configOnibus(): ConfigRecurso {
  const recursos = inject(RecursoService);
  return {
    recurso: 'onibus',
    titulo: 'Gestão de ônibus',
    descricao: 'Cadastro da frota usada nas rotas do transporte.',
    rotuloNovo: 'Cadastrar ônibus',
    buscarEm: ['placa', 'modelo', 'ano'],
    extras: async () => ({ rotas: await recursos.listar<Rota>('rotas') }),
    badge: (item, extras) =>
      emRota(item['id'], extras)
        ? { texto: 'Em rota ativa', tom: 'sucesso' }
        : { texto: 'Disponível', tom: 'neutro' },
    filtros: [
      {
        id: 'situacao',
        rotulo: 'Situação',
        opcoes: [
          { valor: 'em-rota', rotulo: 'Em rota ativa' },
          { valor: 'livre', rotulo: 'Disponível' },
        ],
        corresponde: (item, valor, extras) => (valor === 'em-rota' ? emRota(item['id'], extras) : !emRota(item['id'], extras)),
      },
    ],
    indicadores: ({ itens, extras, carregadoEm }) => {
      const frota = itens as unknown as Onibus[];
      const operando = frota.filter((onibus) => emRota(onibus.id, extras)).length;
      return [
        { rotulo: 'Total de veículos', valor: String(frota.length) },
        { rotulo: 'Em rota ativa', valor: String(operando) },
        {
          rotulo: 'Capacidade total',
          valor: String(frota.reduce((total, onibus) => total + onibus.capacidade, 0)),
          detalhe: 'lugares somados',
        },
        { rotulo: 'Lista atualizada', valor: carregadoEm ? formatarHora(carregadoEm) : '—' },
      ];
    },
  };
}

function emRota(id: unknown, extras: unknown): boolean {
  const rotas = (extras as { rotas?: Rota[] } | undefined)?.rotas ?? [];
  return rotas.some((rota) => rota.ativo && rota.onibusId === id);
}
