import type { Ocorrencia, Onibus, Pessoa, Rota } from '../core/models';

const MINUTO = 60_000;
const DIA = 24 * 60 * MINUTO;

export interface Saida {
  rotaId: number;
  rota: string;
  horario: string;
  trecho: 'Ida' | 'Volta';
  minutos: number;
  status: 'Em breve' | 'Aguardando' | 'Saiu';
  onibusId: number;
  motoristaId: number;
}

export interface VeiculoOperacao {
  onibusId: number;
  nome: string;
  placa: string;
  rota: string;
  motorista: string;
}

export interface DadosOperacao {
  onibus: Onibus[];
  rotas: Rota[];
  ocorrencias: Ocorrencia[];
  pessoas: Pessoa[];
}

export interface PainelOperacao {
  frotaEmOperacao: number;
  frotaTotal: number;
  rotasAtivas: number;
  rotasProximas2h: number;
  capacidade: number;
  ocorrencias24h: number;
  saidas: Saida[];
  veiculos: VeiculoOperacao[];
}

export function ocorrenciasRecentes(lista: readonly Ocorrencia[], agora = Date.now()): Ocorrencia[] {
  return lista
    .filter((item) => agora - new Date(item.dataHora).getTime() <= DIA)
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
}

export function montarPainel(dados: DadosOperacao, agora = new Date()): PainelOperacao {
  const ativas = dados.rotas.filter((rota) => rota.ativo);
  const idsEmOperacao = new Set(ativas.map((rota) => rota.onibusId));
  const saidas = proximasSaidas(ativas, agora);
  const pessoas = new Map(dados.pessoas.map((pessoa) => [pessoa.id, pessoa.nome]));
  const frota = new Map(dados.onibus.map((onibus) => [onibus.id, onibus]));

  return {
    frotaEmOperacao: dados.onibus.filter((onibus) => idsEmOperacao.has(onibus.id)).length,
    frotaTotal: dados.onibus.length,
    rotasAtivas: ativas.length,
    rotasProximas2h: saidas.filter((saida) => saida.minutos >= 0 && saida.minutos <= 120).length,
    capacidade: dados.onibus.reduce((total, onibus) => total + onibus.capacidade, 0),
    ocorrencias24h: ocorrenciasRecentes(dados.ocorrencias, agora.getTime()).length,
    saidas,
    veiculos: ativas.map((rota) => {
      const onibus = frota.get(rota.onibusId);
      return {
        onibusId: rota.onibusId,
        nome: onibus?.modelo ?? `Ônibus #${rota.onibusId}`,
        placa: onibus?.placa ?? '—',
        rota: rota.nome,
        motorista: pessoas.get(rota.motoristaId) ?? `Pessoa #${rota.motoristaId}`,
      };
    }),
  };
}

export function textoRestante(minutos: number): string {
  if (minutos === 0) return 'agora';
  const passado = minutos < 0;
  const absoluto = Math.abs(minutos);
  const horas = Math.floor(absoluto / 60);
  const resto = absoluto % 60;
  const duracao = horas > 0 ? `${horas} h ${resto} min` : `${resto} min`;
  return passado ? `há ${duracao}` : `em ${duracao}`;
}

function proximasSaidas(rotas: readonly Rota[], agora: Date): Saida[] {
  return rotas
    .map((rota) => {
      const opcoes = [
        trecho(rota, 'Ida', rota.horarioSaidaIda, agora),
        trecho(rota, 'Volta', rota.horarioSaidaVolta, agora),
      ];
      const futuras = opcoes.filter((opcao) => opcao.minutos >= 0);
      const escolhida = (futuras.length ? futuras : opcoes).sort((a, b) =>
        futuras.length ? a.minutos - b.minutos : b.minutos - a.minutos,
      )[0];
      return { ...escolhida, rotaId: rota.id, rota: rota.nome, onibusId: rota.onibusId, motoristaId: rota.motoristaId };
    })
    .sort((a, b) => {
      if (a.minutos >= 0 && b.minutos < 0) return -1;
      if (a.minutos < 0 && b.minutos >= 0) return 1;
      return a.minutos >= 0 ? a.minutos - b.minutos : b.minutos - a.minutos;
    });
}

function trecho(rota: Rota, nome: 'Ida' | 'Volta', horario: string, agora: Date) {
  const minutos = minutosAte(horario, agora);
  return { trecho: nome, horario, minutos, status: statusDaSaida(minutos), rota };
}

function minutosAte(horario: string, agora: Date): number {
  const [hora, minuto] = horario.split(':').map(Number);
  const alvo = new Date(agora);
  alvo.setHours(hora, minuto, 0, 0);
  return Math.round((alvo.getTime() - agora.getTime()) / MINUTO);
}

function statusDaSaida(minutos: number): Saida['status'] {
  if (minutos < 0) return 'Saiu';
  if (minutos <= 30) return 'Em breve';
  return 'Aguardando';
}
