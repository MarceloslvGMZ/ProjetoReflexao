import type { ConfigRecurso, Registro } from './config-recurso';
import { filtrarLista } from './filtrar-lista';

const config: ConfigRecurso = {
  recurso: 'pessoas',
  titulo: 'Pessoas',
  descricao: '',
  rotuloNovo: 'Nova',
  buscarEm: ['nome', 'cpf'],
  filtros: [
    { id: 'tipo', rotulo: 'Tipo' },
    {
      id: 'rotaId',
      rotulo: 'Rota',
      recarrega: true,
    },
    {
      id: 'situacao',
      rotulo: 'Situação',
      corresponde: (item, valor) => (valor === 'com-matricula' ? Boolean(item['matricula']) : !item['matricula']),
    },
  ],
};

const itens: Registro[] = [
  { id: 1, nome: 'Ana Souza', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: 'M1' },
  { id: 2, nome: 'Rui Lima', cpf: '11144477735', tipo: 'MOTORISTA', matricula: null },
];

describe('filtrarLista', () => {
  it('busca por texto e filtra por igualdade', () => {
    expect(filtrarLista(itens, 'ana', {}, undefined, config).map((item) => item['id'])).toEqual([1]);
    expect(filtrarLista(itens, '', { tipo: 'MOTORISTA' }, undefined, config).map((item) => item['id'])).toEqual([2]);
  });

  it('não reaplica no cliente um filtro que a API já resolveu', () => {
    expect(filtrarLista(itens, '', { rotaId: '9' }, undefined, config)).toHaveLength(2);
  });

  it('aplica filtro com regra própria', () => {
    expect(filtrarLista(itens, '', { situacao: 'com-matricula' }, undefined, config).map((item) => item['id'])).toEqual([
      1,
    ]);
  });
});
