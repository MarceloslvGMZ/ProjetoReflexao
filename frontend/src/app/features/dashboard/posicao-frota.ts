export interface PosicaoFrota {
  onibusId: number;
  placa: string;
  latitude: number;
  longitude: number;
  atualizadoEm: string;
  desatualizada: boolean;
}

export interface VeiculoMapa {
  id: number;
  rotulo: string;
  latitude: number;
  longitude: number;
  desatualizada: boolean;
}

export function paraVeiculos(posicoes: readonly PosicaoFrota[]): VeiculoMapa[] {
  return posicoes.map((posicao) => ({
    id: posicao.onibusId,
    rotulo: posicao.placa,
    latitude: posicao.latitude,
    longitude: posicao.longitude,
    desatualizada: posicao.desatualizada,
  }));
}
