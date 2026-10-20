import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LucidePencil, LucideTrash } from '@lucide/angular';
import type { Badge, ColunaLista, Registro } from '../../../core/state/config-recurso';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-tabela-recurso',
  imports: [NgTemplateOutlet, StatusBadge, LucidePencil, LucideTrash],
  templateUrl: './tabela-recurso.html',
})
export class TabelaRecurso {
  readonly itens = input.required<Registro[]>();
  readonly colunas = input.required<readonly ColunaLista[]>();
  readonly texto = input.required<(coluna: ColunaLista, item: Registro) => string>();
  readonly badge = input<((item: Registro) => Badge | null) | null>(null);
  readonly mostrarAcoes = input(false);
  readonly podeEditar = input<(item: Registro) => boolean>(() => false);
  readonly podeExcluir = input<(item: Registro) => boolean>(() => false);
  readonly editar = output<Registro>();
  readonly excluir = output<Registro>();

  protected celula(coluna: ColunaLista, item: Registro): string {
    return this.texto()(coluna, item);
  }

  protected situacao(item: Registro): Badge | null {
    return this.badge()?.(item) ?? null;
  }

  protected rotuloBooleano(coluna: ColunaLista, item: Registro): string {
    const ligado = Boolean(item[coluna.id]);
    if (coluna.id === 'ativo') return ligado ? 'Ativo' : 'Inativo';
    return ligado ? 'Sim' : 'Não';
  }
}
