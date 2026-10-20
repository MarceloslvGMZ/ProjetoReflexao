import type { DescricaoCampo, DescricaoFormulario } from './formulario.model';

export interface ErrosDoServidor {
  porCampo: Map<string, string[]>;
  gerais: string[];
}

/**
 * Associa as mensagens da API aos campos do formulário:
 * - do `ValidationPipe`, que começam pelo nome da propriedade (`placa should not be empty`);
 * - de domínio, que começam pelo rótulo do campo (`CPF inválido`, `Matrícula é obrigatória...`).
 * O que não puder ser associado vai para `gerais`.
 */
export function mapearErrosServidor(
  descricao: DescricaoFormulario,
  mensagens: readonly string[],
): ErrosDoServidor {
  const porCampo = new Map<string, string[]>();
  const gerais: string[] = [];

  for (const mensagem of mensagens) {
    const validacao = campoDaValidacao(descricao.campos, mensagem);
    const campo = validacao?.campo ?? campoPeloRotulo(descricao.campos, mensagem);
    if (!campo) {
      gerais.push(traduzirPropriedadeExtra(mensagem));
      continue;
    }
    const texto = validacao ? traduzirValidacao(validacao.resto) : mensagem;
    porCampo.set(campo.nome, [...(porCampo.get(campo.nome) ?? []), texto]);
  }
  return { porCampo, gerais };
}

function campoDaValidacao(campos: DescricaoCampo[], mensagem: string) {
  const [primeiraPalavra, ...resto] = mensagem.split(' ');
  const campo = campos.find((c) => c.nome === primeiraPalavra);
  return campo ? { campo, resto: resto.join(' ') } : null;
}

function campoPeloRotulo(campos: DescricaoCampo[], mensagem: string): DescricaoCampo | undefined {
  const texto = mensagem.toLocaleLowerCase('pt-BR');
  return campos
    .filter((c) => texto.startsWith(`${c.rotulo.toLocaleLowerCase('pt-BR')} `))
    .sort((a, b) => b.rotulo.length - a.rotulo.length)[0];
}

const TRADUCOES: [RegExp, string][] = [
  [/should not be empty/, 'Campo obrigatório.'],
  [/must be an integer/, 'Informe um número inteiro.'],
  [/must be a string/, 'Informe um texto.'],
  [/must be a boolean/, 'Informe sim ou não.'],
  [/must be one of the following values/, 'Selecione uma das opções.'],
  [/must be a valid ISO 8601/, 'Data e hora inválidas.'],
];

function traduzirValidacao(resto: string): string {
  return TRADUCOES.find(([padrao]) => padrao.test(resto))?.[1] ?? 'Valor inválido.';
}

function traduzirPropriedadeExtra(mensagem: string): string {
  const extra = /^property (\S+) should not exist$/.exec(mensagem);
  return extra ? `O campo "${extra[1]}" não é aceito pela API.` : mensagem;
}
