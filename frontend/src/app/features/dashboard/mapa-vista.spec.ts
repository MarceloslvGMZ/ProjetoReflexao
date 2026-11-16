import { gravarVistaMapa, lerVistaMapa } from './mapa-vista';

describe('vista do mapa', () => {
  beforeEach(() => localStorage.clear());

  it('devolve nulo quando ainda não há um enquadramento salvo', () => {
    expect(lerVistaMapa()).toBeNull();
  });

  it('recupera o último centro e o zoom', () => {
    gravarVistaMapa({ latitude: -22.9, longitude: -43.2, zoom: 14 });

    expect(lerVistaMapa()).toEqual({ latitude: -22.9, longitude: -43.2, zoom: 14 });
  });
});
