import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { paraErroApi } from '../../core/api/erro-api';
import type { Onibus, Rota } from '../../core/models';
import { SearchInput } from '../../shared/components/search-input/search-input';
import { CLASSE_BTN_SECUNDARIO } from '../../shared/ui';
import { MapaOperacional } from './mapa-operacional';
import { paraVeiculos, type PosicaoFrota, type VeiculoMapa } from './posicao-frota';
import {
  descreverEstimativa,
  filtrarFrota,
  juntarFrota,
  type OnibusNoMapa,
  type TrajetoRota,
} from './tracado-rota';

/** A tela cheia consulta com mais frequência do que o celular envia, para o ponto andar assim que a posição chega. */
const INTERVALO_CONSULTA_MS = 2000;

interface TrajetoApi {
  origem: TrajetoRota['origem'];
  destino: TrajetoRota['destino'];
  paradas?: TrajetoRota['paradas'];
  linha: TrajetoRota['linha'];
  distanciaMetros: number;
  duracaoSegundos: number;
  fonte: TrajetoRota['fonte'];
}

@Component({
  selector: 'app-mapa-tela',
  imports: [RouterLink, MapaOperacional, SearchInput],
  templateUrl: './mapa-tela.html',
})
export class MapaTela {
  private readonly api = inject(ApiService);
  protected readonly btnSecundario = CLASSE_BTN_SECUNDARIO;
  protected readonly descrever = descreverEstimativa;
  protected readonly veiculos = signal<readonly VeiculoMapa[]>([]);
  protected readonly erro = signal<string | null>(null);
  protected readonly consultado = signal(false);
  protected readonly termo = signal('');
  protected readonly escolhido = signal<number | null>(null);
  protected readonly trajetos = signal<readonly TrajetoRota[]>([]);
  protected readonly carregandoTrajeto = signal(false);
  protected readonly erroTrajeto = signal<string | null>(null);
  protected readonly menuAberto = signal(true);
  private readonly frota = signal<readonly OnibusNoMapa[]>([]);

  protected readonly filtrados = computed(() => filtrarFrota(this.frota(), this.termo()));

  constructor() {
    void this.carregarFrota();
    void this.atualizar();
    interval(INTERVALO_CONSULTA_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.atualizar());
  }

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected caminho(trajeto: TrajetoRota): string {
    return [trajeto.origem.nome, ...trajeto.paradas.map((parada) => parada.nome), trajeto.destino.nome].join(' → ');
  }

  protected nomesDasRotas(veiculo: OnibusNoMapa): string {
    return veiculo.rotas.map((rota) => rota.nome).join(', ');
  }

  protected escolher(id: number): void {
    if (this.escolhido() === id) {
      this.escolhido.set(null);
      this.trajetos.set([]);
      this.erroTrajeto.set(null);
      return;
    }
    this.escolhido.set(id);
    void this.carregarTrajeto(id);
  }

  private async carregarFrota(): Promise<void> {
    try {
      const [onibus, rotas] = await Promise.all([
        this.api.get<Onibus[]>('/onibus'),
        this.api.get<Rota[]>('/rotas'),
      ]);
      this.frota.set(juntarFrota(onibus, rotas));
    } catch (falha) {
      this.erro.set(paraErroApi(falha).mensagens.join(' '));
    }
  }

  private async carregarTrajeto(onibusId: number): Promise<void> {
    const rotas = this.frota().find((veiculo) => veiculo.id === onibusId)?.rotas ?? [];
    if (rotas.length === 0) {
      this.trajetos.set([]);
      this.erroTrajeto.set('Este ônibus não tem rota ativa para desenhar.');
      return;
    }
    this.carregandoTrajeto.set(true);
    this.erroTrajeto.set(null);
    try {
      const desenhos = await Promise.all(rotas.map((rota) => this.buscarTrajeto(rota)));
      if (this.escolhido() !== onibusId) return;
      this.trajetos.set(desenhos);
    } catch (falha) {
      if (this.escolhido() !== onibusId) return;
      this.trajetos.set([]);
      this.erroTrajeto.set(paraErroApi(falha).mensagens.join(' '));
    } finally {
      if (this.escolhido() === onibusId) this.carregandoTrajeto.set(false);
    }
  }

  private async buscarTrajeto(rota: Rota): Promise<TrajetoRota> {
    const trajeto = await this.api.get<TrajetoApi>('/rotas/trajeto', {
      origem: rota.origem,
      destino: rota.destino,
      paradas: JSON.stringify(rota.paradas ?? []),
    });
    return { ...trajeto, paradas: trajeto.paradas ?? [], rotaId: rota.id, nome: rota.nome };
  }

  private async atualizar(): Promise<void> {
    try {
      const lista = await this.api.get<PosicaoFrota[]>('/posicoes');
      this.veiculos.set(paraVeiculos(lista));
      this.erro.set(null);
    } catch (falha) {
      this.erro.set(paraErroApi(falha).mensagens.join(' '));
    } finally {
      this.consultado.set(true);
    }
  }
}
