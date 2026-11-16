import { Component, input } from '@angular/core';

/**
 * Prende o ícone à caixa do campo. O rótulo fica fora deste componente,
 * senão um `absolute` no meio do bloco sobe quando o texto aparece.
 */
@Component({
  selector: 'app-adorno-campo',
  templateUrl: './adorno-campo.html',
  host: { class: 'relative block' },
})
export class AdornoCampo {
  /** Onde o elemento marcado com `adorno` fica dentro do campo. */
  readonly lado = input<'inicio' | 'fim'>('inicio');
  /** O adorno recebe clique, como o botão de mostrar senha. A lupa não recebe. */
  readonly interativo = input(false);
}
