import { paraVeiculos, type PosicaoFrota } from './posicao-frota';

const posicao: PosicaoFrota = {
  onibusId: 3,
  placa: 'ABC1D23',
  latitude: -23.5,
  longitude: -46.6,
  atualizadoEm: '2026-11-16T12:00:00.000Z',
  desatualizada: true,
};

describe('paraVeiculos', () => {
  it('traduz a posição da API para o marcador do mapa', () => {
    expect(paraVeiculos([posicao])).toEqual([
      { id: 3, rotulo: 'ABC1D23', latitude: -23.5, longitude: -46.6, desatualizada: true },
    ]);
  });
});
