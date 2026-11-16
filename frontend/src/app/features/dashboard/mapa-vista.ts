const CHAVE = 'viafacil.mapa';

export interface VistaMapa {
  latitude: number;
  longitude: number;
  zoom: number;
}

export function lerVistaMapa(): VistaMapa | null {
  try {
    const texto = localStorage.getItem(CHAVE);
    if (!texto) return null;
    const vista = JSON.parse(texto) as VistaMapa;
    if (!Number.isFinite(vista.latitude) || !Number.isFinite(vista.longitude) || !Number.isFinite(vista.zoom)) {
      return null;
    }
    return vista;
  } catch {
    return null;
  }
}

export function gravarVistaMapa(vista: VistaMapa): void {
  localStorage.setItem(CHAVE, JSON.stringify(vista));
}
