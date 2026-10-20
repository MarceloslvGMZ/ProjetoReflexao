import type { Ocorrencia, Onibus, Pessoa, Rota } from '../core/models';
import { montarPainel, ocorrenciasRecentes, textoRestante } from './operacao';

const agora = new Date(2026, 9, 18, 10, 0, 0);

const onibus: Onibus[] = [
  { id: 1, placa: 'ABC1D23', modelo: 'Torino', ano: 2020, capacidade: 40 },
  { id: 2, placa: 'DEF2E34', modelo: 'Volare', ano: 2018, capacidade: 20 },
];

const pessoas: Pessoa[] = [
  { id: 5, nome: 'Ana', cpf: '52998224725', tipo: 'MOTORISTA', matricula: null },
];

function rota(parcial: Partial<Rota> & Pick<Rota, 'id' | 'horarioSaidaIda' | 'horarioSaidaVolta'>): Rota {
  return {
    nome: 'Centro',
    origem: 'Centro',
    destino: 'Campus',
    turno: 'MANHA',
    onibusId: 1,
    motoristaId: 5,
    ativo: true,
    ...parcial,
  };
}

describe('operação do dashboard', () => {
  it('escolhe a próxima saída do dia e classifica o tempo restante', () => {
    const painel = montarPainel(
      {
        onibus,
        pessoas,
        ocorrencias: [],
        rotas: [
          rota({ id: 1, horarioSaidaIda: '10:20', horarioSaidaVolta: '18:00' }),
          rota({ id: 2, nome: 'Bairro', horarioSaidaIda: '12:30', horarioSaidaVolta: '18:40', onibusId: 2 }),
          rota({ id: 3, nome: 'Já saiu', horarioSaidaIda: '07:00', horarioSaidaVolta: '09:10' }),
        ],
      },
      agora,
    );

    expect(painel.saidas.map((saida) => [saida.rota, saida.status, saida.minutos])).toEqual([
      ['Centro', 'Em breve', 20],
      ['Bairro', 'Aguardando', 150],
      ['Já saiu', 'Saiu', -50],
    ]);
    expect(painel.rotasAtivas).toBe(3);
    expect(painel.rotasProximas2h).toBe(1);
    expect(painel.frotaEmOperacao).toBe(2);
    expect(painel.frotaTotal).toBe(2);
    expect(painel.capacidade).toBe(60);
    expect(painel.veiculos[0]).toMatchObject({ nome: 'Torino', placa: 'ABC1D23', motorista: 'Ana' });
  });

  it('ignora rotas inativas e conta ocorrências das últimas 24 horas', () => {
    const recente: Ocorrencia = {
      id: 1,
      titulo: 'Atraso',
      descricao: 'Trânsito',
      dataHora: new Date(agora.getTime() - 60 * 60_000).toISOString(),
      usuarioId: 1,
      onibusId: 1,
      rotaId: 1,
    };
    const antiga: Ocorrencia = { ...recente, id: 2, dataHora: new Date(agora.getTime() - 30 * 60 * 60_000).toISOString() };
    const painel = montarPainel(
      {
        onibus,
        pessoas,
        ocorrencias: [antiga, recente],
        rotas: [rota({ id: 1, horarioSaidaIda: '11:00', horarioSaidaVolta: '18:00', ativo: false })],
      },
      agora,
    );

    expect(painel.rotasAtivas).toBe(0);
    expect(painel.saidas).toEqual([]);
    expect(painel.ocorrencias24h).toBe(1);
    expect(ocorrenciasRecentes([antiga, recente], agora.getTime()).map((item) => item.id)).toEqual([1]);
  });

  it('descreve o tempo restante', () => {
    expect(textoRestante(0)).toBe('agora');
    expect(textoRestante(20)).toBe('em 20 min');
    expect(textoRestante(90)).toBe('em 1 h 30 min');
    expect(textoRestante(-50)).toBe('há 50 min');
  });
});
