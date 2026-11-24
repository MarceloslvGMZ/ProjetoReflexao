/** Duração padrão da interpolação entre duas posições do ônibus. */
export const DURACAO_ANIMACAO_MS = 1200;

export function interpolar(
  de: { latitude: number; longitude: number },
  para: { latitude: number; longitude: number },
  progresso: number,
): { latitude: number; longitude: number } {
  const t = Math.min(1, Math.max(0, progresso));
  const suave = t * t * (3 - 2 * t);
  return {
    latitude: de.latitude + (para.latitude - de.latitude) * suave,
    longitude: de.longitude + (para.longitude - de.longitude) * suave,
  };
}

export function textoAtualizadoHa(iso: string, agoraMs: number): string {
  const instante = Date.parse(iso);
  if (!Number.isFinite(instante)) return 'atualização desconhecida';
  const segundos = Math.max(0, Math.floor((agoraMs - instante) / 1000));
  if (segundos < 5) return 'agora';
  if (segundos < 60) return `há ${segundos} s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas} h`;
}
