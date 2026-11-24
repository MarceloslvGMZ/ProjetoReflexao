import { Component, computed, DestroyRef, inject, resource, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { filter, interval } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { paraErroApi } from '../../core/api/erro-api';
import { RecursoService } from '../../core/api/recurso.service';
import { AuthService } from '../../core/auth/auth.service';
import type { Ocorrencia, Onibus, Pessoa, Rota } from '../../core/models';
import { AvisosOperacao } from '../../core/layout/avisos-operacao';
import { PosicoesRealtimeService } from '../../core/realtime/posicoes-realtime.service';
import { formatarDataExtenso } from '../../shared/formatacao';
import { montarPainel, textoRestante, type Saida } from '../../shared/operacao';
import { CLASSE_BTN_PRIMARIO, CLASSE_BTN_SECUNDARIO, CLASSE_CARD } from '../../shared/ui';
import { FormularioDinamico } from '../../shared/components/formulario-dinamico/formulario-dinamico';
import { Modal } from '../../shared/components/modal/modal';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MapaOperacional } from './mapa-operacional';
import { paraVeiculos, type PosicaoFrota, type VeiculoMapa } from './posicao-frota';

const INTERVALO_FALLBACK_MS = 5000;

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    StatCard,
    StatusBadge,
    Modal,
    FormularioDinamico,
    MapaOperacional,
    LucidePlus,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly recursos = inject(RecursoService);
  private readonly api = inject(ApiService);
  private readonly tempoReal = inject(PosicoesRealtimeService);
  private readonly destruir = inject(DestroyRef);
  private readonly avisos = inject(AvisosOperacao);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly dataHoje = formatarDataExtenso(new Date());
  protected readonly textoRestante = textoRestante;
  protected readonly novaOcorrencia = signal(false);
  protected readonly btnPrimario = CLASSE_BTN_PRIMARIO;
  protected readonly btnSecundario = CLASSE_BTN_SECUNDARIO;
  protected readonly card = CLASSE_CARD;
  private readonly posicoes = signal<readonly PosicaoFrota[]>([]);
  protected readonly veiculos = computed(() => paraVeiculos(this.posicoes()));
  protected readonly erroPosicoes = signal<string | null>(null);
  protected readonly posicoesConsultadas = signal(false);

  constructor() {
    void this.atualizarPosicoes();
    this.ligarTempoReal();
    interval(INTERVALO_FALLBACK_MS)
      .pipe(
        filter(() => !this.tempoReal.conectado()),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.atualizarPosicoes());
  }

  private ligarTempoReal(): void {
    this.tempoReal.conectar();
    const limparSnapshot = this.tempoReal.aoSnapshot((lista) => this.aplicarPosicoes(lista));
    const limparAtualizacao = this.tempoReal.aoAtualizar((posicao) => {
      this.aplicarPosicoes([
        ...this.posicoes().filter((item) => item.onibusId !== posicao.onibusId),
        posicao,
      ]);
    });
    const limparRemocao = this.tempoReal.aoRemover((onibusId) => {
      this.aplicarPosicoes(this.posicoes().filter((item) => item.onibusId !== onibusId));
    });
    this.destruir.onDestroy(() => {
      limparSnapshot();
      limparAtualizacao();
      limparRemocao();
    });
  }

  private aplicarPosicoes(lista: readonly PosicaoFrota[]): void {
    this.posicoes.set(lista);
    this.erroPosicoes.set(null);
    this.posicoesConsultadas.set(true);
  }

  private async atualizarPosicoes(): Promise<void> {
    try {
      const lista = await this.api.get<PosicaoFrota[]>('/posicoes');
      this.aplicarPosicoes(lista);
    } catch (erro) {
      this.erroPosicoes.set(paraErroApi(erro).mensagens.join(' '));
      this.posicoesConsultadas.set(true);
    }
  }

  protected readonly dados = resource({
    params: () => this.avisos.versao(),
    loader: async () => {
      const [onibus, rotas, ocorrencias, pessoas] = await Promise.all([
        this.recursos.listar<Onibus>('onibus'),
        this.recursos.listar<Rota>('rotas'),
        this.recursos.listar<Ocorrencia>('ocorrencias'),
        this.recursos.listar<Pessoa>('pessoas'),
      ]);
      return { onibus, rotas, ocorrencias, pessoas };
    },
  });

  protected readonly painel = computed(() =>
    this.dados.hasValue() ? montarPainel(this.dados.value()) : null,
  );

  protected readonly erro = computed(() => {
    const falha = this.dados.error();
    return falha ? paraErroApi(falha.cause ?? falha).mensagens.join(' ') : null;
  });

  protected tomDaSaida(saida: Saida): 'alerta' | 'info' | 'neutro' {
    if (saida.status === 'Em breve') return 'alerta';
    if (saida.status === 'Aguardando') return 'info';
    return 'neutro';
  }

  protected ocorrenciaSalva(): void {
    this.novaOcorrencia.set(false);
    this.toast.sucesso('Ocorrência registrada.');
    this.avisos.atualizar();
    this.dados.reload();
  }
}
