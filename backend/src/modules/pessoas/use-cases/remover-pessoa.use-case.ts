import { RemoverPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { PessoaRepository } from '../domain/pessoa.repository.js';

export class RemoverPessoaUseCase extends RemoverPorIdUseCase(PessoaRepository, 'Pessoa não encontrada') {}
