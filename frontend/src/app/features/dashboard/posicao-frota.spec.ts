import { fichaDoVeiculo, paraVeiculos, type PosicaoFrota, type VeiculoMapa } from './posicao-frota';

const posicao: PosicaoFrota = {
  onibusId: 3,
  placa: 'ABC1D23',
  modelo: 'Marcopolo',
  rota: 'Centro - Campus',
  motorista: 'João Victor',
  latitude: -23.5,
  longitude: -46.6,
  atualizadoEm: '2026-11-16T15:00:00.000Z',
  desatualizada: true,
};

describe('paraVeiculos', () => {
  it('traduz a posição da API para o marcador do mapa', () => {
    const [veiculo] = paraVeiculos([posicao]);
    expect(veiculo).toMatchObject({
      id: 3,
      onibus: 'Marcopolo · ABC1D23',
      rota: 'Centro - Campus',
      motorista: 'João Victor',
      latitude: -23.5,
      longitude: -46.6,
      desatualizada: true,
    });
    expect(veiculo.atualizadoEm).toContain('2026');
  });

  it('preenche rota e motorista quando o ônibus não está em uma rota ativa', () => {
    const [veiculo] = paraVeiculos([{ ...posicao, rota: null, motorista: null }]);
    expect(veiculo.rota).toBe('Sem rota ativa');
    expect(veiculo.motorista).toBe('Sem motorista na rota');
  });
});

describe('fichaDoVeiculo', () => {
  const veiculo: VeiculoMapa = {
    id: 3,
    onibus: 'Marcopolo · ABC1D23',
    rota: 'Centro <Campus>',
    motorista: 'João',
    atualizadoEm: '16/11/2026, 12:00:00',
    latitude: 0,
    longitude: 0,
    desatualizada: false,
  };

  it('mostra ônibus, rota, motorista e horário sem interpretar HTML', () => {
    const ficha = fichaDoVeiculo(veiculo);
    expect(ficha).toContain('Marcopolo · ABC1D23');
    expect(ficha).toContain('Centro &lt;Campus&gt;');
    expect(ficha).toContain('Motorista: João');
    expect(ficha).toContain('16/11/2026, 12:00:00');
    expect(ficha).toContain('Compartilhando');
  });
});
