import { ConflictError } from '../../../shared/domain/errors.js';
import { Pessoa } from '../domain/pessoa.js';
import { PessoaRepository } from '../domain/pessoa.repository.js';

export async function garantirPessoaUnica(pessoa: Pessoa, repository: PessoaRepository) {
  const mesmoCpf = await repository.buscarPorCpf(pessoa.cpf);
  if (mesmoCpf && mesmoCpf.id !== pessoa.id) {
    throw new ConflictError('Já existe uma pessoa com esse CPF');
  }

  if (pessoa.matricula) {
    const mesmaMatricula = await repository.buscarPorMatricula(pessoa.matricula);
    if (mesmaMatricula && mesmaMatricula.id !== pessoa.id) {
      throw new ConflictError('Já existe um estudante com essa matrícula');
    }
  }
}
