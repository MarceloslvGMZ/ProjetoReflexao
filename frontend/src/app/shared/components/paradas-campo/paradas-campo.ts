import { Component, computed, effect, ElementRef, inject, input, OnDestroy, signal, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from '../../../core/api/api.service';
import { paraErroApi } from '../../../core/api/erro-api';
import type { ParadaRota } from '../../../core/models';
import { CLASSE_BTN_PRIMARIO, CLASSE_BTN_SECUNDARIO, CLASSE_CAMPO } from '../../ui';
import { COR_IDA, COR_VOLTA, DESLOCAMENTO_VOLTA_M, deslocarPontos, type PontoNoMapa } from '../../trajeto-visual';

const LIMITE = 20;
type Sentido = 'IDA' | 'VOLTA';

interface LinhaApi {
  linha: PontoNoMapa[];
}

@Component({
  selector: 'app-paradas-campo',
  templateUrl: './paradas-campo.html',
  host: { class: 'block space-y-3' },
})
export class ParadasCampo implements OnDestroy {
  private readonly api = inject(ApiService);
  readonly controle = input.required<FormControl<unknown>>();
  readonly idCampo = input.required<string>();

  protected readonly campo = CLASSE_CAMPO;
  protected readonly botao = `${CLASSE_BTN_SECUNDARIO} h-11 shrink-0 px-3`;
  protected readonly botaoPrimario = CLASSE_BTN_PRIMARIO;
  protected readonly botaoSecundario = CLASSE_BTN_SECUNDARIO;
  protected readonly corIda = COR_IDA;
  protected readonly corVolta = COR_VOLTA;
  protected readonly paradas = signal<ParadaRota[]>([]);
  protected readonly sentido = signal<Sentido>('IDA');
  protected readonly expandido = signal(false);
  protected readonly menuAberto = signal(true);
  protected readonly consulta = signal('');
  protected readonly sugestoes = signal<ParadaRota[]>([]);
  protected readonly buscando = signal(false);
  protected readonly marcando = signal(false);
  protected readonly calculando = signal(false);
  protected readonly aviso = signal<string | null>(null);

  protected readonly ida = computed(() => this.paradas().filter((parada) => sentidoDe(parada) === 'IDA'));
  protected readonly volta = computed(() => this.paradas().filter((parada) => sentidoDe(parada) === 'VOLTA'));
  protected readonly resumo = computed(() => {
    const ida = this.ida().length;
    const volta = this.volta().length;
    const textoIda = ida === 0 ? 'Nenhuma via na ida' : `${ida} via(s) na ida`;
    const textoVolta = volta === 0 ? 'volta espelhada' : `${volta} via(s) na volta`;
    return `${textoIda} · ${textoVolta}`;
  });

  private readonly linhaIda = signal<PontoNoMapa[]>([]);
  private readonly linhaVolta = signal<PontoNoMapa[]>([]);
  private geracao = 0;
  private espera: ReturnType<typeof setTimeout> | null = null;

  private readonly superficie = viewChild<ElementRef<HTMLElement>>('superficie');
  private mapa: L.Map | null = null;
  private readonly camada = L.layerGroup();
  private observador: ResizeObserver | null = null;

  constructor() {
    effect((onCleanup) => {
      const controle = this.controle();
      this.paradas.set(lerParadas(controle.value));
      const inscricao = controle.valueChanges.subscribe((valor) => this.paradas.set(lerParadas(valor)));
      onCleanup(() => inscricao.unsubscribe());
    });

    effect(() => {
      const ida = this.ida();
      const volta = this.volta();
      this.linhaIda.set(ida);
      this.linhaVolta.set(volta.length >= 2 ? volta : [...ida].reverse());
      if (!this.expandido()) return;
      if (this.espera) clearTimeout(this.espera);
      this.espera = setTimeout(() => void this.buscarVias(ida, volta), 400);
    });

    effect(() => {
      this.paradas();
      this.linhaIda();
      this.linhaVolta();
      if (this.expandido()) this.redesenhar();
    });

    effect(() => {
      if (!this.expandido()) {
        this.destruirMapa();
        return;
      }
      queueMicrotask(() => this.garantirMapa());
    });
  }

  ngOnDestroy(): void {
    if (this.espera) clearTimeout(this.espera);
    this.geracao += 1;
    this.destruirMapa();
  }

  protected abrirMapa(): void {
    if (this.controle().disabled) return;
    this.aviso.set(null);
    this.menuAberto.set(true);
    this.expandido.set(true);
  }

  protected fecharMapa(): void {
    this.expandido.set(false);
    this.sugestoes.set([]);
    this.consulta.set('');
  }

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
    queueMicrotask(() => this.mapa?.invalidateSize());
  }

  protected escolherSentido(sentido: Sentido): void {
    this.sentido.set(sentido);
  }

  protected async localizar(): Promise<void> {
    const texto = this.consulta().trim();
    if (!texto || this.controle().disabled) return;
    this.buscando.set(true);
    this.aviso.set(null);
    try {
      const lista = await this.api.get<ParadaRota[]>('/rotas/lugares', { q: texto });
      this.sugestoes.set(lista);
      const primeiro = lista[0];
      if (primeiro) this.mapa?.setView([primeiro.latitude, primeiro.longitude], 15);
      if (lista.length === 0) this.aviso.set('Nenhum local encontrado. Tente um nome mais específico.');
    } catch (falha) {
      this.aviso.set(paraErroApi(falha).mensagens.join(' '));
    } finally {
      this.buscando.set(false);
    }
  }

  protected adicionar(ponto: ParadaRota, enquadrar = true): void {
    if (this.controle().disabled) return;
    const sentido = this.sentido();
    const doSentido = this.paradas().filter((parada) => sentidoDe(parada) === sentido);
    if (doSentido.length >= LIMITE) {
      this.aviso.set(`O limite é ${LIMITE} vias na ${sentido === 'IDA' ? 'ida' : 'volta'}.`);
      return;
    }
    const lista = [
      ...this.paradas(),
      {
        nome: encurtar(ponto.nome),
        latitude: ponto.latitude,
        longitude: ponto.longitude,
        sentido,
        tipo: 'PASSAGEM' as const,
      },
    ];
    this.definir(lista);
    if (enquadrar && this.mapa) {
      this.mapa.fitBounds(
        L.latLngBounds(lista.map((parada) => [parada.latitude, parada.longitude])),
        { padding: [24, 24], maxZoom: 15 },
      );
    }
    this.sugestoes.set([]);
    this.consulta.set('');
    this.aviso.set(null);
  }

  protected renomear(sentido: Sentido, indice: number, evento: Event): void {
    const nome = (evento.target as HTMLInputElement).value.trim();
    if (!nome) return;
    let visto = -1;
    this.definir(
      this.paradas().map((parada) => {
        if (sentidoDe(parada) !== sentido) return parada;
        visto += 1;
        return visto === indice ? { ...parada, nome } : parada;
      }),
    );
  }

  protected mover(sentido: Sentido, indice: number, deslocamento: number): void {
    const doSentido = this.paradas().filter((parada) => sentidoDe(parada) === sentido);
    const destino = indice + deslocamento;
    if (destino < 0 || destino >= doSentido.length) return;
    const reordenadas = [...doSentido];
    const [item] = reordenadas.splice(indice, 1);
    reordenadas.splice(destino, 0, item);
    let cursor = 0;
    this.definir(
      this.paradas().map((parada) => {
        if (sentidoDe(parada) !== sentido) return parada;
        return reordenadas[cursor++];
      }),
    );
  }

  protected remover(sentido: Sentido, indice: number): void {
    let visto = -1;
    this.definir(
      this.paradas().filter((parada) => {
        if (sentidoDe(parada) !== sentido) return true;
        visto += 1;
        return visto !== indice;
      }),
    );
  }

  private definir(lista: ParadaRota[]): void {
    this.controle().setValue(lista);
    this.controle().markAsDirty();
    this.paradas.set(lista);
  }

  private async buscarVias(ida: ParadaRota[], volta: ParadaRota[]): Promise<void> {
    const geracao = ++this.geracao;
    const precisaIda = ida.length >= 2;
    const precisaVolta = volta.length >= 2;
    this.calculando.set(precisaIda || precisaVolta);
    const [linhaIda, linhaVolta] = await Promise.all([
      precisaIda ? this.linha(ida) : Promise.resolve(null),
      precisaVolta ? this.linha(volta) : Promise.resolve(null),
    ]);
    if (geracao !== this.geracao) return;
    this.calculando.set(false);
    if (linhaIda && linhaIda.length >= 2) this.linhaIda.set(linhaIda);
    if (precisaVolta && linhaVolta && linhaVolta.length >= 2) this.linhaVolta.set(linhaVolta);
    else if (linhaIda && linhaIda.length >= 2) this.linhaVolta.set([...linhaIda].reverse());
  }

  private async linha(pontos: ParadaRota[]): Promise<PontoNoMapa[] | null> {
    try {
      const trajeto = await this.api.get<LinhaApi>('/rotas/trajeto', {
        pontos: JSON.stringify(
          pontos.map((ponto) => ({ nome: ponto.nome, latitude: ponto.latitude, longitude: ponto.longitude })),
        ),
      });
      return trajeto.linha ?? null;
    } catch {
      return null;
    }
  }

  private garantirMapa(): void {
    if (this.mapa) {
      this.mapa.invalidateSize();
      this.redesenhar(true);
      return;
    }
    const elemento = this.superficie()?.nativeElement;
    if (!elemento) {
      requestAnimationFrame(() => this.garantirMapa());
      return;
    }
    const mapa = L.map(elemento, { minZoom: 3 }).setView([-16.328, -48.953], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapa);
    this.camada.addTo(mapa);
    mapa.on('click', (evento) => void this.marcar(evento.latlng.lat, evento.latlng.lng));
    this.observador = new ResizeObserver(() => mapa.invalidateSize());
    this.observador.observe(elemento);
    this.mapa = mapa;
    this.redesenhar(true);
    requestAnimationFrame(() => mapa.invalidateSize());
  }

  private destruirMapa(): void {
    this.observador?.disconnect();
    this.observador = null;
    this.mapa?.remove();
    this.mapa = null;
  }

  private async marcar(latitude: number, longitude: number): Promise<void> {
    if (this.controle().disabled || this.marcando()) return;
    this.marcando.set(true);
    this.aviso.set(null);
    try {
      const ponto = await this.api.get<ParadaRota>('/rotas/lugares/reverso', { latitude, longitude });
      this.adicionar({ ...ponto, latitude, longitude }, false);
    } catch (falha) {
      const doSentido = this.sentido() === 'IDA' ? this.ida().length : this.volta().length;
      this.adicionar({ nome: `Via ${doSentido + 1}`, latitude, longitude }, false);
      this.aviso.set(paraErroApi(falha).mensagens.join(' '));
    } finally {
      this.marcando.set(false);
    }
  }

  private redesenhar(enquadrar = false): void {
    const mapa = this.mapa;
    if (!mapa) return;
    this.camada.clearLayers();
    const ida = this.ida();
    const volta = this.volta();
    desenharLinha(this.camada, this.linhaIda(), COR_IDA, 0);
    desenharLinha(this.camada, this.linhaVolta(), COR_VOLTA, DESLOCAMENTO_VOLTA_M);
    desenharMarcadores(this.camada, ida, COR_IDA, 'Ida');
    if (volta.length > 0) desenharMarcadores(this.camada, volta, COR_VOLTA, 'Volta');
    const todos = [...ida, ...volta];
    if (enquadrar && todos.length > 0) {
      mapa.fitBounds(L.latLngBounds(todos.map((parada) => [parada.latitude, parada.longitude])), {
        padding: [48, 48],
        maxZoom: 15,
      });
    }
  }
}

function desenharLinha(
  camada: L.LayerGroup,
  pontos: readonly PontoNoMapa[],
  cor: string,
  metros: number,
): void {
  if (pontos.length < 2) return;
  const linha = deslocarPontos(pontos, metros).map(
    (ponto) => [ponto.latitude, ponto.longitude] as L.LatLngExpression,
  );
  L.polyline(linha, { color: cor, weight: 5, opacity: 0.85 }).addTo(camada);
}

function desenharMarcadores(
  camada: L.LayerGroup,
  pontos: readonly ParadaRota[],
  cor: string,
  rotulo: string,
): void {
  pontos.forEach((parada, indice) => {
    const marcador = L.marker([parada.latitude, parada.longitude], {
      icon: L.divIcon({
        className: '',
        html: `<span style="display:flex;width:16px;height:16px;align-items:center;justify-content:center;border-radius:9999px;background:white;color:${cor};border:2px solid ${cor};font-size:9px;font-weight:700">${indice + 1}</span>`,
        iconSize: [16, 16],
        iconAnchor: rotulo === 'Volta' ? [8, 0] : [8, 16],
      }),
    });
    marcador.on('click', (evento: L.LeafletMouseEvent) => L.DomEvent.stopPropagation(evento.originalEvent));
    marcador.bindTooltip(`${rotulo} · ${indice + 1}. ${parada.nome}`, { direction: 'top' });
    marcador.addTo(camada);
  });
}

function sentidoDe(parada: ParadaRota): Sentido {
  return parada.sentido === 'VOLTA' ? 'VOLTA' : 'IDA';
}

function lerParadas(valor: unknown): ParadaRota[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const registro = item as ParadaRota;
    const latitude = Number(registro.latitude);
    const longitude = Number(registro.longitude);
    if (!registro.nome || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [
      {
        nome: registro.nome,
        latitude,
        longitude,
        sentido: registro.sentido === 'VOLTA' ? 'VOLTA' : 'IDA',
        tipo: registro.tipo === 'PARADA' ? 'PARADA' : 'PASSAGEM',
      },
    ];
  });
}

function encurtar(nome: string): string {
  const curto = nome.split(',').slice(0, 2).join(',').trim();
  return curto.length > 80 ? `${curto.slice(0, 77)}…` : curto;
}
