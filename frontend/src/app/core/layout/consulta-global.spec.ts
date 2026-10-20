import { consultarRegistros, type FontesConsulta } from './consulta-global';

const fontes: FontesConsulta = {
  onibus: [{ id: 1, placa: 'ABC1D23', modelo: 'Torino', ano: 2020, capacidade: 40 }],
  pessoas: [{ id: 5, nome: 'Ana', cpf: '52998224725', tipo: 'MOTORISTA', matricula: null }],
  rotas: [
    {
      id: 3,
      nome: 'Centro',
      origem: 'Terminal',
      destino: 'Campus',
      horarioSaidaIda: '07:00',
      horarioSaidaVolta: '18:00',
      turno: 'MANHA',
      onibusId: 1,
      motoristaId: 5,
      ativo: true,
    },
  ],
  ocorrencias: [
    {
      id: 9,
      titulo: 'Pneu furado',
      descricao: 'No retorno',
      dataHora: '2026-10-20T10:00:00.000Z',
      rotaId: 3,
      onibusId: 1,
      usuarioId: 1,
    },
  ],
  usuarios: [{ id: 2, pessoaId: 5, usuario: 'ana', perfil: 'MOTORISTA', ativo: true }],
};

describe('consultarRegistros', () => {
  it('resume o registro e aponta a página dele', () => {
    expect(consultarRegistros(fontes, 'torino', false)).toEqual([
      { recurso: 'Ônibus', id: 1, titulo: 'ABC1D23', detalhe: 'Torino · 2020', caminho: '/onibus' },
    ]);
    expect(consultarRegistros(fontes, 'pneu', false)[0]).toMatchObject({ caminho: '/ocorrencias', id: 9 });
  });

  it('ignora um caractere e esconde usuários de quem não é administrador', () => {
    expect(consultarRegistros(fontes, 'a', true)).toEqual([]);
    expect(consultarRegistros(fontes, 'ana', false).map((item) => item.recurso)).toEqual(['Pessoa']);
    expect(consultarRegistros(fontes, 'ana', true).map((item) => item.recurso)).toEqual(['Pessoa', 'Usuário']);
  });
});
