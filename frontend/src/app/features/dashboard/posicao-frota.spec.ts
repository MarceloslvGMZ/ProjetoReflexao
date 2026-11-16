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
  desatualizada: false,
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
      placa: 'ABC1D23',
      modelo: 'Marcopolo',
      desatualizada: false,
    });
    expect(veiculo.atualizadoEm).toContain('2026');
  });

  it('usa só a placa quando a API não envia o modelo', () => {
    const [veiculo] = paraVeiculos([{ ...posicao, modelo: undefined as unknown as string }]);
    expect(veiculo.onibus).toBe('ABC1D23');
  });

  it('deixa de fora quem já parou de compartilhar', () => {
    expect(paraVeiculos([{ ...posicao, desatualizada: true }])).toEqual([]);
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
    placa: 'ABC1D23',
    modelo: 'Marcopolo',
    rota: 'Centro <Campus>',
    motorista: 'João',
    atualizadoEm: '16/11/2026, 12:00:00',
    latitude: 0,
    longitude: 0,
    desatualizada: false,
  };

  it('mostra a rota e o motorista, e esconde placa e modelo até abrir', () => {
    const fechada = fichaDoVeiculo(veiculo);
    expect(fechada).toContain('Centro &lt;Campus&gt;');
    expect(fechada).toContain('João');
    expect(fechada).toContain('aria-expanded="false"');
    expect(fechada).not.toContain('Placa');

    const aberta = fichaDoVeiculo(veiculo, true);
    expect(aberta).toContain('aria-expanded="true"');
    expect(aberta).toContain('Placa ABC1D23');
    expect(aberta).toContain('Modelo Marcopolo');
  });
});
