import { Onibus } from './onibus.js';

export abstract class OnibusRepository {
  abstract salvar(onibus: Onibus): Promise<Onibus>;
  abstract buscarPorId(id: number): Promise<Onibus | null>;
  abstract buscarPorPlaca(placa: string): Promise<Onibus | null>;
  abstract listar(): Promise<Onibus[]>;
  /** Lança ConflictError se o ônibus estiver vinculado a outros registros. */
  abstract remover(id: number): Promise<void>;
}
