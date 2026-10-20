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
import { AtualizarUsuarioUseCase } from '../../use-cases/atualizar-usuario.use-case.js';
import { BuscarUsuarioUseCase } from '../../use-cases/buscar-usuario.use-case.js';
import { CriarUsuarioUseCase } from '../../use-cases/criar-usuario.use-case.js';
import { ListarUsuarioUseCase } from '../../use-cases/listar-usuario.use-case.js';
import { RemoverUsuarioUseCase } from '../../use-cases/remover-usuario.use-case.js';
import { AtualizarUsuarioDto, CriarUsuarioDto } from './usuario.dto.js';
import { UsuarioPresenter } from './usuario.presenter.js';

@Perfis('ADMINISTRADOR')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly criarUsuario: CriarUsuarioUseCase,
    private readonly listarUsuarios: ListarUsuarioUseCase,
    private readonly buscarUsuario: BuscarUsuarioUseCase,
    private readonly atualizarUsuario: AtualizarUsuarioUseCase,
    private readonly removerUsuario: RemoverUsuarioUseCase,
  ) {}

  @Post()
  async criar(@Body() dto: CriarUsuarioDto) {
    return UsuarioPresenter.paraHttp(await this.criarUsuario.executar(dto));
  }

  @Get()
  async listar() {
    return (await this.listarUsuarios.executar()).map(UsuarioPresenter.paraHttp);
  }

  @Get(':id')
  async buscar(@Param('id', ParseIntPipe) id: number) {
    return UsuarioPresenter.paraHttp(await this.buscarUsuario.executar(id));
  }

  @Put(':id')
  async atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarUsuarioDto) {
    return UsuarioPresenter.paraHttp(await this.atualizarUsuario.executar(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.removerUsuario.executar(id);
  }
}
