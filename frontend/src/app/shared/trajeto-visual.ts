export const COR_IDA = '#15803d';
export const COR_VOLTA = '#1d4ed8';

/** Afasta a volta da ida quando as duas passam pela mesma rua. */
export const DESLOCAMENTO_VOLTA_M = 16;

export interface PontoNoMapa {
  nome: string;
  latitude: number;
  longitude: number;
}

/** Empurra cada ponto para o lado da direção de viagem, em metros. */
export function deslocarPontos(pontos: readonly PontoNoMapa[], metros: number): PontoNoMapa[] {
  if (pontos.length < 2 || metros === 0) return pontos.map((ponto) => ({ ...ponto }));
  return pontos.map((ponto, indice) => {
    const anterior = pontos[Math.max(0, indice - 1)];
    const seguinte = pontos[Math.min(pontos.length - 1, indice + 1)];
    const dLat = seguinte.latitude - anterior.latitude;
    const dLng = seguinte.longitude - anterior.longitude;
    const comprimento = Math.hypot(dLat, dLng) || 1;
    const norte = -dLng / comprimento;
    const leste = dLat / comprimento;
    const metrosPorGrauLat = 111_320;
    const metrosPorGrauLng = Math.max(1, 111_320 * Math.cos((ponto.latitude * Math.PI) / 180));
    return {
      ...ponto,
      latitude: ponto.latitude + (norte * metros) / metrosPorGrauLat,
      longitude: ponto.longitude + (leste * metros) / metrosPorGrauLng,
    };
  });
}
