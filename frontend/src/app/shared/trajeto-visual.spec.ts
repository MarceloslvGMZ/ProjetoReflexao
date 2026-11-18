import { deslocarPontos } from './trajeto-visual';

describe('deslocar a volta', () => {
  it('afasta uma linha norte-sul para o lado', () => {
    const linha = deslocarPontos(
      [
        { nome: 'A', latitude: -16.5, longitude: -49 },
        { nome: 'B', latitude: -16.4, longitude: -49 },
      ],
      16,
    );
    expect(linha[0].longitude).not.toBe(-49);
    expect(linha[0].latitude).toBeCloseTo(-16.5, 4);
  });
});
