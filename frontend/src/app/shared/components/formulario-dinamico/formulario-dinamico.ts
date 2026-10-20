import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  resource,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideCircleAlert, LucideLoaderCircle } from '@lucide/angular';
import { ApiService } from '../../../core/api/api.service';
import { paraErroApi } from '../../../core/api/erro-api';
import { RecursoService } from '../../../core/api/recurso.service';
import { mapearErrosServidor } from '../../../core/formularios/erros-servidor';
import {
  FormGroupDinamico,
  Valores,
  aplicarCondicoes,
  campoVisivel,
  montarFormulario,
  montarPayload,
  resolverCaminho,
} from '../../../core/formularios/formulario.builder';
import type { DescricaoFormulario } from '../../../core/formularios/formulario.model';
import { FormulariosService } from '../../../core/formularios/formularios.service';
import { ReferenciasService } from '../../../core/formularios/referencias.service';
import { CampoDinamico } from '../campo-dinamico/campo-dinamico';

interface Estrutura {
  descricao: DescricaoFormulario;
  form: FormGroupDinamico;
}

let proximoId = 0;

/**
 * Formulário montado a partir de `GET /formularios/:recurso/:acao`. Envia para o `metodo` e o
 * `caminho` descritos pela API e emite `salvo` com a resposta.
 */
@Component({
  selector: 'app-formulario-dinamico',
  imports: [ReactiveFormsModule, CampoDinamico, LucideCircleAlert, LucideLoaderCircle],
  templateUrl: './formulario-dinamico.html',
  host: { class: 'block' },
})
export class FormularioDinamico {
  private readonly formularios = inject(FormulariosService);
  private readonly recursos = inject(RecursoService);
  private readonly referencias = inject(ReferenciasService);
  private readonly api = inject(ApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly recurso = input.required<string>();
  readonly acao = input.required<string>();
  /** Id do registro em edição; substitui o `:id` do caminho. */
  readonly id = input<number | null>(null);
  /** Valores do registro em edição. Sem eles, e com `id`, o registro é buscado na API. */
  readonly valorInicial = input<Valores | null>(null);
  readonly somenteLeitura = input<readonly string[]>([]);
  readonly rotuloEnviar = input('Salvar');
  readonly exibirCancelar = input(true);

  readonly salvo = output<unknown>();
  readonly cancelado = output();

  protected readonly idPrefixo = `formulario-${++proximoId}`;
  protected readonly enviando = signal(false);
  protected readonly errosGerais = signal<string[]>([]);
  private readonly valores = signal<Valores>({});

  protected readonly estrutura = resource({
    params: () => ({
      recurso: this.recurso(),
      acao: this.acao(),
      id: this.id(),
      valorInicial: this.valorInicial(),
      somenteLeitura: this.somenteLeitura(),
    }),
    loader: async ({ params }): Promise<Estrutura> => {
      const [descricao, valores] = await Promise.all([
        this.formularios.buscar(params.recurso, params.acao),
        params.valorInicial ??
          (params.id === null ? null : this.recursos.buscar<Valores>(params.recurso, params.id)),
      ]);
      const form = montarFormulario(descricao, { valores, somenteLeitura: params.somenteLeitura });
      return { descricao, form };
    },
  });

  protected readonly erroDeCarregamento = computed(() => {
    const erro = this.estrutura.error();
    return erro ? paraErroApi(erro.cause ?? erro).mensagens.join(' ') : null;
  });

  protected readonly camposVisiveis = computed(() => {
    if (!this.estrutura.hasValue()) return [];
    const valores = this.valores();
    return this.estrutura.value().descricao.campos.filter((c) => campoVisivel(c, valores));
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.estrutura.hasValue()) return;
      const { form, descricao } = this.estrutura.value();
      this.valores.set(form.getRawValue());
      const inscricao = form.valueChanges.subscribe(() => {
        aplicarCondicoes(form, descricao);
        this.valores.set(form.getRawValue());
      });
      onCleanup(() => inscricao.unsubscribe());
      this.aposRenderizar(() => this.focar('input:not(:disabled), select:not(:disabled)'));
    });
  }

  protected async enviar(): Promise<void> {
    if (!this.estrutura.hasValue() || this.enviando()) return;
    const estrutura = this.estrutura.value();
    const { descricao, form } = estrutura;

    this.errosGerais.set([]);
    form.markAllAsTouched();
    if (form.invalid) {
      this.aposRenderizar(() => this.focar('[aria-invalid="true"]'));
      return;
    }

    this.enviando.set(true);
    try {
      const resposta = await this.api.enviar<unknown>(
        descricao.metodo,
        resolverCaminho(descricao.caminho, this.id()),
        montarPayload(descricao, form),
      );
      this.referencias.invalidar(descricao.recurso);
      this.salvo.emit(resposta);
    } catch (erro) {
      this.exibirErrosDoServidor(estrutura, paraErroApi(erro).mensagens);
    } finally {
      this.enviando.set(false);
    }
  }

  private exibirErrosDoServidor({ descricao, form }: Estrutura, mensagens: string[]): void {
    const { porCampo, gerais } = mapearErrosServidor(descricao, mensagens);
    for (const [nome, textos] of porCampo) {
      const controle = form.controls[nome];
      if (controle.disabled) {
        gerais.push(...textos);
        continue;
      }
      controle.setErrors({ servidor: textos.join(' ') });
      controle.markAsTouched();
    }
    this.errosGerais.set(gerais);
    this.aposRenderizar(() => this.focar('[data-erros-gerais], [aria-invalid="true"]'));
  }

  private aposRenderizar(acao: () => void): void {
    afterNextRender(acao, { injector: this.injector });
  }

  private focar(seletor: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(seletor)?.focus();
  }
}
