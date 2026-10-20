import { Pessoa } from '../../src/modules/pessoas/domain/pessoa.js';
import { PessoaRepository } from '../../src/modules/pessoas/domain/pessoa.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryPessoaRepository extends InMemoryRepository<Pessoa> implements PessoaRepository {
  constructor() {
    super((id, pessoa) => Pessoa.restaurar(id, pessoa));
  }

  async buscarPorCpf(cpf: string) {
    return this.buscarUm((pessoa) => pessoa.cpf === cpf);
  }

  async buscarPorMatricula(matricula: string) {
    return this.buscarUm((pessoa) => pessoa.matricula === matricula);
  }
}
