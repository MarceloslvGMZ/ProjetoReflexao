import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import type { DescricaoCampo, DescricaoFormulario } from './formulario.model';

export type FormGroupDinamico = FormGroup<Record<string, FormControl<unknown>>>;
export type Valores = Record<string, unknown>;

export interface OpcoesMontagem {
  /** Registro em edição (como devolvido por `GET /{recurso}/:id`). */
  valores?: Valores | null;
  /** Campos exibidos, mas não editáveis (continuam sendo enviados). */
  somenteLeitura?: readonly string[];
}

/** Como `Validators.required`, mas também recusa texto só com espaços (o domínio faz `trim`). */
export function obrigatorio(controle: AbstractControl): ValidationErrors | null {
  const valor: unknown = controle.value;
  const vazio = valor === null || valor === undefined || (typeof valor === 'string' && !valor.trim());
  return vazio ? { obrigatorio: true } : null;
}

/** Espelha o `IsInt` aplicado pelo `@Campo` aos tipos `numero` e `referencia`. */
export function inteiro(controle: AbstractControl): ValidationErrors | null {
  const valor: unknown = controle.value;
  if (valor === null || valor === undefined || valor === '') return null;
  return Number.isInteger(Number(valor)) ? null : { inteiro: true };
}

export function montarFormulario(
  descricao: DescricaoFormulario,
  { valores, somenteLeitura = [] }: OpcoesMontagem = {},
): FormGroupDinamico {
  const controles: Record<string, FormControl<unknown>> = {};
  for (const campo of descricao.campos) {
    const valor = valores ? paraValorDoFormulario(campo, valores[campo.nome]) : valorInicial(campo);
    controles[campo.nome] = new FormControl<unknown>(
      { value: valor, disabled: somenteLeitura.includes(campo.nome) },
      validadoresDo(campo),
    );
  }
  const form: FormGroupDinamico = new FormGroup(controles);
  aplicarCondicoes(form, descricao);
  return form;
}

/** Campos com `obrigatorioSe` só se aplicam quando a condição é atendida. */
export function campoVisivel(campo: DescricaoCampo, valores: Valores): boolean {
  const condicao = campo.obrigatorioSe;
  return !condicao || valores[condicao.campo] === condicao.igual;
}

/**
 * Habilita ou desabilita os campos condicionais conforme os valores atuais. Desabilitado, o campo
 * deixa de ser validado. Deve ser chamado a cada mudança de valor do formulário.
 */
export function aplicarCondicoes(form: FormGroupDinamico, descricao: DescricaoFormulario): void {
  const valores = form.getRawValue();
  for (const campo of descricao.campos) {
    if (!campo.obrigatorioSe) continue;
    const controle = form.controls[campo.nome];
    const visivel = campoVisivel(campo, valores);
    if (visivel && controle.disabled) {
      controle.enable({ emitEvent: false });
    } else if (!visivel && controle.enabled) {
      controle.reset(valorInicial(campo), { emitEvent: false });
      controle.disable({ emitEvent: false });
    }
  }
}

/**
 * Corpo da requisição: só os campos descritos pela API (ela rejeita propriedades extras), com os
 * tipos convertidos e sem os opcionais vazios. Campos somente leitura são incluídos.
 */
export function montarPayload(descricao: DescricaoFormulario, form: FormGroupDinamico): Valores {
  const valores = form.getRawValue();
  const payload: Valores = {};
  for (const campo of descricao.campos) {
    if (!campoVisivel(campo, valores)) continue;
    const valor = paraValorDaApi(campo, valores[campo.nome]);
    if (valor !== undefined) payload[campo.nome] = valor;
  }
  return payload;
}

/** Troca `:id` do caminho descrito pela API pelo id do registro em edição. */
export function resolverCaminho(caminho: string, id?: number | null): string {
  if (!caminho.includes(':id')) return caminho;
  if (id === null || id === undefined) {
    throw new Error(`O caminho ${caminho} exige o id do registro`);
  }
  return caminho.replace(':id', String(id));
}

function validadoresDo(campo: DescricaoCampo) {
  const validadores = [];
  if (campo.tipo !== 'booleano' && (campo.obrigatorio || campo.obrigatorioSe)) {
    validadores.push(obrigatorio);
  }
  if (campo.tipo === 'numero' || campo.tipo === 'referencia') validadores.push(inteiro);
  return validadores;
}

function valorInicial(campo: DescricaoCampo): unknown {
  switch (campo.tipo) {
    case 'texto':
    case 'senha':
      return '';
    case 'booleano':
      // Omitir um booleano opcional faz o backend aplicar o padrão, que nos DTOs atuais é "ativo".
      return !campo.obrigatorio;
    default:
      return null;
  }
}

function paraValorDoFormulario(campo: DescricaoCampo, valor: unknown): unknown {
  if (valor === null || valor === undefined) return valorInicial(campo);
  if (campo.tipo === 'data-hora') return paraDataHoraLocal(String(valor));
  if (campo.tipo === 'senha') return '';
  return valor;
}

function paraValorDaApi(campo: DescricaoCampo, valor: unknown): unknown {
  if (campo.tipo === 'booleano') return valor === null || valor === undefined ? undefined : !!valor;
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === 'string' && !valor.trim()) return undefined;

  switch (campo.tipo) {
    case 'numero':
    case 'referencia':
      return Number(valor);
    case 'data-hora':
      return new Date(String(valor)).toISOString();
    default:
      return valor;
  }
}

/** ISO 8601 → valor de `<input type="datetime-local">` no fuso do navegador. */
export function paraDataHoraLocal(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}T${p(data.getHours())}:${p(data.getMinutes())}`;
}
