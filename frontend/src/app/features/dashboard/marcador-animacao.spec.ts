import { interpolar, textoAtualizadoHa } from './marcador-animacao';

describe('interpolar', () => {
  it('mantém a origem no início e o destino no fim', () => {
    const de = { latitude: -16, longitude: -48 };
    const para = { latitude: -17, longitude: -49 };
    expect(interpolar(de, para, 0)).toEqual(de);
    expect(interpolar(de, para, 1)).toEqual(para);
  });

  it('avança no meio do caminho', () => {
    const meio = interpolar({ latitude: 0, longitude: 0 }, { latitude: 10, longitude: 10 }, 0.5);
    expect(meio.latitude).toBeGreaterThan(0);
    expect(meio.latitude).toBeLessThan(10);
  });
});

describe('textoAtualizadoHa', () => {
  it('descreve o atraso em linguagem curta', () => {
    const agora = Date.parse('2026-11-24T20:00:00.000Z');
    expect(textoAtualizadoHa('2026-11-24T20:00:00.000Z', agora)).toBe('agora');
    expect(textoAtualizadoHa('2026-11-24T19:59:40.000Z', agora)).toBe('há 20 s');
    expect(textoAtualizadoHa('2026-11-24T19:55:00.000Z', agora)).toBe('há 5 min');
  });
});
