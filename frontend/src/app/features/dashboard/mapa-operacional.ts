import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { COR_IDA, COR_VOLTA, DESLOCAMENTO_VOLTA_M, deslocarPontos } from '../../shared/trajeto-visual';
import { DURACAO_ANIMACAO_MS, interpolar } from './marcador-animacao';
import { gravarVistaMapa, lerVistaMapa } from './mapa-vista';
import { fichaDoVeiculo, type VeiculoMapa } from './posicao-frota';
import type { TrajetoRota } from './tracado-rota';

@Component({
  selector: 'app-mapa-operacional',
  templateUrl: './mapa-operacional.html',
  host: { class: 'relative z-0 block h-full w-full bg-slate-100' },
})
export class MapaOperacional implements OnDestroy {
  readonly veiculos = input<readonly VeiculoMapa[]>([]);
  readonly trajetos = input<readonly TrajetoRota[]>([]);
  /** Quando informado, a câmera acompanha esse ônibus a cada atualização. */
  readonly seguirId = input<number | null>(null);
  /** A tela cheia abre o mapa mesmo antes de chegar a primeira posição. */
  readonly iniciarVazio = input(false);
  /** No painel o mapa só mostra a frota. Arrastar e ampliar ficam na tela cheia. */
  readonly interativo = input(false);
  /** Usuário arrastou o mapa enquanto o acompanhamento estava ativo. */
  readonly seguirInterrompido = output<void>();

  private readonly zona = inject(NgZone);
  private readonly superficie = viewChild.required<ElementRef<HTMLElement>>('superficie');
  private readonly fichasAbertas = signal<ReadonlySet<number>>(new Set());
  private mapa: L.Map | null = null;
  private readonly camada = L.layerGroup();
  private readonly camadaRota = L.layerGroup();
  private readonly marcadores = new Map<number, L.Marker>();
  private readonly animacoes = new Map<number, number>();
  private observador: ResizeObserver | null = null;
  /** Já existe um enquadramento persistido; novas posições não movem a câmera. */
  private enquadrou = false;
  private assinaturaFichas = '';
  private assinaturaRota = '';
  private ultimoSeguirId: number | null = null;

  constructor() {
    afterNextRender(() => this.desenhar());

    effect(() => {
      this.veiculos();
      this.trajetos();
      this.seguirId();
      this.fichasAbertas();
      this.desenhar();
    });
  }

  ngOnDestroy(): void {
    for (const id of this.animacoes.keys()) this.cancelarAnimacao(id);
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  private desenhar(): void {
    const mapa = this.garantirMapa();
    if (!mapa) return;
    this.desenharVeiculos(mapa);
    this.desenharRotas(mapa);
  }

  private desenharVeiculos(mapa: L.Map): void {
    const veiculos = this.veiculos().filter((veiculo) => !veiculo.desatualizada);
    const abertas = this.fichasAbertas();
    const presentes = new Set(veiculos.map((veiculo) => veiculo.id));

    for (const [id, marcador] of this.marcadores) {
      if (presentes.has(id)) continue;
      this.cancelarAnimacao(id);
      marcador.remove();
      this.marcadores.delete(id);
    }

    for (const veiculo of veiculos) {
      const existente = this.marcadores.get(veiculo.id);
      if (!existente) {
        const marcador = L.marker([veiculo.latitude, veiculo.longitude], {
          interactive: this.interativo(),
          icon: L.divIcon({
            className: '',
            html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#14624c;border:2px solid white;box-shadow:0 0 0 1px #14624c"></span>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        });
        marcador.bindTooltip(fichaDoVeiculo(veiculo, abertas.has(veiculo.id)), {
          direction: 'top',
          permanent: true,
          opacity: 1,
          interactive: this.interativo(),
          className: 'ficha-balao',
        });
        marcador.addTo(this.camada);
        this.marcadores.set(veiculo.id, marcador);
        continue;
      }

      const atual = existente.getLatLng();
      const mudou =
        Math.abs(atual.lat - veiculo.latitude) > 1e-7 || Math.abs(atual.lng - veiculo.longitude) > 1e-7;
      if (mudou) {
        this.animarMarcador(existente, veiculo.id, {
          latitude: atual.lat,
          longitude: atual.lng,
        }, {
          latitude: veiculo.latitude,
          longitude: veiculo.longitude,
        });
      }
    }

    const assinaturaFichas = veiculos
      .map((veiculo) => `${veiculo.id}:${abertas.has(veiculo.id)}:${veiculo.rota}:${veiculo.motorista}`)
      .join('|');
    if (assinaturaFichas !== this.assinaturaFichas) {
      this.assinaturaFichas = assinaturaFichas;
      for (const veiculo of veiculos) {
        const marcador = this.marcadores.get(veiculo.id);
        marcador?.setTooltipContent(fichaDoVeiculo(veiculo, abertas.has(veiculo.id)));
      }
    }

    const seguir = this.seguirId();
    if (seguir !== null) {
      const alvo = veiculos.find((veiculo) => veiculo.id === seguir);
      if (alvo) {
        const acabouDeAtivar = this.ultimoSeguirId !== seguir;
        this.ultimoSeguirId = seguir;
        mapa.panTo([alvo.latitude, alvo.longitude], {
          animate: !acabouDeAtivar,
          duration: 0.6,
        });
        this.enquadrou = true;
        return;
      }
    } else {
      this.ultimoSeguirId = null;
    }

    if (this.trajetos().length > 0 || veiculos.length === 0 || this.enquadrou) return;
    mapa.fitBounds(L.latLngBounds(veiculos.map((veiculo) => [veiculo.latitude, veiculo.longitude])), {
      padding: [32, 32],
      maxZoom: 16,
    });
    this.enquadrou = true;
    this.lembrar(mapa);
  }

  private animarMarcador(
    marcador: L.Marker,
    id: number,
    de: { latitude: number; longitude: number },
    para: { latitude: number; longitude: number },
  ): void {
    this.cancelarAnimacao(id);
    const inicio = performance.now();
    const passo = (agora: number) => {
      const progresso = (agora - inicio) / DURACAO_ANIMACAO_MS;
      const ponto = interpolar(de, para, progresso);
      marcador.setLatLng([ponto.latitude, ponto.longitude]);
      if (progresso < 1) {
        this.animacoes.set(id, requestAnimationFrame(passo));
        return;
      }
      this.animacoes.delete(id);
      marcador.setLatLng([para.latitude, para.longitude]);
    };
    this.animacoes.set(id, requestAnimationFrame(passo));
  }

  private cancelarAnimacao(id: number): void {
    const quadro = this.animacoes.get(id);
    if (quadro === undefined) return;
    cancelAnimationFrame(quadro);
    this.animacoes.delete(id);
  }

  private desenharRotas(mapa: L.Map): void {
    const trajetos = this.trajetos();
    const assinatura = trajetos
      .map(
        (trajeto) =>
          `${trajeto.rotaId}:${trajeto.linha.length}:${trajeto.linhaVolta?.length ?? 0}:${trajeto.duracaoSegundos}`,
      )
      .join('|');
    if (assinatura === this.assinaturaRota) return;
    this.assinaturaRota = assinatura;

    this.camadaRota.clearLayers();
    const coordenadas: L.LatLngExpression[] = [];
    for (const trajeto of trajetos) {
      coordenadas.push(...tracado(this.camadaRota, trajeto.linha, COR_IDA, 0));
      coordenadas.push(...tracado(this.camadaRota, trajeto.linhaVolta ?? [], COR_VOLTA, DESLOCAMENTO_VOLTA_M));
    }
    if (coordenadas.length === 0) return;
    if (this.seguirId() !== null) return;
    mapa.fitBounds(L.latLngBounds(coordenadas), { padding: [48, 48], maxZoom: 15 });
    this.enquadrou = true;
  }

  /** Sem vista salva e sem veículos, o mapa ainda não é criado. */
  private garantirMapa(): L.Map | null {
    if (this.mapa) return this.mapa;
    const vista = lerVistaMapa();
    if (!vista && this.veiculos().length === 0 && this.trajetos().length === 0 && !this.iniciarVazio()) return null;

    const elemento = this.superficie().nativeElement;
    const interativo = this.interativo();
    const mapa = L.map(elemento, {
      minZoom: 3,
      maxBounds: L.latLngBounds([-85, -180], [85, 180]),
      maxBoundsViscosity: 1,
      dragging: interativo,
      touchZoom: interativo,
      scrollWheelZoom: interativo,
      doubleClickZoom: interativo,
      boxZoom: interativo,
      keyboard: interativo,
      zoomControl: interativo,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      minZoom: 3,
      maxZoom: 19,
      noWrap: true,
    }).addTo(mapa);
    this.camadaRota.addTo(mapa);
    this.camada.addTo(mapa);
    mapa.on('moveend', () => this.lembrar(mapa));
    if (interativo) {
      mapa.on('dragstart', () => {
        if (this.seguirId() === null) return;
        this.zona.run(() => this.seguirInterrompido.emit());
      });
      mapa.getContainer().addEventListener('click', (evento) => {
        const alvo = (evento.target as Element | null)?.closest?.('[data-onibus]');
        if (!(alvo instanceof HTMLElement)) return;
        evento.preventDefault();
        evento.stopPropagation();
        const id = Number(alvo.dataset['onibus']);
        if (!Number.isInteger(id)) return;
        this.zona.run(() => this.alternarFicha(id));
      });
    }
    this.observador = new ResizeObserver(() => mapa.invalidateSize());
    this.observador.observe(elemento);

    if (vista) {
      mapa.setView([vista.latitude, vista.longitude], vista.zoom);
      this.enquadrou = true;
    } else if (this.veiculos().length === 0) {
      mapa.setView([-16.328, -48.953], 12);
    }
    this.mapa = mapa;
    requestAnimationFrame(() => mapa.invalidateSize());
    return mapa;
  }

  private alternarFicha(id: number): void {
    this.fichasAbertas.update((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(id)) proxima.delete(id);
      else proxima.add(id);
      return proxima;
    });
  }

  private lembrar(mapa: L.Map): void {
    const centro = mapa.getCenter();
    gravarVistaMapa({ latitude: centro.lat, longitude: centro.lng, zoom: mapa.getZoom() });
  }
}

function tracado(
  camada: L.LayerGroup,
  linha: readonly { nome?: string; latitude: number; longitude: number }[],
  cor: string,
  metros: number,
): L.LatLngExpression[] {
  const coordenadas = deslocarPontos(
    linha.map((ponto) => ({ nome: ponto.nome ?? '', latitude: ponto.latitude, longitude: ponto.longitude })),
    metros,
  ).map((ponto) => [ponto.latitude, ponto.longitude] as L.LatLngExpression);
  if (coordenadas.length >= 2) {
    L.polyline(coordenadas, { color: cor, weight: 5, opacity: 0.9 }).addTo(camada);
  }
  return coordenadas;
}
