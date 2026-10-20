import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { paraErroApi } from '../../core/api/erro-api';
import { RecursoService } from '../../core/api/recurso.service';
import { AuthService } from '../../core/auth/auth.service';
import type { Ocorrencia, Onibus, Pessoa, Rota } from '../../core/models';
import { AvisosOperacao } from '../../core/layout/avisos-operacao';
import { formatarDataExtenso } from '../../shared/formatacao';
import { montarPainel, textoRestante, type Saida } from '../../shared/operacao';
import { CLASSE_BTN_PRIMARIO, CLASSE_BTN_SECUNDARIO, CLASSE_CARD } from '../../shared/ui';
import { FormularioDinamico } from '../../shared/components/formulario-dinamico/formulario-dinamico';
import { Modal } from '../../shared/components/modal/modal';
import { RecursoIndisponivel } from '../../shared/components/recurso-indisponivel/recurso-indisponivel';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MapaOperacional } from './mapa-operacional';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    StatCard,
    StatusBadge,
    Modal,
    FormularioDinamico,
    RecursoIndisponivel,
    MapaOperacional,
    LucidePlus,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly recursos = inject(RecursoService);
  private readonly avisos = inject(AvisosOperacao);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly dataHoje = formatarDataExtenso(new Date());
  protected readonly textoRestante = textoRestante;
  protected readonly novaOcorrencia = signal(false);
  protected readonly btnPrimario = CLASSE_BTN_PRIMARIO;
  protected readonly btnSecundario = CLASSE_BTN_SECUNDARIO;
  protected readonly card = CLASSE_CARD;

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
