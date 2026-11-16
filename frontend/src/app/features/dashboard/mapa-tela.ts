import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { paraErroApi } from '../../core/api/erro-api';
import { CLASSE_BTN_SECUNDARIO } from '../../shared/ui';
import { MapaOperacional } from './mapa-operacional';
import { paraVeiculos, type PosicaoFrota, type VeiculoMapa } from './posicao-frota';

/** A tela cheia consulta com mais frequência do que o celular envia, para o ponto andar assim que a posição chega. */
const INTERVALO_CONSULTA_MS = 2000;

@Component({
  selector: 'app-mapa-tela',
  imports: [RouterLink, MapaOperacional],
  template: `
    <section class="flex h-[calc(100dvh-7rem)] min-h-[24rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h1 class="font-semibold">Mapa da frota</h1>
        <a routerLink="/dashboard" [class]="btnSecundario">Voltar</a>
      </div>
      <div class="min-h-0 flex-1">
        <app-mapa-operacional [veiculos]="veiculos()" />
      </div>
      @if (erro(); as mensagem) {
        <p class="px-4 py-2 text-sm text-erro-700" role="alert">{{ mensagem }}</p>
      } @else if (consultado() && veiculos().length === 0) {
        <p class="px-4 py-2 text-sm text-slate-500">Nenhum ônibus está compartilhando a localização.</p>
      }
    </section>
  `,
})
export class MapaTela {
  private readonly api = inject(ApiService);
  protected readonly btnSecundario = CLASSE_BTN_SECUNDARIO;
  protected readonly veiculos = signal<readonly VeiculoMapa[]>([]);
  protected readonly erro = signal<string | null>(null);
  protected readonly consultado = signal(false);

  constructor() {
    void this.atualizar();
    interval(INTERVALO_CONSULTA_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.atualizar());
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
