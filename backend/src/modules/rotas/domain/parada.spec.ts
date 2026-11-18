import { DomainError } from '../../../shared/domain/errors.js';
import { LIMITE_PARADAS_POR_SENTIDO, normalizarParadas } from './parada.js';

describe('paradas da rota', () => {
  it('aceita a lista vazia e normaliza o nome', () => {
    expect(normalizarParadas(undefined)).toEqual([]);
    expect(normalizarParadas([{ nome: ' UEG ', latitude: '-16.3', longitude: -48.9 }])).toEqual([
      { nome: 'UEG', latitude: -16.3, longitude: -48.9, sentido: 'IDA', tipo: 'PARADA' },
    ]);
  });

  it('guarda o sentido e o tipo; ausência vira ida e parada', () => {
    expect(
      normalizarParadas([
        { nome: 'Praça', latitude: -16.5, longitude: -49, sentido: 'IDA' },
        { nome: 'Trevo', latitude: -16.4, longitude: -49, sentido: 'IDA', tipo: 'PASSAGEM' },
        { nome: 'Campus', latitude: -16.3, longitude: -48.9, sentido: 'VOLTA' },
      ]),
    ).toEqual([
      { nome: 'Praça', latitude: -16.5, longitude: -49, sentido: 'IDA', tipo: 'PARADA' },
      { nome: 'Trevo', latitude: -16.4, longitude: -49, sentido: 'IDA', tipo: 'PASSAGEM' },
      { nome: 'Campus', latitude: -16.3, longitude: -48.9, sentido: 'VOLTA', tipo: 'PARADA' },
    ]);
  });

  it('rejeita sentido inválido, parada sem nome ou fora do mapa', () => {
    expect(() => normalizarParadas([{ nome: ' ', latitude: 0, longitude: 0 }])).toThrow(DomainError);
    expect(() => normalizarParadas([{ nome: 'UEG', latitude: 120, longitude: 0 }])).toThrow(DomainError);
    expect(() =>
      normalizarParadas([{ nome: 'UEG', latitude: 0, longitude: 0, sentido: 'LATERAL' }]),
    ).toThrow(DomainError);
    expect(() => normalizarParadas('UEG')).toThrow(DomainError);
  });

  it('limita cada sentido a 20 paradas', () => {
    const muitas = Array.from({ length: LIMITE_PARADAS_POR_SENTIDO + 1 }, (_, indice) => ({
      nome: `P${indice}`,
      latitude: -16,
      longitude: -49,
      sentido: 'IDA' as const,
    }));
    expect(() => normalizarParadas(muitas)).toThrow(DomainError);
  });
});
