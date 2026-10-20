import { Component, input } from '@angular/core';

export interface VeiculoMapa {
  id: number;
  rotulo: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-mapa-operacional',
  templateUrl: './mapa-operacional.html',
})
export class MapaOperacional {
  /** Quando o rastreamento existir, o dashboard passa `true` e a lista de veículos. */
  readonly disponivel = input(false);
  readonly veiculos = input<readonly VeiculoMapa[]>([]);
}
