import { deveEnviarPosicao } from './envio-posicao';

describe('deveEnviarPosicao', () => {
  it('envia a primeira posição imediatamente', () => {
    expect(deveEnviarPosicao(null, 10_000)).toBe(true);
  });

  it('segura o envio dentro da janela de dois segundos', () => {
    expect(deveEnviarPosicao(10_000, 11_999)).toBe(false);
    expect(deveEnviarPosicao(10_000, 12_000)).toBe(true);
  });
});
