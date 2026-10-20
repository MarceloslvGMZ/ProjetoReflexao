import { DomainError } from '../../../shared/domain/errors.js';
import { Pessoa } from './pessoa.js';

const estudante = {
  nome: ' Maria Silva ',
  cpf: '529.982.247-25',
  tipo: 'ESTUDANTE' as const,
  matricula: '2026001',
};
const motorista = { nome: 'João', cpf: '11144477735', tipo: 'MOTORISTA' as const };

describe('Pessoa', () => {
  it('normaliza nome e CPF ao criar', () => {
    const pessoa = Pessoa.criar(estudante);

    expect(pessoa.nome).toBe('Maria Silva');
    expect(pessoa.cpf).toBe('52998224725');
  });

  it('cria motorista sem matrícula', () => {
    expect(Pessoa.criar(motorista).matricula).toBeNull();
  });

  it.each([
    ['nome vazio', { nome: '  ' }],
    ['CPF com dígito verificador errado', { cpf: '52998224726' }],
    ['CPF com todos os dígitos iguais', { cpf: '11111111111' }],
    ['CPF com tamanho errado', { cpf: '123' }],
    ['tipo inexistente', { tipo: 'PROFESSOR' as never }],
    ['estudante sem matrícula', { matricula: '  ' }],
  ])('rejeita %s', (_caso, alteracao) => {
    expect(() => Pessoa.criar({ ...estudante, ...alteracao })).toThrow(DomainError);
  });

  it('rejeita matrícula para quem não é estudante', () => {
    expect(() => Pessoa.criar({ ...motorista, matricula: '123' })).toThrow(DomainError);
  });

  it('não permite alterar o tipo', () => {
    const pessoa = Pessoa.criar(motorista);

    expect(() => pessoa.atualizar({ ...motorista, tipo: 'ADMINISTRADOR' })).toThrow(DomainError);
  });
});
