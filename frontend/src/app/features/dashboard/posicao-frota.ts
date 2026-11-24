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
  placa: string;
  modelo: string;
  rota: string;
  motorista: string;
  atualizadoEm: string;
  latitude: number;
  longitude: number;
  desatualizada: boolean;
}

/** Só entra no mapa quem ainda está enviando a localização. */
export function paraVeiculos(posicoes: readonly PosicaoFrota[]): VeiculoMapa[] {
  return posicoes
    .filter((posicao) => !posicao.desatualizada)
    .map((posicao) => ({
      id: posicao.onibusId,
      onibus: posicao.modelo ? `${posicao.modelo} · ${posicao.placa}` : posicao.placa,
      placa: posicao.placa,
      modelo: posicao.modelo ?? '',
      rota: posicao.rota ?? 'Sem rota ativa',
      motorista: posicao.motorista ?? 'Sem motorista na rota',
      atualizadoEm: posicao.atualizadoEm,
      latitude: posicao.latitude,
      longitude: posicao.longitude,
      desatualizada: false,
    }));
}

const ICONE_ONIBUS =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
  '<rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="#102033" stroke-width="1.8"/>' +
  '<path d="M3 10h18M7 4v6M12 4v6M17 4v6" fill="none" stroke="#102033" stroke-width="1.8"/>' +
  '<circle cx="7.5" cy="18.5" r="1.6" fill="#e7a11a"/>' +
  '<circle cx="16.5" cy="18.5" r="1.6" fill="#e7a11a"/>' +
  '</svg>';

/** Cartão curto da rota e do motorista. Aberto, inclui placa e modelo. */
export function fichaDoVeiculo(veiculo: VeiculoMapa, aberta = false): string {
  const extras = aberta
    ? `<span class="ficha-extra"><span>Placa ${escapar(veiculo.placa)}</span><span>Modelo ${escapar(veiculo.modelo || '—')}</span></span>`
    : '';
  return (
    `<button type="button" class="ficha-onibus" data-onibus="${veiculo.id}" aria-expanded="${aberta}">` +
    '<span class="ficha-texto">' +
    `<span class="ficha-rota">${escapar(veiculo.rota)}</span>` +
    `<span class="ficha-motorista">${escapar(veiculo.motorista)}</span>` +
    extras +
    '</span>' +
    `<span class="ficha-icone">${ICONE_ONIBUS}</span>` +
    '</button>'
  );
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (caractere) => {
    const mapa: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return mapa[caractere];
  });
}
