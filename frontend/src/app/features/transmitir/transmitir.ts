import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { paraErroApi } from '../../core/api/erro-api';
import type { Onibus } from '../../core/models';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { deveEnviarPosicao } from './envio-posicao';

interface Leitura {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-transmitir',
  imports: [FormsModule, PageHeader],
  templateUrl: './transmitir.html',
})
export class Transmitir implements OnDestroy {
  private readonly api = inject(ApiService);
  private relogio: number | null = null;
  private ultimoEnvio: number | null = null;

  protected readonly onibus = signal<Onibus[]>([]);
  protected readonly onibusId = signal<number | null>(null);
  protected readonly carregando = signal(true);
  protected readonly compartilhando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly leitura = signal<Leitura | null>(null);
  protected readonly envio = signal<'aguardando' | 'enviado' | 'falhou'>('aguardando');

  constructor() {
    void this.carregar();
  }

  ngOnDestroy(): void {
    this.parar();
  }

  protected async carregar(): Promise<void> {
    try {
      const lista = await this.api.get<Onibus[]>('/onibus');
      this.onibus.set(lista);
      this.onibusId.set(lista[0]?.id ?? null);
    } catch (erro) {
      this.erro.set(paraErroApi(erro).mensagens.join(' '));
    } finally {
      this.carregando.set(false);
    }
  }

  protected compartilhar(): void {
    const id = this.onibusId();
    if (id === null || this.compartilhando()) return;
    if (!navigator.geolocation) {
      this.erro.set('Este navegador não informa a localização.');
      return;
    }

    this.erro.set(null);
    this.envio.set('aguardando');
    this.relogio = navigator.geolocation.watchPosition(
      (posicao) => void this.receber(id, posicao.coords.latitude, posicao.coords.longitude),
      (falha) => {
        this.parar();
        this.erro.set(mensagemDaPermissao(falha));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    this.compartilhando.set(true);
  }

  protected parar(): void {
    if (this.relogio !== null) navigator.geolocation.clearWatch(this.relogio);
    this.relogio = null;
    this.ultimoEnvio = null;
    this.compartilhando.set(false);
  }

  private async receber(onibusId: number, latitude: number, longitude: number): Promise<void> {
    this.leitura.set({ latitude, longitude });
    const agora = Date.now();
    if (!deveEnviarPosicao(this.ultimoEnvio, agora)) return;

    this.ultimoEnvio = agora;
    try {
      await this.api.enviar('POST', `/onibus/${onibusId}/posicoes`, { latitude, longitude });
      this.envio.set('enviado');
      this.erro.set(null);
    } catch (erro) {
      this.envio.set('falhou');
      this.erro.set(paraErroApi(erro).mensagens.join(' '));
    }
  }
}

function mensagemDaPermissao(falha: GeolocationPositionError): string {
  if (falha.code === falha.PERMISSION_DENIED) {
    return 'O compartilhamento não começou. Autorize a localização nas configurações do navegador.';
  }
  return 'Não foi possível ler a localização deste celular.';
}
