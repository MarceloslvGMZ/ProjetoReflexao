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
import { AtualizarRotaUseCase } from '../../use-cases/atualizar-rota.use-case.js';
import { BuscarRotaUseCase } from '../../use-cases/buscar-rota.use-case.js';
import { CriarRotaUseCase } from '../../use-cases/criar-rota.use-case.js';
import { ListarRotasUseCase } from '../../use-cases/listar-rotas.use-case.js';
import { RemoverRotaUseCase } from '../../use-cases/remover-rota.use-case.js';
import { RotaDto } from './rota.dto.js';

@Controller('rotas')
export class RotasController {
  constructor(
    private readonly criarRota: CriarRotaUseCase,
    private readonly listarRotas: ListarRotasUseCase,
    private readonly buscarRota: BuscarRotaUseCase,
    private readonly atualizarRota: AtualizarRotaUseCase,
    private readonly removerRota: RemoverRotaUseCase,
  ) {}

  @Perfis('ADMINISTRADOR')
  @Post()
  criar(@Body() dto: RotaDto) {
    return this.criarRota.executar(dto);
  }

  @Get()
  listar() {
    return this.listarRotas.executar();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.buscarRota.executar(id);
  }

  @Perfis('ADMINISTRADOR')
  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: RotaDto) {
    return this.atualizarRota.executar(id, dto);
  }

  @Perfis('ADMINISTRADOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.removerRota.executar(id);
  }
}
