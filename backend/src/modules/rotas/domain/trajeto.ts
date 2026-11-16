export interface PontoTrajeto {
  nome: string;
  latitude: number;
  longitude: number;
}

export interface TrajetoCalculado {
  origem: PontoTrajeto;
  destino: PontoTrajeto;
  paradas: PontoTrajeto[];
  linha: { latitude: number; longitude: number }[];
  distanciaMetros: number;
  duracaoSegundos: number;
  /** `via` segue a rua. `reta` é a distância direta quando o roteador não responde. */
  fonte: 'via' | 'reta';
}

/** Ônibus urbano, mais lento que o perfil de carro do roteador. */
const FATOR_ONIBUS = 1.25;
const VELOCIDADE_ONIBUS_M_S = 35_000 / 3600;

export function distanciaMetros(origem: PontoTrajeto, destino: PontoTrajeto): number {
  const raio = 6_371_000;
  const paraRadiano = (grau: number) => (grau * Math.PI) / 180;
  const dLat = paraRadiano(destino.latitude - origem.latitude);
  const dLon = paraRadiano(destino.longitude - origem.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadiano(origem.latitude)) *
      Math.cos(paraRadiano(destino.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(2 * raio * Math.asin(Math.sqrt(a)));
}

export function trajetoEmLinhaReta(
  origem: PontoTrajeto,
  destino: PontoTrajeto,
  paradas: readonly PontoTrajeto[] = [],
): TrajetoCalculado {
  const pontos = [origem, ...paradas, destino];
  let distancia = 0;
  for (let indice = 1; indice < pontos.length; indice += 1) {
    distancia += distanciaMetros(pontos[indice - 1], pontos[indice]);
  }
  return {
    origem,
    destino,
    paradas: [...paradas],
    linha: pontos,
    distanciaMetros: distancia,
    duracaoSegundos: Math.max(60, Math.round(distancia / VELOCIDADE_ONIBUS_M_S)),
    fonte: 'reta',
  };
}

/** O roteador devolve o tempo de carro. O ônibus fica um quarto mais lento. */
export function duracaoDeOnibus(segundosDeCarro: number): number {
  return Math.max(60, Math.round(segundosDeCarro * FATOR_ONIBUS));
}
