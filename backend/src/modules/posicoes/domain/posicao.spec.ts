import { DomainError } from '../../../shared/domain/errors.js';
import { Posicao, posicaoDesatualizada } from './posicao.js';

const dados = { onibusId: 1, latitude: -23.5, longitude: -46.6, usuarioId: 7 };

describe('Posicao', () => {
  it('guarda a coordenada e o instante do registro', () => {
    const agora = new Date('2026-11-16T12:00:00.000Z');
    const posicao = Posicao.registrar(dados, agora);

    expect(posicao.latitude).toBe(-23.5);
    expect(posicao.longitude).toBe(-46.6);
    expect(posicao.atualizadoEm).toBe(agora);
    expect(posicao.usuarioId).toBe(7);
  });

  it.each([
    ['latitude abaixo de -90', { latitude: -90.1 }],
    ['latitude acima de 90', { latitude: 90.1 }],
    ['longitude abaixo de -180', { longitude: -180.1 }],
    ['longitude acima de 180', { longitude: 180.1 }],
  ])('rejeita %s', (_caso, alteracao) => {
    expect(() => Posicao.registrar({ ...dados, ...alteracao })).toThrow(DomainError);
  });

  it('marca como desatualizada só depois de dois minutos', () => {
    const agora = new Date('2026-11-16T12:00:00.000Z');
    const recente = new Date(agora.getTime() - 2 * 60 * 1000);
    const antiga = new Date(agora.getTime() - 2 * 60 * 1000 - 1);

    expect(posicaoDesatualizada(recente, agora)).toBe(false);
    expect(posicaoDesatualizada(antiga, agora)).toBe(true);
  });
});
