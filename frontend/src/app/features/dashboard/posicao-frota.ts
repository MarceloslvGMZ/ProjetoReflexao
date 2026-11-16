export interface PosicaoFrota {
  onibusId: number;
  placa: string;
  modelo: string;
  rota: string | null;
  motorista: string | null;
  latitude: number;
  longitude: number;
  atualizadoEm: string;
  desatualizada: boolean;
}

export interface VeiculoMapa {
  id: number;
  onibus: string;
  rota: string;
  motorista: string;
  atualizadoEm: string;
  latitude: number;
  longitude: number;
  desatualizada: boolean;
}

export function paraVeiculos(posicoes: readonly PosicaoFrota[]): VeiculoMapa[] {
  return posicoes.map((posicao) => ({
    id: posicao.onibusId,
    onibus: `${posicao.modelo} · ${posicao.placa}`,
    rota: posicao.rota ?? 'Sem rota ativa',
    motorista: posicao.motorista ?? 'Sem motorista na rota',
    atualizadoEm: new Date(posicao.atualizadoEm).toLocaleString('pt-BR'),
    latitude: posicao.latitude,
    longitude: posicao.longitude,
    desatualizada: posicao.desatualizada,
  }));
}

export function fichaDoVeiculo(veiculo: VeiculoMapa): string {
  const estado = veiculo.desatualizada ? 'Sem sinal recente' : 'Compartilhando';
  return [
    `<strong>${escapar(veiculo.onibus)}</strong>`,
    `Rota: ${escapar(veiculo.rota)}`,
    `Motorista: ${escapar(veiculo.motorista)}`,
    `Atualizado: ${escapar(veiculo.atualizadoEm)}`,
    estado,
  ].join('<br>');
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (caractere) => {
    const mapa: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return mapa[caractere];
  });
}
