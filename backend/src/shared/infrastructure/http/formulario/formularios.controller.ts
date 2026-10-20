import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Publico } from '../../../../modules/auth/infrastructure/http/decorators.js';
import { FormulariosService } from './formularios.service.js';

/** A descrição dos campos não é sensível; é pública para o front-end montar até a tela de login. */
@Publico()
@Controller('formularios')
export class FormulariosController {
  constructor(private readonly formularios: FormulariosService) {}

  @Get()
  listar() {
    return this.formularios.listar();
  }

  @Get(':recurso/:acao')
  buscar(@Param('recurso') recurso: string, @Param('acao') acao: string) {
    const formulario = this.formularios.buscar(recurso, acao);
    if (!formulario) throw new NotFoundException('Formulário não encontrado');
    return formulario;
  }
}
