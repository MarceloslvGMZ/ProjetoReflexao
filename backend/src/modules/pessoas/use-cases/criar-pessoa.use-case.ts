import { Injectable } from '@nestjs/common';
import { DadosPessoa, Pessoa } from '../domain/pessoa.js';
import { PessoaRepository } from '../domain/pessoa.repository.js';
import { garantirPessoaUnica } from './garantir-pessoa-unica.js';

@Injectable()
export class CriarPessoaUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async executar(dados: DadosPessoa): Promise<Pessoa> {
    const pessoa = Pessoa.criar(dados);
    await garantirPessoaUnica(pessoa, this.pessoaRepository);
    return this.pessoaRepository.salvar(pessoa);
  }
}
