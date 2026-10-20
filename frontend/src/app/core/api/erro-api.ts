import { HttpErrorResponse } from '@angular/common/http';

/**
 * Erro normalizado da API. O backend responde `{ statusCode, message }`, em que `message`
 * é `string` (erros de domínio) ou `string[]` (erros do `ValidationPipe`).
 */
export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly mensagens: string[],
  ) {
    super(mensagens.join('\n'));
    this.name = 'ErroApi';
  }
}

const MENSAGENS_PADRAO: Record<number, string> = {
  0: 'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
  400: 'Dados inválidos.',
  401: 'Sessão expirada. Entre novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Registro não encontrado.',
  409: 'A operação conflita com dados já existentes.',
};

export function paraErroApi(erro: unknown): ErroApi {
  if (erro instanceof ErroApi) return erro;
  if (erro instanceof HttpErrorResponse) {
    const mensagens = erro.status === 0 ? null : extrairMensagens(erro.error);
    return new ErroApi(erro.status, mensagens ?? [mensagemPadrao(erro.status)]);
  }
  return new ErroApi(-1, ['Ocorreu um erro inesperado.']);
}

function extrairMensagens(corpo: unknown): string[] | null {
  if (!corpo || typeof corpo !== 'object' || !('message' in corpo)) return null;
  const { message } = corpo;
  if (typeof message === 'string' && message.trim()) return [message];
  if (Array.isArray(message)) {
    const mensagens = message.filter((m): m is string => typeof m === 'string' && !!m.trim());
    return mensagens.length ? mensagens : null;
  }
  return null;
}

function mensagemPadrao(status: number): string {
  return MENSAGENS_PADRAO[status] ?? 'Ocorreu um erro inesperado no servidor.';
}
