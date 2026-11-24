import { Injectable, computed, inject, signal } from '@angular/core';
import { RecursoService } from '../api/recurso.service';
import { AuthService } from '../auth/auth.service';
import { rotuloOpcao } from '../formularios/rotulos';
import type { Ocorrencia, Onibus, Perfil, Pessoa, Rota, Usuario } from '../models';
import { AvisosOperacao } from './avisos-operacao';

export interface ResultadoConsulta {
  recurso: string;
  id: number;
  titulo: string;
  detalhe: string;
  caminho: string;
}

export interface FontesConsulta {
  onibus: Onibus[];
  pessoas: Pessoa[];
  rotas: Rota[];
  ocorrencias: Ocorrencia[];
  usuarios: Usuario[];
}

interface FuncionalidadeConsulta {
  id: number;
  titulo: string;
  detalhe: string;
  caminho: string;
  termos: readonly string[];
  somenteAdmin?: boolean;
  perfis?: readonly Perfil[];
}

const VAZIO: FontesConsulta = { onibus: [], pessoas: [], rotas: [], ocorrencias: [], usuarios: [] };
const LIMITE = 8;

/** Telas e ações do sistema que a busca global também encontra. */
export const FUNCIONALIDADES: readonly FuncionalidadeConsulta[] = [
  {
    id: -1,
    titulo: 'Visão geral',
    detalhe: 'Painel do dia, frota e próximas saídas',
    caminho: '/dashboard',
    termos: ['visao geral', 'visão geral', 'dashboard', 'painel', 'inicio', 'início', 'home'],
  },
  {
    id: -2,
    titulo: 'Mapa da frota',
    detalhe: 'Acompanhar ônibus e rotas no mapa',
    caminho: '/mapa',
    termos: ['mapa', 'frota', 'rastreio', 'localizacao', 'localização', 'gps', 'acompanhar'],
  },
  {
    id: -3,
    titulo: 'Ônibus',
    detalhe: 'Cadastro e consulta da frota',
    caminho: '/onibus',
    termos: ['onibus', 'ônibus', 'veiculo', 'veículo', 'placa', 'frota'],
  },
  {
    id: -4,
    titulo: 'Pessoas',
    detalhe: 'Motoristas, estudantes e demais cadastros',
    caminho: '/pessoas',
    termos: ['pessoas', 'pessoa', 'motorista', 'estudante', 'aluno'],
  },
  {
    id: -5,
    titulo: 'Rotas',
    detalhe: 'Itinerários, horários e vias do percurso',
    caminho: '/rotas',
    termos: ['rotas', 'rota', 'itinerario', 'itinerário', 'trajeto', 'vias'],
  },
  {
    id: -6,
    titulo: 'Ocorrências',
    detalhe: 'Registros operacionais do dia',
    caminho: '/ocorrencias',
    termos: ['ocorrencias', 'ocorrências', 'ocorrencia', 'ocorrência', 'aviso', 'incidente'],
  },
  {
    id: -7,
    titulo: 'Compartilhar localização',
    detalhe: 'Transmitir a posição do ônibus',
    caminho: '/transmitir',
    termos: ['transmitir', 'compartilhar', 'localizacao', 'localização', 'gps', 'posicao', 'posição'],
    perfis: ['MOTORISTA', 'ADMINISTRADOR'],
  },
  {
    id: -8,
    titulo: 'Ususuários',
    detalhe: 'Contas de acesso ao sistema',
    caminho: '/usuarios',
    termos: ['usuarios', 'usuários', 'usuario', 'usuário', 'acesso', 'login', 'conta'],
    somenteAdmin: true,
  },
];

/** A busca da barra consulta funcionalidades e registros. A busca de cada página é independente. */
@Injectable({ providedIn: 'root' })
export class ConsultaGlobal {
  private readonly recursos = inject(RecursoService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosOperacao);

  readonly termo = signal('');
  readonly carregando = signal(false);
  private readonly fontes = signal<FontesConsulta | null>(null);
  private versaoCarregada = -1;

  readonly resultados = computed(() => {
    const termo = this.termo();
    const perfil = this.auth.perfil();
    const funcionalidades = consultarFuncionalidades(termo, perfil);
    const registros = consultarRegistros(this.fontes() ?? VAZIO, termo, this.auth.ehAdministrador());
    return [...funcionalidades, ...registros].slice(0, LIMITE);
  });

  definir(valor: string): void {
    this.termo.set(valor);
    if (valor.trim().length >= 2) void this.carregar();
  }

  limpar(): void {
    this.termo.set('');
  }

  private async carregar(): Promise<void> {
    const versao = this.avisos.versao();
    if (this.fontes() && this.versaoCarregada === versao) return;
    this.carregando.set(true);
    try {
      const incluirUsuarios = this.auth.ehAdministrador();
      const [onibus, pessoas, rotas, ocorrencias, usuarios] = await Promise.all([
        this.recursos.listar<Onibus>('onibus'),
        this.recursos.listar<Pessoa>('pessoas'),
        this.recursos.listar<Rota>('rotas'),
        this.recursos.listar<Ocorrencia>('ocorrencias'),
        incluirUsuarios ? this.recursos.listar<Usuario>('usuarios') : Promise.resolve([]),
      ]);
      this.fontes.set({ onibus, pessoas, rotas, ocorrencias, usuarios });
      this.versaoCarregada = versao;
    } catch {
      this.fontes.set(VAZIO);
    } finally {
      this.carregando.set(false);
    }
  }
}

export function consultarFuncionalidades(
  termo: string,
  perfil: Perfil | null,
): ResultadoConsulta[] {
  const consulta = termo.trim().toLocaleLowerCase('pt-BR');
  if (consulta.length < 2) return [];
  const admin = perfil === 'ADMINISTRADOR';
  return FUNCIONALIDADES.filter((item) => {
    if (item.somenteAdmin && !admin) return false;
    if (item.perfis && (!perfil || !item.perfis.includes(perfil))) return false;
    return item.termos.some((alias) => alias.includes(consulta) || consulta.includes(alias))
      || item.titulo.toLocaleLowerCase('pt-BR').includes(consulta)
      || item.detalhe.toLocaleLowerCase('pt-BR').includes(consulta);
  }).map((item) => ({
    recurso: 'Funcionalidade',
    id: item.id,
    titulo: item.titulo,
    detalhe: item.detalhe,
    caminho: item.caminho,
  }));
}

export function consultarRegistros(
  fontes: FontesConsulta,
  termo: string,
  incluirUsuarios: boolean,
): ResultadoConsulta[] {
  const consulta = termo.trim().toLocaleLowerCase('pt-BR');
  if (consulta.length < 2) return [];
  const cabe = (...textos: unknown[]) =>
    textos.some((texto) => String(texto ?? '').toLocaleLowerCase('pt-BR').includes(consulta));
  const resultados: ResultadoConsulta[] = [];

  for (const item of fontes.onibus) {
    if (!cabe(item.placa, item.modelo, item.ano)) continue;
    resultados.push({
      recurso: 'Ônibus',
      id: item.id,
      titulo: item.placa,
      detalhe: `${item.modelo} · ${item.ano}`,
      caminho: '/onibus',
    });
  }
  for (const item of fontes.pessoas) {
    if (!cabe(item.nome, item.cpf, item.matricula)) continue;
    resultados.push({
      recurso: 'Pessoa',
      id: item.id,
      titulo: item.nome,
      detalhe: rotuloOpcao(item.tipo),
      caminho: '/pessoas',
    });
  }
  for (const item of fontes.rotas) {
    if (!cabe(item.nome, item.origem, item.destino)) continue;
    resultados.push({
      recurso: 'Rota',
      id: item.id,
      titulo: item.nome,
      detalhe: `${item.origem} → ${item.destino}`,
      caminho: '/rotas',
    });
  }
  for (const item of fontes.ocorrencias) {
    if (!cabe(item.titulo, item.descricao)) continue;
    resultados.push({
      recurso: 'Ocorrência',
      id: item.id,
      titulo: item.titulo,
      detalhe: item.descricao,
      caminho: '/ocorrencias',
    });
  }
  if (incluirUsuarios) {
    for (const item of fontes.usuarios) {
      if (!cabe(item.usuario, item.perfil)) continue;
      resultados.push({
        recurso: 'Usuário',
        id: item.id,
        titulo: item.usuario,
        detalhe: rotuloOpcao(item.perfil),
        caminho: '/usuarios',
      });
    }
  }

  return resultados;
}
