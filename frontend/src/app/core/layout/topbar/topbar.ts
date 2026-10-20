import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { LucideBell, LucideMenu } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs';
import type { Ocorrencia } from '../../models';
import { ConsultaGlobal, type ResultadoConsulta } from '../consulta-global';
import { LayoutService } from '../layout.service';
import { Breadcrumb } from '../../../shared/components/breadcrumb/breadcrumb';
import { SearchInput } from '../../../shared/components/search-input/search-input';
import { formatarDataHora } from '../../../shared/formatacao';

@Component({
  selector: 'app-topbar',
  imports: [Breadcrumb, SearchInput, RouterLink, LucideMenu, LucideBell],
  templateUrl: './topbar.html',
})
export class Topbar {
  readonly recentes = input<readonly Ocorrencia[]>([]);
  protected readonly layout = inject(LayoutService);
  protected readonly consulta = inject(ConsultaGlobal);
  protected readonly buscaAberta = signal(false);
  protected readonly avisosAbertos = signal(false);
  protected readonly formatarDataHora = formatarDataHora;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  protected readonly titulo = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      startWith(null),
      map(() => this.tituloAtual()),
    ),
    { initialValue: this.tituloAtual() },
  );

  protected aoBuscar(valor: string): void {
    this.consulta.definir(valor);
    this.buscaAberta.set(valor.trim().length >= 2);
    this.avisosAbertos.set(false);
  }

  protected abrirResultado(resultado: ResultadoConsulta): void {
    this.buscaAberta.set(false);
    this.consulta.limpar();
    void this.router.navigate([resultado.caminho], { queryParams: { registro: resultado.id } });
  }

  protected alternarAvisos(): void {
    this.avisosAbertos.update((aberto) => !aberto);
  }

  protected fecharAvisos(): void {
    this.avisosAbertos.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(evento: MouseEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) {
      this.avisosAbertos.set(false);
      this.buscaAberta.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected aoEscape(): void {
    this.avisosAbertos.set(false);
    this.buscaAberta.set(false);
  }

  private tituloAtual(): string {
    let rota: typeof this.router.routerState.snapshot.root | null = this.router.routerState.snapshot.root;
    let titulo = '';
    while (rota) {
      const encontrado = rota.data['titulo'];
      if (typeof encontrado === 'string') titulo = encontrado;
      rota = rota.firstChild;
    }
    return titulo;
  }
}
