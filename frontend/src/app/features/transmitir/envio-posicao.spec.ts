import { deveEnviarPorMovimento, deveEnviarPosicao } from './envio-posicao';

describe('deveEnviarPosicao', () => {
  it('envia a primeira posição imediatamente', () => {
    expect(deveEnviarPosicao(null, 10_000)).toBe(true);
  });

  it('segura o envio dentro da janela de cinco segundos', () => {
    expect(deveEnviarPosicao(10_000, 14_999)).toBe(false);
    expect(deveEnviarPosicao(10_000, 15_000)).toBe(true);
  });
});

describe('deveEnviarPorMovimento', () => {
  it('envia quando ainda não havia posição anterior', () => {
    expect(deveEnviarPorMovimento(null, { latitude: -16.3, longitude: -48.9 })).toBe(true);
  });

  it('só envia depois de um deslocamento relevante', () => {
    const origem = { latitude: -16.328, longitude: -48.953 };
    expect(deveEnviarPorMovimento(origem, { latitude: -16.3281, longitude: -48.953 })).toBe(false);
    expect(deveEnviarPorMovimento(origem, { latitude: -16.329, longitude: -48.953 })).toBe(true);
  });
});
