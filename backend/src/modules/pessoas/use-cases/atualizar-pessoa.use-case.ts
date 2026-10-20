import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { DadosPessoa, Pessoa } from '../domain/pessoa.js';
import { PessoaRepository } from '../domain/pessoa.repository.js';
import { garantirPessoaUnica } from './garantir-pessoa-unica.js';

@Injectable()
export class AtualizarPessoaUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async executar(id: number, dados: DadosPessoa): Promise<Pessoa> {
    const pessoa = await this.pessoaRepository.buscarPorId(id);
    if (!pessoa) throw new NotFoundError('Pessoa não encontrada');

    pessoa.atualizar(dados);
    await garantirPessoaUnica(pessoa, this.pessoaRepository);

    return this.pessoaRepository.salvar(pessoa);
  }
}
