import { Rota, Turno } from './rota.js';

export abstract class RotaRepository {
  abstract salvar(rota: Rota): Promise<Rota>;
  abstract buscarPorId(id: number): Promise<Rota | null>;
  abstract listar(): Promise<Rota[]>;
  abstract listarAtivasPorTurno(turno: Turno): Promise<Rota[]>;
  /** Lança ConflictError se a rota estiver vinculada a ocorrências. */
  abstract remover(id: number): Promise<void>;
}
