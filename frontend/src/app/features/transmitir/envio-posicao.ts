/** Intervalo mínimo entre dois envios do mesmo celular. */
export const INTERVALO_ENVIO_MS = 5000;

/** Deslocamento mínimo (metros) para forçar envio antes do intervalo. */
export const DESLOCAMENTO_MINIMO_M = 25;

export function deveEnviarPosicao(
  ultimoEnvio: number | null,
  agora: number,
  intervalo = INTERVALO_ENVIO_MS,
): boolean {
  return ultimoEnvio === null || agora - ultimoEnvio >= intervalo;
}

export function deveEnviarPorMovimento(
  anterior: { latitude: number; longitude: number } | null,
  atual: { latitude: number; longitude: number },
  minimoMetros = DESLOCAMENTO_MINIMO_M,
): boolean {
  if (!anterior) return true;
  return distanciaMetros(anterior, atual) >= minimoMetros;
}

function distanciaMetros(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const raio = 6371000;
  const phi1 = (a.latitude * Math.PI) / 180;
  const phi2 = (b.latitude * Math.PI) / 180;
  const dPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLambda = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * raio * Math.asin(Math.sqrt(h));
}
