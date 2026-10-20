import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { LucideCircleAlert, LucideEye, LucideEyeOff } from '@lucide/angular';
import { paraDataHoraLocal } from '../../../core/formularios/formulario.builder';
import type { DescricaoCampo } from '../../../core/formularios/formulario.model';
import { ReferenciasService } from '../../../core/formularios/referencias.service';
import { rotuloOpcao } from '../../../core/formularios/rotulos';

const CLASSE_BASE =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed ' +
  'disabled:bg-slate-100 disabled:text-slate-500';
const CLASSE_NORMAL = 'border-slate-300 focus:border-primaria-500 focus:ring-primaria-200';
const CLASSE_INVALIDA = 'border-erro-600 focus:border-erro-600 focus:ring-erro-50';

@Component({
  selector: 'app-campo-dinamico',
  imports: [ReactiveFormsModule, LucideCircleAlert, LucideEye, LucideEyeOff],
  templateUrl: './campo-dinamico.html',
  host: { class: 'block' },
})
export class CampoDinamico {
  private readonly referencias = inject(ReferenciasService);

  readonly campo = input.required<DescricaoCampo>();
  readonly controle = input.required<FormControl<unknown>>();
  readonly idPrefixo = input.required<string>();

  protected readonly senhaVisivel = signal(false);
  protected readonly maxDataHora = paraDataHoraLocal(new Date().toISOString());

  /** O Reactive Forms não é baseado em signals: cada evento do controle incrementa a versão. */
  private readonly versao = signal(0);

  protected readonly id = computed(() => `${this.idPrefixo()}-${this.campo().nome}`);
  protected readonly idAjuda = computed(() => `${this.id()}-ajuda`);
  protected readonly idErro = computed(() => `${this.id()}-erro`);

  /** Um campo condicional só é exibido quando a condição vale, e aí ele é obrigatório. */
  protected readonly obrigatorio = computed(
    () => this.campo().obrigatorio || !!this.campo().obrigatorioSe,
  );

  protected readonly opcoesSelecao = computed(() =>
    (this.campo().opcoes ?? []).map((valor) => ({ valor, rotulo: rotuloOpcao(valor) })),
  );

  protected readonly referencia = resource({
    params: () => this.campo().referencia,
    loader: ({ params }) => this.referencias.opcoes(params),
  });

  protected readonly erro = computed(() => {
    this.versao();
    const controle = this.controle();
    return controle.touched && controle.errors ? mensagemDeErro(controle.errors) : null;
  });

  protected readonly descritoPor = computed(() => {
    const ids = [this.campo().ajuda ? this.idAjuda() : null, this.erro() ? this.idErro() : null];
    return ids.filter(Boolean).join(' ') || null;
  });

  protected readonly classeCampo = computed(
    () => `${CLASSE_BASE} ${this.erro() ? CLASSE_INVALIDA : CLASSE_NORMAL}`,
  );

  protected readonly autocomplete = computed(() => {
    const { nome, tipo } = this.campo();
    if (tipo === 'senha') return /nova/i.test(nome) ? 'new-password' : 'current-password';
    return nome === 'usuario' ? 'username' : null;
  });

  constructor() {
    effect((onCleanup) => {
      const inscricao = this.controle().events.subscribe(() => this.versao.update((v) => v + 1));
      onCleanup(() => inscricao.unsubscribe());
    });
  }

  protected alternarSenha(): void {
    this.senhaVisivel.update((visivel) => !visivel);
  }
}

function mensagemDeErro(erros: ValidationErrors): string {
  if (typeof erros['servidor'] === 'string') return erros['servidor'];
  if (erros['obrigatorio']) return 'Campo obrigatório.';
  if (erros['inteiro']) return 'Informe um número inteiro.';
  return 'Valor inválido.';
}
