import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { normalizarParadas } from '../../domain/parada.js';
import {
  distanciaMetros,
  duracaoDeOnibus,
  trajetoEmLinhaReta,
  type PontoTrajeto,
  type TrajetoCalculado,
} from '../../domain/trajeto.js';

const AGENTE = 'ViaFacil/1.0 (transporte escolar)';

interface Lugar {
  lat: string;
  lon: string;
  display_name: string;
}

interface LugarReverso {
  display_name?: string;
  lat?: string;
  lon?: string;
}

interface RespostaOsrm {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

/**
 * Localiza origem e destino e pede o caminho pelas ruas.
 * O resultado fica em memória para não repetir a mesma consulta.
 */
@Injectable()
export class ConsultarTrajetoService {
  private readonly lugares = new Map<string, PontoTrajeto>();
  private readonly listas = new Map<string, PontoTrajeto[]>();
  private ultimaConsulta = 0;

  /** Liga coordenadas já conhecidas pelas ruas, sem geocodificar nomes. */
  async executarPorPontos(pontos: PontoTrajeto[]): Promise<TrajetoCalculado> {
    if (pontos.length < 2) {
      throw new BadRequestException('Informe ao menos dois pontos para traçar a rota.');
    }
    return (await this.pelaVia(pontos)) ?? trajetoEmLinhaReta(pontos[0], pontos[pontos.length - 1], pontos.slice(1, -1));
  }

  async executar(origem: string, destino: string, paradas: unknown = []): Promise<TrajetoCalculado> {
    const partida = await this.localizar(origem);
    const chegada = await this.localizar(destino);
    if (!partida || !chegada) {
      throw new NotFoundException(`Não foi possível localizar ${partida ? destino : origem} no mapa.`);
    }
    const ida = normalizarParadas(paradas).filter((parada) => parada.sentido !== 'VOLTA');
    const pontos = [partida, ...ida, chegada];
    return (await this.pelaVia(pontos)) ?? trajetoEmLinhaReta(partida, chegada, pontos.slice(1, -1));
  }

  async buscar(consulta: string): Promise<PontoTrajeto[]> {
    const chave = `busca:${consulta.trim().toLocaleLowerCase('pt-BR')}`;
    const guardado = this.listas.get(chave);
    if (guardado) return guardado;

    await this.aguardar();
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', consulta.trim());
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'br');
    const resposta = await fetch(url, { headers: { 'User-Agent': AGENTE, Accept: 'application/json' } });
    if (!resposta.ok) return [];
    const lista = (await resposta.json()) as Lugar[];
    const pontos = lista.flatMap((lugar) => {
      const ponto = this.paraPonto(consulta.trim(), lugar);
      return ponto ? [ponto] : [];
    });
    this.listas.set(chave, pontos);
    return pontos;
  }

  async reverso(latitude: number, longitude: number): Promise<PontoTrajeto> {
    await this.aguardar();
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'jsonv2');
    const resposta = await fetch(url, { headers: { 'User-Agent': AGENTE, Accept: 'application/json' } });
    const lugar = resposta.ok ? ((await resposta.json()) as LugarReverso) : null;
    const nome = lugar?.display_name?.split(',').slice(0, 2).join(',').trim();
    return {
      nome: nome || 'Parada no mapa',
      latitude,
      longitude,
    };
  }

  private async localizar(consulta: string): Promise<PontoTrajeto | null> {
    const chave = consulta.trim().toLocaleLowerCase('pt-BR');
    const guardado = this.lugares.get(chave);
    if (guardado) return guardado;

    await this.aguardar();
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', consulta);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'br');
    const resposta = await fetch(url, { headers: { 'User-Agent': AGENTE, Accept: 'application/json' } });
    if (!resposta.ok) return null;
    const lista = (await resposta.json()) as Lugar[];
    const lugar = lista[0];
    if (!lugar) return null;
    const ponto = this.paraPonto(consulta.trim(), lugar);
    if (!ponto) return null;
    const marcado = { ...ponto, nome: consulta.trim() };
    this.lugares.set(chave, marcado);
    return marcado;
  }

  private paraPonto(nome: string, lugar: Lugar): PontoTrajeto | null {
    const latitude = Number(lugar.lat);
    const longitude = Number(lugar.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { nome: lugar.display_name || nome, latitude, longitude };
  }

  private async pelaVia(pontos: PontoTrajeto[]): Promise<TrajetoCalculado | null> {
    const inteiro = await this.consultarOsrm(pontos);
    if (inteiro) return this.montarVia(pontos, inteiro.linha, inteiro.distanciaMetros, inteiro.duracaoSegundos);

    // Trecho a trecho quando o roteador não aceita a sequência completa.
    if (pontos.length < 3) return null;
    const linha: { latitude: number; longitude: number }[] = [];
    let distancia = 0;
    let duracao = 0;
    for (let indice = 1; indice < pontos.length; indice += 1) {
      const trecho = await this.consultarOsrm([pontos[indice - 1], pontos[indice]]);
      if (!trecho) return null;
      if (linha.length > 0) linha.pop();
      linha.push(...trecho.linha);
      distancia += trecho.distanciaMetros;
      duracao += trecho.duracaoSegundos;
    }
    if (linha.length < 2) return null;
    return this.montarVia(pontos, linha, distancia, duracao);
  }

  private async consultarOsrm(
    pontos: PontoTrajeto[],
  ): Promise<{ linha: { latitude: number; longitude: number }[]; distanciaMetros: number; duracaoSegundos: number } | null> {
    const caminho = pontos.map((ponto) => `${ponto.longitude},${ponto.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${caminho}?overview=full&geometries=geojson`;
    try {
      const resposta = await fetch(url, { headers: { 'User-Agent': AGENTE, Accept: 'application/json' } });
      if (!resposta.ok) return null;
      const corpo = (await resposta.json()) as RespostaOsrm;
      const rota = corpo.routes?.[0];
      if (!rota || rota.geometry.coordinates.length < 2) return null;
      return {
        linha: rota.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
        distanciaMetros: Math.round(rota.distance),
        duracaoSegundos: duracaoDeOnibus(rota.duration),
      };
    } catch {
      return null;
    }
  }

  private montarVia(
    pontos: PontoTrajeto[],
    linha: { latitude: number; longitude: number }[],
    distanciaMetros: number,
    duracaoSegundos: number,
  ): TrajetoCalculado {
    return {
      origem: pontos[0],
      destino: pontos[pontos.length - 1],
      paradas: pontos.slice(1, -1),
      linha,
      distanciaMetros: distanciaMetros || distanciaMetrosDeLinha(pontos),
      duracaoSegundos,
      fonte: 'via',
    };
  }

  /** O Nominatim pede no máximo uma consulta por segundo. */
  private async aguardar(): Promise<void> {
    const espera = 1100 - (Date.now() - this.ultimaConsulta);
    if (espera > 0) await new Promise((resolver) => setTimeout(resolver, espera));
    this.ultimaConsulta = Date.now();
  }
}

function distanciaMetrosDeLinha(pontos: readonly PontoTrajeto[]): number {
  let total = 0;
  for (let indice = 1; indice < pontos.length; indice += 1) {
    total += distanciaMetros(pontos[indice - 1], pontos[indice]);
  }
  return total;
}
