import { Posicao } from './posicao.js';

export abstract class PosicaoRepository {
  /** Substitui a posição anterior do mesmo ônibus. */
  abstract salvar(posicao: Posicao): Promise<Posicao>;
  abstract listar(): Promise<Posicao[]>;
  /** Tira o ônibus do mapa quando o compartilhamento para. */
  abstract remover(onibusId: number): Promise<void>;
}
