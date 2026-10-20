import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import type { ConfigRecurso } from '../../core/state/config-recurso';
import { PaginaRecurso } from '../../shared/components/pagina-recurso/pagina-recurso';

@Component({
  selector: 'app-ocorrencias',
  imports: [PaginaRecurso],
  template: `<app-pagina-recurso [config]="config" />`,
})
export class OcorrenciasPage {
  protected readonly config = configOcorrencias();
}

function configOcorrencias(): ConfigRecurso {
  const auth = inject(AuthService);
  return {
    recurso: 'ocorrencias',
    titulo: 'Ocorrências',
    descricao: 'Registros da operação ligados a uma rota e a um ônibus.',
    rotuloNovo: 'Nova ocorrência',
    buscarEm: ['titulo', 'descricao'],
    podeAlterar: (item) => auth.ehAdministrador() || item['usuarioId'] === auth.usuario()?.sub,
    parametros: (filtros) => ({ rotaId: filtros['rotaId'], onibusId: filtros['onibusId'] }),
    filtros: [
      { id: 'rotaId', rotulo: 'Rota', referencia: { recurso: 'rotas', exibir: 'nome' }, recarrega: true },
      { id: 'onibusId', rotulo: 'Ônibus', referencia: { recurso: 'onibus', exibir: 'placa' }, recarrega: true },
      {
        id: 'periodo',
        rotulo: 'Período',
        opcoes: [
          { valor: '24h', rotulo: 'Últimas 24 horas' },
          { valor: '7d', rotulo: 'Últimos 7 dias' },
        ],
        corresponde: (item, valor) => {
          const instante = new Date(String(item['dataHora'])).getTime();
          const limite = valor === '24h' ? 86_400_000 : 7 * 86_400_000;
          return Date.now() - instante <= limite;
        },
      },
    ],
    indicadores: ({ itens }) => {
      const agora = Date.now();
      const recentes = (ms: number) =>
        itens.filter((item) => agora - new Date(String(item['dataHora'])).getTime() <= ms).length;
      const dia = recentes(86_400_000);
      return [
        { rotulo: 'Total', valor: String(itens.length) },
        { rotulo: 'Últimas 24 horas', valor: String(dia), tom: dia > 0 ? 'alerta' : 'neutro' },
        { rotulo: 'Últimos 7 dias', valor: String(recentes(7 * 86_400_000)) },
      ];
    },
  };
}
