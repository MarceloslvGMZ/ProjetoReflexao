export const TURNOS = ['MANHA', 'TARDE', 'NOITE'] as const;
export type Turno = (typeof TURNOS)[number];

export interface Rota {
  id: number;
  nome: string;
  origem: string;
  destino: string;
  /** `HH:MM` */
  horarioSaidaIda: string;
  /** `HH:MM` */
  horarioSaidaVolta: string;
  turno: Turno;
  onibusId: number;
  motoristaId: number;
  ativo: boolean;
}
