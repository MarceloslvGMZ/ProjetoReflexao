import { Campo } from '../../../../shared/infrastructure/http/formulario/campo.decorator.js';
import { TURNOS, type Turno } from '../../domain/rota.js';

export class RotaDto {
  @Campo({ rotulo: 'Nome', exemplo: 'Centro - Campus' })
  nome: string;

  @Campo({ rotulo: 'Origem' })
  origem: string;

  @Campo({ rotulo: 'Destino' })
  destino: string;

  @Campo({ rotulo: 'Saída da ida', exemplo: '06:30' })
  horarioSaidaIda: string;

  @Campo({ rotulo: 'Saída da volta', exemplo: '12:15', ajuda: 'Deve ser depois da saída da ida' })
  horarioSaidaVolta: string;

  @Campo({ rotulo: 'Turno', opcoes: TURNOS })
  turno: Turno;

  @Campo({ rotulo: 'Ônibus', referencia: { recurso: 'onibus', exibir: 'placa' } })
  onibusId: number;

  @Campo({ rotulo: 'Motorista', referencia: { recurso: 'pessoas', exibir: 'nome' } })
  motoristaId: number;

  @Campo({ rotulo: 'Ativa', opcional: true })
  ativo?: boolean;
}
