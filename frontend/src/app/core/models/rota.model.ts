export const TURNOS = ['MANHA', 'TARDE', 'NOITE'] as const;
export type Turno = (typeof TURNOS)[number];

export interface ParadaRota {
  nome: string;
  latitude: number;
  longitude: number;
}

export interface Rota {
  id: number;
  nome: string;
  origem: string;
  destino: string;
  paradas?: ParadaRota[];
  /** `HH:MM` */
  horarioSaidaIda: string;
  /** `HH:MM` */
  horarioSaidaVolta: string;
  turno: Turno;
  onibusId: number;
  motoristaId: number;
  ativo: boolean;
}
