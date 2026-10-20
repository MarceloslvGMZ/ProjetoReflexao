import 'reflect-metadata';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export type TipoCampo =
  | 'texto'
  | 'senha'
  | 'numero'
  | 'booleano'
  | 'selecao'
  | 'data-hora'
  | 'referencia';

export interface OpcoesCampo {
  rotulo: string;
  /** Campo pode ser omitido no corpo da requisição. */
  opcional?: boolean;
  /** Valores permitidos; o campo vira uma seleção. */
  opcoes?: readonly string[];
  /** Id de outro recurso; o front-end carrega as opções de `GET /{recurso}`. */
  referencia?: { recurso: string; exibir: string };
  /** Força um tipo quando o tipo do TypeScript não basta (ex.: `senha`, `data-hora`). */
  tipo?: Extract<TipoCampo, 'senha' | 'data-hora'>;
  /** Torna o campo obrigatório quando outro campo tiver o valor informado. */
  obrigatorioSe?: { campo: string; igual: string };
  exemplo?: string;
  ajuda?: string;
}

export interface DescricaoCampo extends Omit<OpcoesCampo, 'opcional' | 'tipo'> {
  nome: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
}

const METADADO_CAMPOS = Symbol('formulario:campos');

/**
 * Descreve uma propriedade de DTO para o front-end e aplica as validações do
 * `class-validator` correspondentes ao tipo, que é descoberto por reflexão
 * (`design:type`, gerado pelo `emitDecoratorMetadata`).
 */
export function Campo(opcoes: OpcoesCampo): PropertyDecorator {
  return (alvo, propriedade) => {
    const nome = String(propriedade);
    const tipoTs: unknown = Reflect.getMetadata('design:type', alvo, propriedade);
    const { opcional, tipo: _, ...resto } = opcoes;

    const campo: DescricaoCampo = {
      ...resto,
      nome,
      tipo: inferirTipo(opcoes, tipoTs, `${alvo.constructor.name}.${nome}`),
      obrigatorio: !opcional,
    };

    const campos: DescricaoCampo[] = Reflect.getOwnMetadata(METADADO_CAMPOS, alvo.constructor) ?? [];
    Reflect.defineMetadata(METADADO_CAMPOS, [...campos, campo], alvo.constructor);

    for (const validador of validadoresDo(campo)) validador(alvo, propriedade);
  };
}

/** Campos declarados com `@Campo` em um DTO, na ordem em que aparecem na classe. */
export function lerCampos(dto: Function): DescricaoCampo[] {
  return Reflect.getOwnMetadata(METADADO_CAMPOS, dto) ?? [];
}

function inferirTipo(opcoes: OpcoesCampo, tipoTs: unknown, local: string): TipoCampo {
  if (opcoes.opcoes) return 'selecao';
  if (opcoes.referencia) return 'referencia';
  if (opcoes.tipo) return opcoes.tipo;
  if (tipoTs === String) return 'texto';
  if (tipoTs === Number) return 'numero';
  if (tipoTs === Boolean) return 'booleano';
  throw new Error(`@Campo: não foi possível inferir o tipo de ${local}; informe "tipo" ou "opcoes"`);
}

function validadoresDo(campo: DescricaoCampo): PropertyDecorator[] {
  const validadores: PropertyDecorator[] = campo.obrigatorio ? [] : [IsOptional()];
  switch (campo.tipo) {
    case 'texto':
    case 'senha':
      validadores.push(IsString());
      if (campo.obrigatorio) validadores.push(IsNotEmpty());
      break;
    case 'numero':
    case 'referencia':
      validadores.push(IsInt());
      break;
    case 'booleano':
      validadores.push(IsBoolean());
      break;
    case 'selecao':
      validadores.push(IsIn(campo.opcoes as string[]));
      break;
    case 'data-hora':
      validadores.push(IsISO8601());
      break;
  }
  return validadores;
}
