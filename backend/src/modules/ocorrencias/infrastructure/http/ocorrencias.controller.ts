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
  Query,
} from '@nestjs/common';
import type { PayloadToken } from '../../../auth/domain/token.service.js';
import { UsuarioLogado } from '../../../auth/infrastructure/http/decorators.js';
import { DadosAtualizacaoOcorrencia } from '../../domain/ocorrencia.js';
import { AtualizarOcorrenciaUseCase } from '../../use-cases/atualizar-ocorrencia.use-case.js';
import { BuscarOcorrenciaUseCase } from '../../use-cases/buscar-ocorrencia.use-case.js';
import { CriarOcorrenciaUseCase } from '../../use-cases/criar-ocorrencia.use-case.js';
import { Solicitante } from '../../use-cases/garantir-permissao.js';
import { ListarOcorrenciasUseCase } from '../../use-cases/listar-ocorrencias.use-case.js';
import { RemoverOcorrenciaUseCase } from '../../use-cases/remover-ocorrencia.use-case.js';
import { OcorrenciaDto } from './ocorrencia.dto.js';

const opcional = new ParseIntPipe({ optional: true });

@Controller('ocorrencias')
export class OcorrenciasController {
  constructor(
    private readonly criarOcorrencia: CriarOcorrenciaUseCase,
    private readonly listarOcorrencias: ListarOcorrenciasUseCase,
    private readonly buscarOcorrencia: BuscarOcorrenciaUseCase,
    private readonly atualizarOcorrencia: AtualizarOcorrenciaUseCase,
    private readonly removerOcorrencia: RemoverOcorrenciaUseCase,
  ) {}

  @Post()
  criar(@UsuarioLogado() usuario: PayloadToken, @Body() dto: OcorrenciaDto) {
    return this.criarOcorrencia.executar(usuario.sub, paraDados(dto));
  }

  @Get()
  listar(
    @Query('rotaId', opcional) rotaId?: number,
    @Query('onibusId', opcional) onibusId?: number,
    @Query('usuarioId', opcional) usuarioId?: number,
  ) {
    return this.listarOcorrencias.executar({ rotaId, onibusId, usuarioId });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.buscarOcorrencia.executar(id);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioLogado() usuario: PayloadToken,
    @Body() dto: OcorrenciaDto,
  ) {
    return this.atualizarOcorrencia.executar(id, paraSolicitante(usuario), paraDados(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id', ParseIntPipe) id: number, @UsuarioLogado() usuario: PayloadToken) {
    return this.removerOcorrencia.executar(id, paraSolicitante(usuario));
  }
}

function paraDados(dto: OcorrenciaDto): DadosAtualizacaoOcorrencia {
  return { ...dto, dataHora: dto.dataHora ? new Date(dto.dataHora) : new Date() };
}

function paraSolicitante(usuario: PayloadToken): Solicitante {
  return { id: usuario.sub, perfil: usuario.perfil };
}
