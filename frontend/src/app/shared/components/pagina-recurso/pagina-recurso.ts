import { Component, OnInit, computed, inject, input, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { map } from 'rxjs';
import { RecursoService } from '../../../core/api/recurso.service';
import { paraErroApi } from '../../../core/api/erro-api';
import { AvisosOperacao } from '../../../core/layout/avisos-operacao';
import type { DescricaoCampo } from '../../../core/formularios/formulario.model';
import { FormulariosService } from '../../../core/formularios/formularios.service';
import { ReferenciasService } from '../../../core/formularios/referencias.service';
import { rotuloOpcao } from '../../../core/formularios/rotulos';
import type { ColunaLista, ConfigRecurso, FiltroLista, Registro } from '../../../core/state/config-recurso';
import { RecursoStore } from '../../../core/state/recurso.store';
import { formatarDataHora } from '../../formatacao';
import { CLASSE_BTN_PRIMARIO, CLASSE_CAMPO, CLASSE_CARD } from '../../ui';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { EmptyState } from '../empty-state/empty-state';
import { FormularioDinamico } from '../formulario-dinamico/formulario-dinamico';
import { Modal } from '../modal/modal';
import { PageHeader } from '../page-header/page-header';
import { SearchInput } from '../search-input/search-input';
import { StatCard } from '../stat-card/stat-card';
import { TabelaRecurso } from '../tabela-recurso/tabela-recurso';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-pagina-recurso',
  imports: [
    PageHeader,
    SearchInput,
    StatCard,
    TabelaRecurso,
    EmptyState,
    Modal,
    FormularioDinamico,
    ConfirmDialog,
    LucidePlus,
  ],
  templateUrl: './pagina-recurso.html',
})
export class PaginaRecurso implements OnInit {
  readonly config = input.required<ConfigRecurso>();

  private readonly formularios = inject(FormulariosService);
  private readonly referencias = inject(ReferenciasService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  /** Busca desta página. Não usa o texto da barra superior. */
  protected readonly termo = signal('');
  /** Id vindo da busca global (`?registro=`). Restringe a lista a esse registro. */
  protected readonly registroId = toSignal(
    this.rota.queryParamMap.pipe(
      map((params) => {
        const bruto = Number(params.get('registro'));
        return Number.isInteger(bruto) && bruto > 0 ? bruto : null;
      }),
    ),
    { initialValue: null },
  );
  protected readonly store: RecursoStore;
  protected readonly btnPrimario = CLASSE_BTN_PRIMARIO;
  protected readonly campo = CLASSE_CAMPO;
  protected readonly card = CLASSE_CARD;

  protected readonly permissoes = resource({
    params: () => this.config().recurso,
    loader: async ({ params: recurso }) => {
      const cfg = this.config();
      const [criar, atualizar] = await Promise.all([
        this.formularios.buscar(recurso, cfg.acaoCriar ?? 'criar'),
        this.formularios.buscar(recurso, cfg.acaoAtualizar ?? 'atualizar'),
      ]);
      return {
        criar: this.formularios.podeEnviar(criar),
        atualizar: this.formularios.podeEnviar(atualizar),
        excluir: this.formularios.podeEnviar(criar),
        campos: criar.campos,
      };
    },
  });

  protected readonly colunas = computed(() => {
    const definidas = this.config().colunas;
    if (definidas) return definidas;
    return this.permissoes.hasValue() ? colunasDosCampos(this.permissoes.value().campos) : [];
  });

  protected readonly mapas = resource({
    params: () =>
      this.colunas()
        .filter((coluna) => coluna.referencia)
        .map((coluna) => `${coluna.referencia?.recurso}:${coluna.referencia?.exibir}`)
        .join('|'),
    loader: ({ params }) => this.carregarMapas(params),
  });

  protected readonly opcoesFiltro = resource({
    params: () =>
      (this.config().filtros ?? [])
        .filter((filtro) => filtro.referencia)
        .map((filtro) => `${filtro.id}:${filtro.referencia?.recurso}:${filtro.referencia?.exibir}`)
        .join('|'),
    loader: ({ params }) => this.carregarOpcoes(params),
  });

  protected readonly indicadores = computed(() =>
    this.config().indicadores?.({
      itens: this.store.itens(),
      extras: this.store.extras(),
      carregadoEm: this.store.carregadoEm(),
    }) ?? [],
  );

  protected readonly mostrarAcoes = computed(() => {
    if (!this.permissoes.hasValue()) return false;
    const permissao = this.permissoes.value();
    return permissao.atualizar || permissao.excluir;
  });

  protected readonly erroPermissao = computed(() => {
    const erro = this.permissoes.error();
    return erro ? paraErroApi(erro.cause ?? erro).mensagens.join(' ') : null;
  });

  constructor() {
    this.store = new RecursoStore(
      inject(RecursoService),
      inject(ToastService),
      this.referencias,
      inject(AvisosOperacao),
      this.termo,
      this.registroId,
      () => this.config(),
    );
  }

  protected definirBusca(valor: string): void {
    this.termo.set(valor);
    if (valor.trim() && this.registroId() !== null) {
      void this.router.navigate([], { queryParams: { registro: null }, queryParamsHandling: 'merge' });
    }
  }

  protected limparRegistro(): void {
    void this.router.navigate([], { queryParams: { registro: null }, queryParamsHandling: 'merge' });
  }

  /** A configuração da página só existe depois do construtor. Carregar antes disso falha e a lista fica vazia. */
  ngOnInit(): void {
    void this.store.carregar();
  }

  protected texto = (coluna: ColunaLista, item: Registro): string => {
    const bruto = item[coluna.id];
    const formatado = this.config().formatar?.[coluna.id]?.(bruto, item);
    if (formatado !== undefined) return formatado;
    if (bruto === null || bruto === undefined || bruto === '') return '—';
    if (coluna.tipo === 'selecao') return rotuloOpcao(String(bruto));
    if (coluna.tipo === 'data-hora') return formatarDataHora(String(bruto));
    if (coluna.tipo === 'referencia') {
      const chave = `${coluna.referencia?.recurso}:${coluna.referencia?.exibir}`;
      return this.mapas.hasValue() ? this.mapas.value().get(chave)?.get(Number(bruto)) ?? `#${bruto}` : '…';
    }
    return String(bruto);
  };

  protected badgeDe = (item: Registro) => this.config().badge?.(item, this.store.extras()) ?? null;

  protected podeEditar = (item: Registro): boolean => {
    if (!this.permissoes.hasValue() || !this.permissoes.value().atualizar) return false;
    return this.config().podeAlterar?.(item) ?? true;
  };

  protected podeExcluir = (item: Registro): boolean => {
    if (!this.permissoes.hasValue() || !this.permissoes.value().excluir) return false;
    return this.config().podeAlterar?.(item) ?? true;
  };

  protected opcoesDe(filtro: FiltroLista): readonly { valor: string; rotulo: string }[] {
    if (filtro.opcoes) return filtro.opcoes;
    if (!filtro.referencia || !this.opcoesFiltro.hasValue()) return [];
    return this.opcoesFiltro.value()[filtro.id] ?? [];
  }

  protected aoFiltro(id: string, evento: Event): void {
    this.store.definirFiltro(id, (evento.target as HTMLSelectElement).value);
  }

  private async carregarMapas(chaves: string): Promise<Map<string, Map<number, string>>> {
    const mapas = new Map<string, Map<number, string>>();
    if (!chaves) return mapas;
    await Promise.all(
      chaves.split('|').map(async (chave) => {
        const [recurso, exibir] = chave.split(':');
        const opcoes = await this.referencias.opcoes({ recurso, exibir });
        mapas.set(chave, new Map(opcoes.map((opcao) => [opcao.valor, opcao.rotulo])));
      }),
    );
    return mapas;
  }

  private async carregarOpcoes(chaves: string): Promise<Record<string, { valor: string; rotulo: string }[]>> {
    const opcoes: Record<string, { valor: string; rotulo: string }[]> = {};
    if (!chaves) return opcoes;
    await Promise.all(
      chaves.split('|').map(async (chave) => {
        const [id, recurso, exibir] = chave.split(':');
        const lista = await this.referencias.opcoes({ recurso, exibir });
        opcoes[id] = lista.map((opcao) => ({ valor: String(opcao.valor), rotulo: opcao.rotulo }));
      }),
    );
    return opcoes;
  }
}

function colunasDosCampos(campos: readonly DescricaoCampo[]): ColunaLista[] {
  return campos
    .filter((campo) => campo.tipo !== 'senha')
    .map((campo) => ({
      id: campo.nome,
      rotulo: campo.rotulo,
      tipo: campo.tipo,
      referencia: campo.referencia,
    }));
}
