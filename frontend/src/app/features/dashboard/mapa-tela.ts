import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { paraErroApi } from '../../core/api/erro-api';
import type { Onibus, ParadaRota, Rota } from '../../core/models';
import { SearchInput } from '../../shared/components/search-input/search-input';
import { CLASSE_BTN_PRIMARIO, CLASSE_BTN_SECUNDARIO } from '../../shared/ui';
import { MapaOperacional } from './mapa-operacional';
import { paraVeiculos, type PosicaoFrota, type VeiculoMapa } from './posicao-frota';
import {
  filtrarFrota,
  juntarFrota,
  type OnibusNoMapa,
  type PontoRota,
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
  protected readonly btnPrimario = CLASSE_BTN_PRIMARIO;
  protected readonly veiculos = signal<readonly VeiculoMapa[]>([]);
  protected readonly erro = signal<string | null>(null);
  protected readonly consultado = signal(false);
  protected readonly termo = signal('');
  protected readonly escolhido = signal<number | null>(null);
  protected readonly acompanhando = signal(false);
  protected readonly trajetos = signal<readonly TrajetoRota[]>([]);
  protected readonly carregandoTrajeto = signal(false);
  protected readonly erroTrajeto = signal<string | null>(null);
  protected readonly menuAberto = signal(true);
  private readonly frota = signal<readonly OnibusNoMapa[]>([]);

  protected readonly filtrados = computed(() => filtrarFrota(this.frota(), this.termo()));
  protected readonly podeAcompanhar = computed(() => {
    const id = this.escolhido();
    return id !== null && this.veiculos().some((veiculo) => veiculo.id === id);
  });
  protected readonly seguirId = computed(() => (this.acompanhando() ? this.escolhido() : null));

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

  protected nomesDasRotas(veiculo: OnibusNoMapa): string {
    return veiculo.rotas.map((rota) => rota.nome).join(', ');
  }

  protected escolher(id: number): void {
    if (this.escolhido() === id) {
      this.escolhido.set(null);
      this.acompanhando.set(false);
      this.trajetos.set([]);
      this.erroTrajeto.set(null);
      return;
    }
    this.escolhido.set(id);
    this.acompanhando.set(false);
    void this.carregarTrajeto(id);
  }

  protected alternarAcompanhar(): void {
    if (!this.podeAcompanhar()) {
      this.acompanhando.set(false);
      return;
    }
    this.acompanhando.update((ativo) => !ativo);
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
    const paradas = rota.paradas ?? [];
    const ida = paradas.filter((parada) => parada.sentido !== 'VOLTA');
    const volta = paradas.filter((parada) => parada.sentido === 'VOLTA');
    const marcadoresIda = ida.filter((parada) => parada.tipo !== 'PASSAGEM').map(paraPonto);
    const marcadoresVolta = volta.filter((parada) => parada.tipo !== 'PASSAGEM').map(paraPonto);
    const trajeto = await this.api.get<TrajetoApi>('/rotas/trajeto', {
      origem: rota.origem,
      destino: rota.destino,
      paradas: JSON.stringify(ida.map((ponto) => ({ ...paraPonto(ponto), sentido: 'IDA' }))),
    });
    if (volta.length === 0) {
      return {
        ...trajeto,
        paradas: marcadoresIda,
        linhaVolta: [...trajeto.linha].reverse(),
        volta: [...marcadoresIda].reverse(),
        voltaEspelhada: true,
        rotaId: rota.id,
        nome: rota.nome,
      };
    }
    const retorno = await this.api.get<TrajetoApi>('/rotas/trajeto', {
      origem: rota.destino,
      destino: rota.origem,
      paradas: JSON.stringify(volta.map((ponto) => ({ ...paraPonto(ponto), sentido: 'IDA' }))),
    });
    return {
      ...trajeto,
      paradas: marcadoresIda,
      linhaVolta: retorno.linha,
      volta: marcadoresVolta,
      voltaEspelhada: false,
      duracaoVoltaSegundos: retorno.duracaoSegundos,
      distanciaVoltaMetros: retorno.distanciaMetros,
      fonteVolta: retorno.fonte,
      rotaId: rota.id,
      nome: rota.nome,
    };
  }

  private async atualizar(): Promise<void> {
    try {
      const lista = await this.api.get<PosicaoFrota[]>('/posicoes');
      const veiculos = paraVeiculos(lista);
      this.veiculos.set(veiculos);
      const seguido = this.escolhido();
      if (this.acompanhando() && (seguido === null || !veiculos.some((veiculo) => veiculo.id === seguido))) {
        this.acompanhando.set(false);
      }
      this.erro.set(null);
    } catch (falha) {
      this.erro.set(paraErroApi(falha).mensagens.join(' '));
    } finally {
      this.consultado.set(true);
    }
  }
}

function paraPonto(parada: ParadaRota): PontoRota {
  return { nome: parada.nome, latitude: parada.latitude, longitude: parada.longitude };
}
