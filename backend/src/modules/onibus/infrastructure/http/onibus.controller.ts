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
import { AtualizarOnibusUseCase } from '../../use-cases/atualizar-onibus.use-case.js';
import { BuscarOnibusUseCase } from '../../use-cases/buscar-onibus.use-case.js';
import { CriarOnibusUseCase } from '../../use-cases/criar-onibus.use-case.js';
import { ListarOnibusUseCase } from '../../use-cases/listar-onibus.use-case.js';
import { RemoverOnibusUseCase } from '../../use-cases/remover-onibus.use-case.js';
import { OnibusDto } from './onibus.dto.js';

@Controller('onibus')
export class OnibusController {
  constructor(
    private readonly criarOnibus: CriarOnibusUseCase,
    private readonly listarOnibus: ListarOnibusUseCase,
    private readonly buscarOnibus: BuscarOnibusUseCase,
    private readonly atualizarOnibus: AtualizarOnibusUseCase,
    private readonly removerOnibus: RemoverOnibusUseCase,
  ) {}

  @Perfis('ADMINISTRADOR')
  @Post()
  criar(@Body() dto: OnibusDto) {
    return this.criarOnibus.executar(dto);
  }

  @Get()
  listar() {
    return this.listarOnibus.executar();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.buscarOnibus.executar(id);
  }

  @Perfis('ADMINISTRADOR')
  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: OnibusDto) {
    return this.atualizarOnibus.executar(id, dto);
  }

  @Perfis('ADMINISTRADOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.removerOnibus.executar(id);
  }
}
