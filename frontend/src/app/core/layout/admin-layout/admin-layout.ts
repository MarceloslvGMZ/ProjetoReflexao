import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { RecursoService } from '../../api/recurso.service';
import type { Ocorrencia } from '../../models';
import { ocorrenciasRecentes } from '../../../shared/operacao';
import { FormularioDinamico } from '../../../shared/components/formulario-dinamico/formulario-dinamico';
import { Modal } from '../../../shared/components/modal/modal';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { AvisosOperacao } from '../avisos-operacao';
import { ConsultaGlobal } from '../consulta-global';
import { LayoutService } from '../layout.service';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Topbar, Modal, FormularioDinamico],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  private readonly recursos = inject(RecursoService);
  private readonly router = inject(Router);
  private readonly consulta = inject(ConsultaGlobal);
  private readonly avisos = inject(AvisosOperacao);
  private readonly toast = inject(ToastService);
  private readonly layout = inject(LayoutService);
  private readonly lista = signal<Ocorrencia[]>([]);
  private readonly url = signal(this.router.url);

  protected readonly trocandoSenha = signal(false);
  protected readonly recentes = computed(() => ocorrenciasRecentes(this.lista()));

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((evento) => {
        this.layout.fecharMenu();
        if (evento.urlAfterRedirects.split('?')[0] !== this.url().split('?')[0]) this.consulta.limpar();
        this.url.set(evento.urlAfterRedirects);
      });

    effect(() => {
      this.avisos.versao();
      this.url();
      untracked(() => void this.carregarOcorrencias());
    });
  }

  protected abrirSenha(): void {
    this.layout.fecharMenu();
    this.trocandoSenha.set(true);
  }

  protected senhaAlterada(): void {
    this.trocandoSenha.set(false);
    this.toast.sucesso('Senha alterada.');
  }

  private async carregarOcorrencias(): Promise<void> {
    try {
      this.lista.set(await this.recursos.listar<Ocorrencia>('ocorrencias'));
    } catch {
      this.lista.set([]);
    }
  }
}
