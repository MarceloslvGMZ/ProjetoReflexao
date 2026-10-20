import { HttpErrorResponse } from '@angular/common/http';
import { ErroApi, paraErroApi } from './erro-api';

function respostaHttp(status: number, error: unknown) {
  return new HttpErrorResponse({ status, error });
}

describe('paraErroApi', () => {
  it('usa a mensagem de um erro de domínio', () => {
    const erro = paraErroApi(respostaHttp(409, { statusCode: 409, message: 'Placa já existe' }));
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro.status).toBe(409);
    expect(erro.mensagens).toEqual(['Placa já existe']);
  });

  it('mantém a lista de mensagens do ValidationPipe', () => {
    const erro = paraErroApi(
      respostaHttp(400, { message: ['placa should not be empty', 'ano must be an integer'] }),
    );
    expect(erro.mensagens).toEqual(['placa should not be empty', 'ano must be an integer']);
  });

  it('usa uma mensagem padrão quando o corpo não tem `message`', () => {
    expect(paraErroApi(respostaHttp(403, null)).mensagens).toEqual([
      'Você não tem permissão para realizar esta ação.',
    ]);
  });

  it('identifica falha de conexão (status 0)', () => {
    const erro = paraErroApi(respostaHttp(0, new ProgressEvent('error')));
    expect(erro.status).toBe(0);
    expect(erro.mensagens[0]).toContain('Não foi possível conectar');
  });

  it('não reembrulha um ErroApi', () => {
    const original = new ErroApi(404, ['Rota não encontrada']);
    expect(paraErroApi(original)).toBe(original);
  });
});
