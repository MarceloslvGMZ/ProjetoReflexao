export interface Ocorrencia {
  id: number;
  titulo: string;
  descricao: string;
  /** ISO 8601 */
  dataHora: string;
  /** Autor do registro. */
  usuarioId: number;
  onibusId: number;
  rotaId: number;
}
