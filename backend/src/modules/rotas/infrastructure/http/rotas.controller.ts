import {
  BadRequestException,
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
import { Perfis } from '../../../auth/infrastructure/http/decorators.js';
import { AtualizarRotaUseCase } from '../../use-cases/atualizar-rota.use-case.js';
import { BuscarRotaUseCase } from '../../use-cases/buscar-rota.use-case.js';
import { CriarRotaUseCase } from '../../use-cases/criar-rota.use-case.js';
import { ListarRotasUseCase } from '../../use-cases/listar-rotas.use-case.js';
import { RemoverRotaUseCase } from '../../use-cases/remover-rota.use-case.js';
import { normalizarParadas } from '../../domain/parada.js';
import { ConsultarTrajetoService } from './consultar-trajeto.service.js';
import { RotaDto } from './rota.dto.js';

@Controller('rotas')
export class RotasController {
  constructor(
    private readonly criarRota: CriarRotaUseCase,
    private readonly listarRotas: ListarRotasUseCase,
    private readonly buscarRota: BuscarRotaUseCase,
    private readonly atualizarRota: AtualizarRotaUseCase,
    private readonly removerRota: RemoverRotaUseCase,
    private readonly trajetos: ConsultarTrajetoService,
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

  @Get('lugares')
  lugares(@Query('q') consulta?: string) {
    if (!consulta?.trim()) throw new BadRequestException('Informe o local da parada.');
    return this.trajetos.buscar(consulta);
  }

  @Get('lugares/reverso')
  reverso(@Query('latitude') latitude?: string, @Query('longitude') longitude?: string) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('Informe o ponto no mapa.');
    }
    return this.trajetos.reverso(lat, lon);
  }

  @Get('trajeto')
  trajeto(
    @Query('origem') origem?: string,
    @Query('destino') destino?: string,
    @Query('paradas') paradas?: string,
  ) {
    if (!origem?.trim() || !destino?.trim()) {
      throw new BadRequestException('Informe a origem e o destino da rota.');
    }
    return this.trajetos.executar(origem, destino, this.lerParadas(paradas));
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

  private lerParadas(bruto?: string): unknown {
    if (!bruto?.trim()) return [];
    try {
      return normalizarParadas(JSON.parse(bruto));
    } catch (erro) {
      if (erro instanceof SyntaxError) throw new BadRequestException('Paradas em formato inválido.');
      throw erro;
    }
  }
}
