import { Injectable, computed, inject, signal } from '@angular/core';
import { RecursoService } from '../api/recurso.service';
import { AuthService } from '../auth/auth.service';
import { rotuloOpcao } from '../formularios/rotulos';
import type { Ocorrencia, Onibus, Pessoa, Rota, Usuario } from '../models';
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

const VAZIO: FontesConsulta = { onibus: [], pessoas: [], rotas: [], ocorrencias: [], usuarios: [] };
const LIMITE = 8;

/** A busca da barra consulta todas as listas. A busca de cada página é independente. */
@Injectable({ providedIn: 'root' })
export class ConsultaGlobal {
  private readonly recursos = inject(RecursoService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosOperacao);

  readonly termo = signal('');
  readonly carregando = signal(false);
  private readonly fontes = signal<FontesConsulta | null>(null);
  private versaoCarregada = -1;

  readonly resultados = computed(() =>
    consultarRegistros(this.fontes() ?? VAZIO, this.termo(), this.auth.ehAdministrador()),
  );

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

  return resultados.slice(0, LIMITE);
}
