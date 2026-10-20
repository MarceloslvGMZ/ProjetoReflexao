export const TIPOS_PESSOA = ['MOTORISTA', 'ESTUDANTE', 'ADMINISTRADOR'] as const;
export type TipoPessoa = (typeof TIPOS_PESSOA)[number];

export interface Pessoa {
  id: number;
  nome: string;
  /** Somente dígitos. */
  cpf: string;
  tipo: TipoPessoa;
  /** Preenchida apenas para `ESTUDANTE`. */
  matricula: string | null;
}
