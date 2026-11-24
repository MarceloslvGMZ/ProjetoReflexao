import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import type { PosicaoFrota } from '../../features/dashboard/posicao-frota';

interface AckPosicao {
  ok?: boolean;
  mensagem?: string;
}

@Injectable({ providedIn: 'root' })
export class PosicoesRealtimeService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private soquete: Socket | null = null;

  readonly conectado = signal(false);
  private readonly ouvintesSnapshot = new Set<(lista: PosicaoFrota[]) => void>();
  private readonly ouvintesAtualizacao = new Set<(posicao: PosicaoFrota) => void>();
  private readonly ouvintesRemocao = new Set<(onibusId: number) => void>();

  conectar(): void {
    const token = this.auth.token();
    if (!token) return;
    if (this.soquete?.connected) return;
    if (this.soquete) {
      this.soquete.auth = { token };
      this.soquete.connect();
      return;
    }

    const soquete = io(`${environment.wsUrl}/posicoes`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    soquete.on('connect', () => this.conectado.set(true));
    soquete.on('disconnect', () => this.conectado.set(false));
    soquete.on('connect_error', () => this.conectado.set(false));
    soquete.on('posicoes:snapshot', (lista: PosicaoFrota[]) => {
      for (const ouvinte of this.ouvintesSnapshot) ouvinte(Array.isArray(lista) ? lista : []);
    });
    soquete.on('posicao:atualizar', (posicao: PosicaoFrota) => {
      if (!posicao || typeof posicao.onibusId !== 'number') return;
      for (const ouvinte of this.ouvintesAtualizacao) ouvinte(posicao);
    });
    soquete.on('posicao:remover', (corpo: { onibusId?: number }) => {
      const onibusId = Number(corpo?.onibusId);
      if (!Number.isInteger(onibusId)) return;
      for (const ouvinte of this.ouvintesRemocao) ouvinte(onibusId);
    });

    this.soquete = soquete;
  }

  desconectar(): void {
    this.soquete?.disconnect();
    this.conectado.set(false);
  }

  aoSnapshot(ouvinte: (lista: PosicaoFrota[]) => void): () => void {
    this.ouvintesSnapshot.add(ouvinte);
    return () => this.ouvintesSnapshot.delete(ouvinte);
  }

  aoAtualizar(ouvinte: (posicao: PosicaoFrota) => void): () => void {
    this.ouvintesAtualizacao.add(ouvinte);
    return () => this.ouvintesAtualizacao.delete(ouvinte);
  }

  aoRemover(ouvinte: (onibusId: number) => void): () => void {
    this.ouvintesRemocao.add(ouvinte);
    return () => this.ouvintesRemocao.delete(ouvinte);
  }

  /** Devolve true quando o servidor confirmou pelo canal em tempo real. */
  async enviarPosicao(onibusId: number, latitude: number, longitude: number): Promise<boolean> {
    this.conectar();
    const soquete = this.soquete;
    if (!soquete?.connected) return false;
    return emitirComAck(soquete, 'posicao:enviar', { onibusId, latitude, longitude });
  }

  async encerrarPosicao(onibusId: number): Promise<boolean> {
    this.conectar();
    const soquete = this.soquete;
    if (!soquete?.connected) return false;
    return emitirComAck(soquete, 'posicao:encerrar', { onibusId });
  }

  ngOnDestroy(): void {
    this.soquete?.removeAllListeners();
    this.soquete?.disconnect();
    this.soquete = null;
    this.conectado.set(false);
  }
}

function emitirComAck(
  soquete: Socket,
  evento: string,
  dados: Record<string, unknown>,
): Promise<boolean> {
  return new Promise((resolver) => {
    const tempo = window.setTimeout(() => resolver(false), 4000);
    soquete.timeout(3500).emit(evento, dados, (erro: Error | null, ack?: AckPosicao) => {
      window.clearTimeout(tempo);
      if (erro) {
        resolver(false);
        return;
      }
      resolver(ack?.ok === true);
    });
  });
}
