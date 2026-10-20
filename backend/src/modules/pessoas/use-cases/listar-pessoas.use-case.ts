import { ListarUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { PessoaRepository } from '../domain/pessoa.repository.js';

export class ListarPessoasUseCase extends ListarUseCase(PessoaRepository) {}
