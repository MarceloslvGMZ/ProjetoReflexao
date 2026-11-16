import { afterNextRender, Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { gravarVistaMapa, lerVistaMapa } from './mapa-vista';
import { fichaDoVeiculo, type VeiculoMapa } from './posicao-frota';

@Component({
  selector: 'app-mapa-operacional',
  templateUrl: './mapa-operacional.html',
  host: { class: 'block h-full w-full bg-slate-100' },
})
export class MapaOperacional implements OnDestroy {
  readonly veiculos = input<readonly VeiculoMapa[]>([]);

  private readonly superficie = viewChild.required<ElementRef<HTMLElement>>('superficie');
  private mapa: L.Map | null = null;
  private readonly camada = L.layerGroup();
  private observador: ResizeObserver | null = null;
  /** Já existe um enquadramento persistido; novas posições não movem a câmera. */
  private enquadrou = false;
  private assinatura = '';

  constructor() {
    afterNextRender(() => this.desenhar());

    effect(() => {
      this.veiculos();
      this.desenhar();
    });
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  private desenhar(): void {
    const mapa = this.garantirMapa();
    if (!mapa) return;

    const veiculos = this.veiculos();
    const assinatura = veiculos
      .map((veiculo) => `${veiculo.id}:${veiculo.latitude}:${veiculo.longitude}:${veiculo.desatualizada}:${veiculo.atualizadoEm}`)
      .join('|');
    if (assinatura === this.assinatura) return;
    this.assinatura = assinatura;

    this.camada.clearLayers();
    for (const veiculo of veiculos) {
      const cor = veiculo.desatualizada ? '#d97706' : '#4f46e5';
      const marcador = L.marker([veiculo.latitude, veiculo.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${cor};border:2px solid white;box-shadow:0 0 0 1px ${cor}"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      });
      marcador.bindTooltip(fichaDoVeiculo(veiculo), { direction: 'top', permanent: true, opacity: 1 });
      marcador.addTo(this.camada);
    }

    if (veiculos.length === 0 || this.enquadrou) return;
    mapa.fitBounds(L.latLngBounds(veiculos.map((veiculo) => [veiculo.latitude, veiculo.longitude])), {
      padding: [32, 32],
      maxZoom: 16,
    });
    this.enquadrou = true;
    this.lembrar(mapa);
  }

  /** Sem vista salva e sem veículos, o mapa ainda não é criado. */
  private garantirMapa(): L.Map | null {
    if (this.mapa) return this.mapa;
    const vista = lerVistaMapa();
    if (!vista && this.veiculos().length === 0) return null;

    const elemento = this.superficie().nativeElement;
    const mapa = L.map(elemento);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapa);
    this.camada.addTo(mapa);
    mapa.on('moveend', () => this.lembrar(mapa));
    this.observador = new ResizeObserver(() => mapa.invalidateSize());
    this.observador.observe(elemento);

    if (vista) {
      mapa.setView([vista.latitude, vista.longitude], vista.zoom);
      this.enquadrou = true;
    }
    this.mapa = mapa;
    requestAnimationFrame(() => mapa.invalidateSize());
    return mapa;
  }

  private lembrar(mapa: L.Map): void {
    const centro = mapa.getCenter();
    gravarVistaMapa({ latitude: centro.lat, longitude: centro.lng, zoom: mapa.getZoom() });
  }
}
