import { Directive, ElementRef, HostListener, afterNextRender, inject } from '@angular/core';

const SELETOR =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

@Directive({ selector: '[appTrapFocus]' })
export class TrapFocus {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.focaveis()[0]?.focus());
  }

  @HostListener('keydown', ['$event'])
  aoTeclado(evento: KeyboardEvent): void {
    if (evento.key !== 'Tab') return;
    const focaveis = this.focaveis();
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  private focaveis(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>(SELETOR)].filter(
      (elemento) => !elemento.hasAttribute('disabled') && elemento.tabIndex !== -1,
    );
  }
}
