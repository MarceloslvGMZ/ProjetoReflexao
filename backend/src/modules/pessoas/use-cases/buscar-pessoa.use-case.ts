import { BuscarPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { PessoaRepository } from '../domain/pessoa.repository.js';

export class BuscarPessoaUseCase extends BuscarPorIdUseCase(PessoaRepository, 'Pessoa não encontrada') {}
