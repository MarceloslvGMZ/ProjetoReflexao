import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import type { PayloadToken } from '../../../auth/domain/token.service.js';
import { UsuarioLogado } from '../../../auth/infrastructure/http/decorators.js';
import { ListarPosicoesUseCase } from '../../use-cases/listar-posicoes.use-case.js';
import { RegistrarPosicaoUseCase } from '../../use-cases/registrar-posicao.use-case.js';
import { RegistrarPosicaoDto } from './registrar-posicao.dto.js';

@Controller()
export class PosicoesController {
  constructor(
    private readonly registrarPosicao: RegistrarPosicaoUseCase,
    private readonly listarPosicoes: ListarPosicoesUseCase,
  ) {}

  @Post('onibus/:id/posicoes')
  @HttpCode(HttpStatus.OK)
  registrar(
    @Param('id', ParseIntPipe) onibusId: number,
    @UsuarioLogado() usuario: PayloadToken,
    @Body() dto: RegistrarPosicaoDto,
  ) {
    return this.registrarPosicao.executar(onibusId, usuario.sub, dto);
  }

  @Get('posicoes')
  listar() {
    return this.listarPosicoes.executar();
  }
}
