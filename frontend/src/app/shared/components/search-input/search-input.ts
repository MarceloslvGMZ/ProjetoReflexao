import { Component, input, output } from '@angular/core';
import { LucideSearch } from '@lucide/angular';

@Component({
  selector: 'app-search-input',
  imports: [LucideSearch],
  templateUrl: './search-input.html',
  host: { class: 'block' },
})
export class SearchInput {
  readonly valor = input('');
  readonly rotulo = input('Buscar');
  readonly placeholder = input('Buscar');
  readonly valorChange = output<string>();

  protected aoDigitar(evento: Event): void {
    this.valorChange.emit((evento.target as HTMLInputElement).value);
  }
}
