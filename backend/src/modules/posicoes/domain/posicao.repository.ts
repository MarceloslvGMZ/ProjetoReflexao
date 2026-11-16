import { Posicao } from './posicao.js';

export abstract class PosicaoRepository {
  /** Substitui a posição anterior do mesmo ônibus. */
  abstract salvar(posicao: Posicao): Promise<Posicao>;
  abstract listar(): Promise<Posicao[]>;
}
