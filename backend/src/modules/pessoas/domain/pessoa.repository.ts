import { Pessoa } from './pessoa.js';

export abstract class PessoaRepository {
  abstract salvar(pessoa: Pessoa): Promise<Pessoa>;
  abstract buscarPorId(id: number): Promise<Pessoa | null>;
  abstract buscarPorCpf(cpf: string): Promise<Pessoa | null>;
  abstract buscarPorMatricula(matricula: string): Promise<Pessoa | null>;
  abstract listar(): Promise<Pessoa[]>;
  /** Lança ConflictError se a pessoa estiver vinculada a outros registros. */
  abstract remover(id: number): Promise<void>;
}
