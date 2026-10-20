import { DomainError } from '../../../shared/domain/errors.js';

export const TURNOS = ['MANHA', 'TARDE', 'NOITE'] as const;
export type Turno = (typeof TURNOS)[number];

export interface DadosRota {
  nome: string;
  origem: string;
  destino: string;
  horarioSaidaIda: string;
  horarioSaidaVolta: string;
  turno: Turno;
  onibusId: number;
  motoristaId: number;
  ativo?: boolean;
}

const FORMATO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export class Rota {
  private constructor(
    public readonly id: number | null,
    public nome: string,
    public origem: string,
    public destino: string,
    public horarioSaidaIda: string,
    public horarioSaidaVolta: string,
    public turno: Turno,
    public onibusId: number,
    public motoristaId: number,
    public ativo: boolean,
  ) {}

  static criar(dados: DadosRota): Rota {
    const v = Rota.validar(dados);
    return new Rota(
      null,
      v.nome,
      v.origem,
      v.destino,
      v.horarioSaidaIda,
      v.horarioSaidaVolta,
      v.turno,
      v.onibusId,
      v.motoristaId,
      dados.ativo ?? true,
    );
  }

  static restaurar(id: number, dados: DadosRota): Rota {
    return new Rota(
      id,
      dados.nome,
      dados.origem,
      dados.destino,
      dados.horarioSaidaIda,
      dados.horarioSaidaVolta,
      dados.turno,
      dados.onibusId,
      dados.motoristaId,
      dados.ativo ?? true,
    );
  }

  atualizar(dados: DadosRota): void {
    const v = Rota.validar(dados);
    this.nome = v.nome;
    this.origem = v.origem;
    this.destino = v.destino;
    this.horarioSaidaIda = v.horarioSaidaIda;
    this.horarioSaidaVolta = v.horarioSaidaVolta;
    this.turno = v.turno;
    this.onibusId = v.onibusId;
    this.motoristaId = v.motoristaId;
    this.ativo = dados.ativo ?? this.ativo;
  }

  private static validar(dados: DadosRota) {
    const nome = dados.nome.trim();
    const origem = dados.origem.trim();
    const destino = dados.destino.trim();
    if (!nome) throw new DomainError('Nome é obrigatório');
    if (!origem) throw new DomainError('Origem é obrigatória');
    if (!destino) throw new DomainError('Destino é obrigatório');
    if (origem.toLowerCase() === destino.toLowerCase()) {
      throw new DomainError('Origem e destino devem ser diferentes');
    }

    const { horarioSaidaIda, horarioSaidaVolta } = dados;
    if (!FORMATO_HORARIO.test(horarioSaidaIda) || !FORMATO_HORARIO.test(horarioSaidaVolta)) {
      throw new DomainError('Horários devem estar no formato HH:MM');
    }
    // No formato HH:MM, a comparação de texto equivale à comparação de horário.
    if (horarioSaidaVolta <= horarioSaidaIda) {
      throw new DomainError('Horário de saída da volta deve ser depois do horário de saída da ida');
    }

    if (!TURNOS.includes(dados.turno)) {
      throw new DomainError(`Turno deve ser um de: ${TURNOS.join(', ')}`);
    }

    return {
      nome,
      origem,
      destino,
      horarioSaidaIda,
      horarioSaidaVolta,
      turno: dados.turno,
      onibusId: dados.onibusId,
      motoristaId: dados.motoristaId,
    };
  }
}
