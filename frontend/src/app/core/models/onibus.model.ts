export interface Onibus {
  id: number;
  /** Maiúsculas, sem hífen: `ABC1234` ou `ABC1D23`. */
  placa: string;
  modelo: string;
  ano: number;
  capacidade: number;
}
