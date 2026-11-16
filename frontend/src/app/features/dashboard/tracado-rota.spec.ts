import { descreverEstimativa, filtrarFrota, formatarDistancia, formatarDuracao, juntarFrota } from './tracado-rota';
import type { Onibus } from '../../core/models/onibus.model';
import type { Rota } from '../../core/models/rota.model';

const onibus: Onibus = { id: 1, placa: 'ABC1D23', modelo: 'Torino', ano: 2020, capacidade: 40 };
const rota: Rota = {
  id: 7,
  nome: 'Centro – Campus',
  origem: 'Centro',
  destino: 'Campus',
  horarioSaidaIda: '07:00',
  horarioSaidaVolta: '12:00',
  turno: 'MANHA',
  onibusId: 1,
  motoristaId: 2,
  ativo: true,
};

describe('frota no mapa', () => {
  it('guarda só as rotas ativas de cada ônibus', () => {
    const [veiculo] = juntarFrota([onibus], [rota, { ...rota, id: 8, ativo: false, onibusId: 1 }]);
    expect(veiculo.rotas.map((item) => item.id)).toEqual([7]);
  });

  it('encontra o ônibus pela placa, pelo modelo ou pelo nome da rota', () => {
    const frota = juntarFrota([onibus, { ...onibus, id: 2, placa: 'XYZ9A87', modelo: 'Volare' }], [rota]);
    expect(filtrarFrota(frota, 'abc1').map((item) => item.id)).toEqual([1]);
    expect(filtrarFrota(frota, 'campus').map((item) => item.id)).toEqual([1]);
    expect(filtrarFrota(frota, 'volare').map((item) => item.id)).toEqual([2]);
    const comParada = juntarFrota(
      [onibus],
      [{ ...rota, paradas: [{ nome: 'UEG', latitude: -16.3, longitude: -48.9 }] }],
    );
    expect(filtrarFrota(comParada, 'ueg').map((item) => item.id)).toEqual([1]);
  });
});

describe('estimativa', () => {
  it('escreve o tempo e a distância em português', () => {
    expect(formatarDuracao(90)).toBe('2 min');
    expect(formatarDuracao(3900)).toBe('1 h 5 min');
    expect(formatarDistancia(850)).toBe('850 m');
    expect(formatarDistancia(12400)).toBe('12,4 km');
  });

  it('diz se a estimativa seguiu as vias ou a linha reta', () => {
    expect(descreverEstimativa({ duracaoSegundos: 600, distanciaMetros: 8000, fonte: 'via' })).toBe(
      '10 min · 8 km, pelas vias',
    );
  });
});
