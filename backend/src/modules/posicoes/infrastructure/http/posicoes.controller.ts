import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import type { PayloadToken } from '../../../auth/domain/token.service.js';
import { Perfis, UsuarioLogado } from '../../../auth/infrastructure/http/decorators.js';
import { EncerrarCompartilhamentoUseCase } from '../../use-cases/encerrar-compartilhamento.use-case.js';
import { ListarPosicoesUseCase } from '../../use-cases/listar-posicoes.use-case.js';
import { RegistrarPosicaoUseCase } from '../../use-cases/registrar-posicao.use-case.js';
import { RegistrarPosicaoDto } from './registrar-posicao.dto.js';

@Controller()
export class PosicoesController {
  constructor(
    private readonly registrarPosicao: RegistrarPosicaoUseCase,
    private readonly listarPosicoes: ListarPosicoesUseCase,
    private readonly encerrarCompartilhamento: EncerrarCompartilhamentoUseCase,
  ) {}

  @Perfis('MOTORISTA', 'ADMINISTRADOR')
  @Post('onibus/:id/posicoes')
  @HttpCode(HttpStatus.OK)
  registrar(
    @Param('id', ParseIntPipe) onibusId: number,
    @UsuarioLogado() usuario: PayloadToken,
    @Body() dto: RegistrarPosicaoDto,
  ) {
    return this.registrarPosicao.executar(onibusId, usuario.sub, dto);
  }

  @Perfis('MOTORISTA', 'ADMINISTRADOR')
  @Delete('onibus/:id/posicoes')
  @HttpCode(HttpStatus.NO_CONTENT)
  encerrar(@Param('id', ParseIntPipe) onibusId: number) {
    return this.encerrarCompartilhamento.executar(onibusId);
  }

  @Get('posicoes')
  listar() {
    return this.listarPosicoes.executar();
  }
}
