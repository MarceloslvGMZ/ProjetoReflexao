import { Campo } from '../../../../shared/infrastructure/http/formulario/campo.decorator.js';

export class OnibusDto {
  @Campo({ rotulo: 'Placa', exemplo: 'ABC1D23', ajuda: 'Formato antigo (ABC1234) ou Mercosul (ABC1D23)' })
  placa: string;

  @Campo({ rotulo: 'Modelo', exemplo: 'Marcopolo Torino' })
  modelo: string;

  @Campo({ rotulo: 'Ano', exemplo: '2020' })
  ano: number;

  @Campo({ rotulo: 'Capacidade', exemplo: '44' })
  capacidade: number;
}
