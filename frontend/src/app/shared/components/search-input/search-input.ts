import { Component, input, output } from '@angular/core';
import { LucideSearch } from '@lucide/angular';
import { CLASSE_CAIXA } from '../../ui';
import { AdornoCampo } from '../adorno-campo/adorno-campo';

@Component({
  selector: 'app-search-input',
  imports: [LucideSearch, AdornoCampo],
  templateUrl: './search-input.html',
  host: { class: 'block' },
})
export class SearchInput {
  readonly valor = input('');
  readonly rotulo = input('Buscar');
  readonly placeholder = input('Buscar');
  /** Mostra o rótulo acima do campo. Sem isso, ele fica só para o leitor de tela. */
  readonly exibirRotulo = input(false);
  protected readonly caixa = `${CLASSE_CAIXA} pr-3 pl-9`;
  readonly valorChange = output<string>();

  protected aoDigitar(evento: Event): void {
    this.valorChange.emit((evento.target as HTMLInputElement).value);
  }
}
