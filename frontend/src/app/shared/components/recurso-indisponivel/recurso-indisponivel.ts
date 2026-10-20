import { Component, input } from '@angular/core';
import { LucideClock } from '@lucide/angular';

@Component({
  selector: 'app-recurso-indisponivel',
  imports: [LucideClock],
  templateUrl: './recurso-indisponivel.html',
})
export class RecursoIndisponivel {
  readonly titulo = input('Indisponível no momento');
  readonly descricao = input('');
}
