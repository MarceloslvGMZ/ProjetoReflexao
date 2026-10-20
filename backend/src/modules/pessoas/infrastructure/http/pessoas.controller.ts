import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Perfis } from '../../../auth/infrastructure/http/decorators.js';
import { AtualizarPessoaUseCase } from '../../use-cases/atualizar-pessoa.use-case.js';
import { BuscarPessoaUseCase } from '../../use-cases/buscar-pessoa.use-case.js';
import { CriarPessoaUseCase } from '../../use-cases/criar-pessoa.use-case.js';
import { ListarPessoasUseCase } from '../../use-cases/listar-pessoas.use-case.js';
import { RemoverPessoaUseCase } from '../../use-cases/remover-pessoa.use-case.js';
import { PessoaDto } from './pessoa.dto.js';

@Controller('pessoas')
export class PessoasController {
  constructor(
    private readonly criarPessoa: CriarPessoaUseCase,
    private readonly listarPessoas: ListarPessoasUseCase,
    private readonly buscarPessoa: BuscarPessoaUseCase,
    private readonly atualizarPessoa: AtualizarPessoaUseCase,
    private readonly removerPessoa: RemoverPessoaUseCase,
  ) {}

  @Perfis('ADMINISTRADOR')
  @Post()
  criar(@Body() dto: PessoaDto) {
    return this.criarPessoa.executar(dto);
  }

  @Get()
  listar() {
    return this.listarPessoas.executar();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.buscarPessoa.executar(id);
  }

  @Perfis('ADMINISTRADOR')
  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: PessoaDto) {
    return this.atualizarPessoa.executar(id, dto);
  }

  @Perfis('ADMINISTRADOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.removerPessoa.executar(id);
  }
}
