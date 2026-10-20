import { Campo } from '../../../../shared/infrastructure/http/formulario/campo.decorator.js';

export class OcorrenciaDto {
  @Campo({ rotulo: 'Título' })
  titulo: string;

  @Campo({ rotulo: 'Descrição' })
  descricao: string;

  @Campo({
    rotulo: 'Data e hora',
    tipo: 'data-hora',
    opcional: true,
    ajuda: 'Se não for informada, usa o momento do registro',
  })
  dataHora?: string;

  @Campo({ rotulo: 'Rota', referencia: { recurso: 'rotas', exibir: 'nome' } })
  rotaId: number;

  @Campo({ rotulo: 'Ônibus', referencia: { recurso: 'onibus', exibir: 'placa' } })
  onibusId: number;
}
