import type { Onibus } from '../../core/models/onibus.model';
import type { Rota } from '../../core/models/rota.model';

export interface OnibusNoMapa {
  id: number;
  placa: string;
  modelo: string;
  rotas: readonly Rota[];
}

export interface PontoRota {
  nome: string;
  latitude: number;
  longitude: number;
}

export interface TrajetoRota {
  rotaId: number;
  nome: string;
  origem: PontoRota;
  destino: PontoRota;
  paradas: readonly PontoRota[];
  linha: readonly PontoRota[];
  distanciaMetros: number;
  duracaoSegundos: number;
  fonte: 'via' | 'reta';
}

export function juntarFrota(onibus: readonly Onibus[], rotas: readonly Rota[]): OnibusNoMapa[] {
  return onibus.map((veiculo) => ({
    id: veiculo.id,
    placa: veiculo.placa,
    modelo: veiculo.modelo,
    rotas: rotas.filter((rota) => rota.onibusId === veiculo.id && rota.ativo),
  }));
}

export function filtrarFrota(frota: readonly OnibusNoMapa[], termo: string): OnibusNoMapa[] {
  const consulta = termo.trim().toLocaleLowerCase('pt-BR');
  if (!consulta) return [...frota];
  return frota.filter((veiculo) => {
    const textos = [
      veiculo.placa,
      veiculo.modelo,
      ...veiculo.rotas.flatMap((rota) => [
        rota.nome,
        rota.origem,
        rota.destino,
        ...(rota.paradas ?? []).map((parada) => parada.nome),
      ]),
    ];
    return textos.some((texto) => texto.toLocaleLowerCase('pt-BR').includes(consulta));
  });
}

export function formatarDuracao(segundos: number): string {
  const minutos = Math.max(1, Math.round(segundos / 60));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${minutos} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export function descreverEstimativa(trajeto: Pick<TrajetoRota, 'duracaoSegundos' | 'distanciaMetros' | 'fonte'>): string {
  const tempo = formatarDuracao(trajeto.duracaoSegundos);
  const distancia = formatarDistancia(trajeto.distanciaMetros);
  const modo = trajeto.fonte === 'via' ? 'pelas vias' : 'em linha reta';
  return `${tempo} · ${distancia}, ${modo}`;
}
