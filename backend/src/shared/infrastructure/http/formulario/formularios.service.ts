import { Injectable, OnModuleInit, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PERFIS } from '../../../../modules/auth/infrastructure/http/decorators.js';
import type { Perfil } from '../../../../modules/usuarios/domain/usuario.js';
import { DescricaoCampo, lerCampos } from './campo.decorator.js';

export interface DescricaoFormulario {
  recurso: string;
  acao: string;
  metodo: string;
  caminho: string;
  /** Perfis que podem enviar o formulário; vazio = qualquer usuário logado. */
  perfis: Perfil[];
  campos: DescricaoCampo[];
}

/**
 * Monta, na inicialização, a descrição de todos os formulários da API:
 * percorre os controllers e, em cada método, procura um parâmetro cujo tipo
 * (lido de `design:paramtypes`) seja um DTO com campos `@Campo`.
 */
@Injectable()
export class FormulariosService implements OnModuleInit {
  private formularios: DescricaoFormulario[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.formularios = this.discovery
      .getControllers()
      .filter((wrapper) => wrapper.metatype && wrapper.instance)
      .flatMap((wrapper) => this.formulariosDoController(wrapper.metatype as Function));
  }

  listar(): DescricaoFormulario[] {
    return this.formularios;
  }

  buscar(recurso: string, acao: string): DescricaoFormulario | undefined {
    return this.formularios.find((f) => f.recurso === recurso && f.acao === acao);
  }

  private formulariosDoController(controller: Function): DescricaoFormulario[] {
    const recurso = this.reflector.get<string>(PATH_METADATA, controller);
    const prototipo = controller.prototype as object;

    return this.scanner.getAllMethodNames(prototipo).flatMap((acao) => {
      const handler = (prototipo as Record<string, Function>)[acao];
      const tiposDosParametros: Function[] =
        Reflect.getMetadata('design:paramtypes', prototipo, acao) ?? [];
      const dto = tiposDosParametros.find((tipo) => lerCampos(tipo).length > 0);
      if (!dto) return [];

      const caminhoDoMetodo = this.reflector.get<string>(PATH_METADATA, handler);
      const metodo = this.reflector.get<RequestMethod>(METHOD_METADATA, handler);
      const perfis = this.reflector.getAllAndOverride<Perfil[]>(PERFIS, [handler, controller]);

      return [
        {
          recurso,
          acao,
          metodo: RequestMethod[metodo],
          caminho: juntarCaminho(recurso, caminhoDoMetodo),
          perfis: perfis ?? [],
          campos: lerCampos(dto),
        },
      ];
    });
  }
}

function juntarCaminho(...partes: string[]): string {
  return '/' + partes.map((p) => p.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
}
