import { afterNextRender, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import * as L from 'leaflet';
import type { VeiculoMapa } from './posicao-frota';

/** Centro inicial quando nenhum ônibus está compartilhando. */
const CENTRO_PADRAO: L.LatLngExpression = [-23.5505, -46.6333];

@Component({
  selector: 'app-mapa-operacional',
  templateUrl: './mapa-operacional.html',
  host: { class: 'block h-full w-full' },
})
export class MapaOperacional {
  readonly veiculos = input<readonly VeiculoMapa[]>([]);

  private readonly superficie = viewChild.required<ElementRef<HTMLElement>>('superficie');
  private mapa: L.Map | null = null;
  private readonly camada = L.layerGroup();
  private enquadrou = false;

  constructor() {
    afterNextRender(() => {
      const mapa = L.map(this.superficie().nativeElement).setView(CENTRO_PADRAO, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapa);
      this.camada.addTo(mapa);
      this.mapa = mapa;
      this.desenhar();
    });

    effect(() => {
      this.veiculos();
      this.desenhar();
    });
  }

  /** O Leaflet não percebe sozinho quando o contêiner muda de altura. */
  redimensionar(): void {
    this.mapa?.invalidateSize();
  }

  private desenhar(): void {
    const mapa = this.mapa;
    if (!mapa) return;

    this.camada.clearLayers();
    const veiculos = this.veiculos();
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
      const estado = veiculo.desatualizada ? 'sem sinal recente' : 'compartilhando';
      marcador.bindTooltip(`${veiculo.rotulo} · ${estado}`, { direction: 'top' });
      marcador.addTo(this.camada);
    }

    if (veiculos.length === 0) {
      mapa.setView(CENTRO_PADRAO, 12);
      this.enquadrou = false;
      return;
    }
    if (this.enquadrou) return;
    mapa.fitBounds(L.latLngBounds(veiculos.map((veiculo) => [veiculo.latitude, veiculo.longitude])), {
      padding: [32, 32],
      maxZoom: 16,
    });
    this.enquadrou = true;
  }
}
