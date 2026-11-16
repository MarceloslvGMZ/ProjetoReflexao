import { NgTemplateOutlet } from '@angular/common';
import { Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBus,
  LucideLayoutDashboard,
  LucideKeyRound,
  LucideLifeBuoy,
  LucideLogOut,
  LucideMapPin,
  LucideRoute,
  LucideTriangleAlert,
  LucideUserRound,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import type { Perfil } from '../../models';
import { rotuloOpcao } from '../../formularios/rotulos';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { Modal } from '../../../shared/components/modal/modal';
import { TrapFocus } from '../../../shared/directives/trap-focus';

interface LinkMenu {
  caminho: string;
  rotulo: string;
  somenteAdmin?: boolean;
  /** Quando informado, o link só aparece para esses perfis. */
  perfis?: readonly Perfil[];
  avisos?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    Modal,
    TrapFocus,
    LucideLayoutDashboard,
    LucideBus,
    LucideUsers,
    LucideRoute,
    LucideTriangleAlert,
    LucideUserRound,
    LucideKeyRound,
    LucideMapPin,
    LucideLifeBuoy,
    LucideLogOut,
    LucideX,
  ],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly avisos = input(0);
  readonly alterarSenha = output<void>();
  protected readonly layout = inject(LayoutService);
  protected readonly auth = inject(AuthService);
  protected readonly suporteAberto = signal(false);

  protected readonly links: LinkMenu[] = [
    { caminho: '/dashboard', rotulo: 'Visão geral' },
    { caminho: '/onibus', rotulo: 'Ônibus' },
    { caminho: '/pessoas', rotulo: 'Pessoas' },
    { caminho: '/rotas', rotulo: 'Rotas' },
    { caminho: '/ocorrencias', rotulo: 'Ocorrências', avisos: true },
    { caminho: '/transmitir', rotulo: 'Compartilhar localização', perfis: ['MOTORISTA', 'ADMINISTRADOR'] },
    { caminho: '/usuarios', rotulo: 'Usuários', somenteAdmin: true },
  ];

  protected readonly visiveis = computed(() =>
    this.links.filter(
      (link) =>
        (!link.somenteAdmin || this.auth.ehAdministrador()) &&
        (!link.perfis || this.auth.possuiPerfil(link.perfis)),
    ),
  );

  protected readonly iniciais = computed(() => (this.auth.usuario()?.usuario ?? '?').slice(0, 2).toUpperCase());
  protected readonly perfil = computed(() => rotuloOpcao(this.auth.perfil() ?? ''));

  @HostListener('document:keydown.escape')
  protected fecharPorEscape(): void {
    if (this.layout.menuAberto() && !this.suporteAberto()) this.layout.fecharMenu();
  }

  protected sair(): void {
    this.layout.fecharMenu();
    this.auth.sair();
  }
}
