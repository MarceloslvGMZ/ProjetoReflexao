import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api/api.service';
import type { Perfil, UsuarioLogado } from '../models';

const CHAVE_TOKEN = 'viafacil.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(lerTokenSalvo());
  private readonly _usuario = signal<UsuarioLogado | null>(null);

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly perfil = computed(() => this._usuario()?.perfil ?? null);
  readonly ehAdministrador = computed(() => this.perfil() === 'ADMINISTRADOR');

  /** Executado na inicialização da aplicação para validar o token salvo. */
  async restaurarSessao(): Promise<void> {
    const token = this._token();
    if (!token) return;
    if (tokenExpirado(token)) {
      this.limpar();
      return;
    }
    try {
      this._usuario.set(await this.api.get<UsuarioLogado>('/auth/me'));
    } catch {
      this.limpar();
    }
  }

  /** Recebe o `accessToken` devolvido por `POST /auth/login`. */
  async iniciarSessao(accessToken: string): Promise<void> {
    this._token.set(accessToken);
    localStorage.setItem(CHAVE_TOKEN, accessToken);
    try {
      this._usuario.set(await this.api.get<UsuarioLogado>('/auth/me'));
    } catch (erro) {
      this.limpar();
      throw erro;
    }
  }

  /** Lista vazia de perfis significa "qualquer usuário logado" (mesma regra de `GET /formularios`). */
  possuiPerfil(perfis: readonly Perfil[]): boolean {
    const perfil = this.perfil();
    if (perfil === null) return false;
    return perfis.length === 0 || perfis.includes(perfil);
  }

  sair(): void {
    this.limpar();
    void this.router.navigate(['/login']);
  }

  encerrarSessaoExpirada(urlAtual: string): void {
    this.limpar();
    const retorno = urlAtual.startsWith('/login') ? undefined : urlAtual;
    void this.router.navigate(['/login'], { queryParams: { retorno } });
  }

  private limpar(): void {
    this._token.set(null);
    this._usuario.set(null);
    localStorage.removeItem(CHAVE_TOKEN);
  }
}

function lerTokenSalvo(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

/** Lê o `exp` do JWT apenas para evitar uma requisição com token já vencido; quem valida é o backend. */
function tokenExpirado(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
