/** Intervalo mínimo entre dois envios do mesmo celular. */
export const INTERVALO_ENVIO_MS = 2000;

export function deveEnviarPosicao(
  ultimoEnvio: number | null,
  agora: number,
  intervalo = INTERVALO_ENVIO_MS,
): boolean {
  return ultimoEnvio === null || agora - ultimoEnvio >= intervalo;
}
