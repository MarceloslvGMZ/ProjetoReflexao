import { DomainError } from '../../../shared/domain/errors.js';
import { normalizarParadas } from './parada.js';

describe('paradas da rota', () => {
  it('aceita a lista vazia e normaliza o nome', () => {
    expect(normalizarParadas(undefined)).toEqual([]);
    expect(normalizarParadas([{ nome: ' UEG ', latitude: '-16.3', longitude: -48.9 }])).toEqual([
      { nome: 'UEG', latitude: -16.3, longitude: -48.9 },
    ]);
  });

  it('rejeita parada sem nome ou fora do mapa', () => {
    expect(() => normalizarParadas([{ nome: ' ', latitude: 0, longitude: 0 }])).toThrow(DomainError);
    expect(() => normalizarParadas([{ nome: 'UEG', latitude: 120, longitude: 0 }])).toThrow(DomainError);
    expect(() => normalizarParadas('UEG')).toThrow(DomainError);
  });
});
