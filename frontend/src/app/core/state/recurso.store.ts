import { Signal, computed, signal } from '@angular/core';
import { paraErroApi } from '../api/erro-api';
import { RecursoService } from '../api/recurso.service';
import { ReferenciasService } from '../formularios/referencias.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AvisosOperacao } from '../layout/avisos-operacao';
import type { ConfigRecurso, Registro } from './config-recurso';
import { filtrarLista } from './filtrar-lista';

export class RecursoStore {
  readonly itens = signal<Registro[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly filtros = signal<Record<string, string>>({});
  readonly extras = signal<unknown>(undefined);
  readonly carregadoEm = signal<Date | null>(null);
  readonly modal = signal<'fechado' | 'criar' | 'editar'>('fechado');
  readonly selecionado = signal<Registro | null>(null);
  readonly confirmando = signal<Registro | null>(null);
  readonly excluindo = signal(false);
  readonly filtrados: Signal<Registro[]>;

  private pedido = 0;

  constructor(
    private readonly recursos: RecursoService,
    private readonly toast: ToastService,
    private readonly referencias: ReferenciasService,
    private readonly avisos: AvisosOperacao,
    private readonly termo: Signal<string>,
    private readonly registroId: Signal<number | null>,
    private readonly config: () => ConfigRecurso,
  ) {
    this.filtrados = computed(() => {
      const lista = filtrarLista(this.itens(), this.termo(), this.filtros(), this.extras(), this.config());
      const id = this.registroId();
      return id === null ? lista : lista.filter((item) => item.id === id);
    });
  }

  async carregar(): Promise<void> {
    const pedido = ++this.pedido;
    if (this.itens().length === 0) this.carregando.set(true);
    try {
      const cfg = this.config();
      const itens = await this.recursos.listar<Registro>(cfg.recurso, cfg.parametros?.(this.filtros()));
      const extras = await this.carregarExtras(cfg);
      if (pedido !== this.pedido) return;
      this.itens.set(itens);
      this.extras.set(extras);
      this.carregadoEm.set(new Date());
      this.erro.set(null);
    } catch (erro) {
      if (pedido !== this.pedido) return;
      this.erro.set(paraErroApi(erro).mensagens.join(' '));
    } finally {
      if (pedido === this.pedido) this.carregando.set(false);
    }
  }

  definirFiltro(id: string, valor: string): void {
    this.filtros.update((atual) => ({ ...atual, [id]: valor }));
    if (this.config().filtros?.some((filtro) => filtro.id === id && filtro.recarrega)) {
      void this.carregar();
    }
  }

  abrirCriacao(): void {
    this.selecionado.set(null);
    this.modal.set('criar');
  }

  abrirEdicao(item: Registro): void {
    this.selecionado.set(item);
    this.modal.set('editar');
  }

  fechar(): void {
    this.modal.set('fechado');
    this.selecionado.set(null);
  }

  async aposSalvar(): Promise<void> {
    this.toast.sucesso('Registro salvo.');
    this.fechar();
    this.referencias.invalidar(this.config().recurso);
    this.avisos.atualizar();
    await this.carregar();
  }

  pedirExclusao(item: Registro): void {
    this.confirmando.set(item);
  }

  cancelarExclusao(): void {
    if (!this.excluindo()) this.confirmando.set(null);
  }

  async confirmarExclusao(): Promise<void> {
    const item = this.confirmando();
    if (!item || this.excluindo()) return;
    this.excluindo.set(true);
    try {
      await this.recursos.remover(this.config().recurso, item.id);
      this.toast.sucesso('Registro excluído.');
      this.confirmando.set(null);
      this.referencias.invalidar(this.config().recurso);
      this.avisos.atualizar();
      await this.carregar();
    } catch (erro) {
      this.toast.erro(paraErroApi(erro).mensagens.join(' '));
    } finally {
      this.excluindo.set(false);
    }
  }

  private async carregarExtras(cfg: ConfigRecurso): Promise<unknown> {
    if (!cfg.extras) return undefined;
    try {
      return await cfg.extras();
    } catch {
      return undefined;
    }
  }
}
