import { DomainError } from '../../../shared/domain/errors.js';
import { Onibus } from './onibus.js';

const dadosValidos = { placa: 'abc-1234', modelo: ' Marcopolo ', ano: 2020, capacidade: 44 };

describe('Onibus', () => {
  it('normaliza placa e modelo ao criar', () => {
    const onibus = Onibus.criar(dadosValidos);

    expect(onibus.placa).toBe('ABC1234');
    expect(onibus.modelo).toBe('Marcopolo');
    expect(onibus.id).toBeNull();
  });

  it('aceita placa no formato Mercosul', () => {
    expect(Onibus.criar({ ...dadosValidos, placa: 'ABC1D23' }).placa).toBe('ABC1D23');
  });

  it.each([
    ['placa inválida', { placa: '12ABC34' }],
    ['modelo vazio', { modelo: '   ' }],
    ['ano muito antigo', { ano: 1969 }],
    ['ano no futuro', { ano: new Date().getFullYear() + 2 }],
    ['capacidade zero', { capacidade: 0 }],
    ['capacidade fracionada', { capacidade: 10.5 }],
  ])('rejeita %s', (_caso, alteracao) => {
    expect(() => Onibus.criar({ ...dadosValidos, ...alteracao })).toThrow(DomainError);
  });

  it('valida os dados também ao atualizar', () => {
    const onibus = Onibus.criar(dadosValidos);

    expect(() => onibus.atualizar({ ...dadosValidos, capacidade: -1 })).toThrow(DomainError);
  });
});
