import { DomainError } from '../../../shared/domain/errors.js';
import { Rota } from './rota.js';

const dados = {
  nome: ' Centro - Campus ',
  origem: 'Centro',
  destino: 'Campus',
  horarioSaidaIda: '06:30',
  horarioSaidaVolta: '12:15',
  turno: 'MANHA' as const,
  onibusId: 1,
  motoristaId: 1,
};

describe('Rota', () => {
  it('cria rota ativa por padrão e normaliza o nome', () => {
    const rota = Rota.criar(dados);

    expect(rota.ativo).toBe(true);
    expect(rota.nome).toBe('Centro - Campus');
  });

  it('cria rota inativa quando informado', () => {
    expect(Rota.criar({ ...dados, ativo: false }).ativo).toBe(false);
  });

  it.each([
    ['nome vazio', { nome: ' ' }],
    ['origem igual ao destino', { destino: ' centro ' }],
    ['horário fora do formato', { horarioSaidaIda: '6:30' }],
    ['horário inexistente', { horarioSaidaVolta: '24:00' }],
    ['volta antes da ida', { horarioSaidaVolta: '06:00' }],
    ['volta no mesmo horário da ida', { horarioSaidaVolta: '06:30' }],
    ['turno inexistente', { turno: 'MADRUGADA' as never }],
  ])('rejeita %s', (_caso, alteracao) => {
    expect(() => Rota.criar({ ...dados, ...alteracao })).toThrow(DomainError);
  });

  it('mantém o status atual se a atualização não informar ativo', () => {
    const rota = Rota.criar({ ...dados, ativo: false });

    rota.atualizar(dados);

    expect(rota.ativo).toBe(false);
  });
});
