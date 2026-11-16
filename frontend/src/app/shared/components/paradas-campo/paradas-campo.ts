import { afterNextRender, Component, effect, ElementRef, inject, input, OnDestroy, signal, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from '../../../core/api/api.service';
import { paraErroApi } from '../../../core/api/erro-api';
import type { ParadaRota } from '../../../core/models';
import { CLASSE_BTN_SECUNDARIO, CLASSE_CAMPO } from '../../ui';

const LIMITE = 20;

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
  protected readonly paradas = signal<ParadaRota[]>([]);
  protected readonly consulta = signal('');
  protected readonly sugestoes = signal<ParadaRota[]>([]);
  protected readonly buscando = signal(false);
  protected readonly marcando = signal(false);
  protected readonly aviso = signal<string | null>(null);

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
      this.paradas();
      this.redesenhar();
    });

    afterNextRender(() => this.criarMapa());
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.mapa?.remove();
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
    if (this.paradas().length >= LIMITE) {
      this.aviso.set(`O limite é ${LIMITE} paradas.`);
      return;
    }
    const lista = [
      ...this.paradas(),
      { nome: encurtar(ponto.nome), latitude: ponto.latitude, longitude: ponto.longitude },
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

  protected renomear(indice: number, evento: Event): void {
    const nome = (evento.target as HTMLInputElement).value.trim();
    if (!nome) return;
    this.definir(this.paradas().map((parada, atual) => (atual === indice ? { ...parada, nome } : parada)));
  }

  protected mover(indice: number, deslocamento: number): void {
    const lista = [...this.paradas()];
    const destino = indice + deslocamento;
    if (destino < 0 || destino >= lista.length) return;
    const [item] = lista.splice(indice, 1);
    lista.splice(destino, 0, item);
    this.definir(lista);
  }

  protected remover(indice: number): void {
    this.definir(this.paradas().filter((_, atual) => atual !== indice));
  }

  private definir(lista: ParadaRota[]): void {
    this.controle().setValue(lista);
    this.controle().markAsDirty();
    this.paradas.set(lista);
  }

  private criarMapa(): void {
    const elemento = this.superficie()?.nativeElement;
    if (!elemento || this.mapa) return;
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

  private async marcar(latitude: number, longitude: number): Promise<void> {
    if (this.controle().disabled || this.marcando()) return;
    this.marcando.set(true);
    this.aviso.set(null);
    try {
      const ponto = await this.api.get<ParadaRota>('/rotas/lugares/reverso', { latitude, longitude });
      this.adicionar({ ...ponto, latitude, longitude }, false);
    } catch (falha) {
      this.adicionar({ nome: `Parada ${this.paradas().length + 1}`, latitude, longitude }, false);
      this.aviso.set(paraErroApi(falha).mensagens.join(' '));
    } finally {
      this.marcando.set(false);
    }
  }

  private redesenhar(enquadrar = false): void {
    const mapa = this.mapa;
    if (!mapa) return;
    this.camada.clearLayers();
    const lista = this.paradas();
    lista.forEach((parada, indice) => {
      const marcador = L.marker([parada.latitude, parada.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<span style="display:flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:9999px;background:#e7a11a;color:#102033;border:2px solid #102033;font-size:11px;font-weight:700">${indice + 1}</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });
      marcador.on('click', (evento: L.LeafletMouseEvent) => L.DomEvent.stopPropagation(evento.originalEvent));
      marcador.bindTooltip(parada.nome, { direction: 'top' });
      marcador.addTo(this.camada);
    });
    if (enquadrar && lista.length > 0) {
      mapa.fitBounds(L.latLngBounds(lista.map((parada) => [parada.latitude, parada.longitude])), {
        padding: [24, 24],
        maxZoom: 15,
      });
    }
  }
}

function lerParadas(valor: unknown): ParadaRota[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const registro = item as ParadaRota;
    const latitude = Number(registro.latitude);
    const longitude = Number(registro.longitude);
    if (!registro.nome || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [{ nome: registro.nome, latitude, longitude }];
  });
}

function encurtar(nome: string): string {
  const curto = nome.split(',').slice(0, 2).join(',').trim();
  return curto.length > 80 ? `${curto.slice(0, 77)}…` : curto;
}
