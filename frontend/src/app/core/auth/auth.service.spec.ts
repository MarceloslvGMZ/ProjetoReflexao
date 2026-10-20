import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { UsuarioLogado } from '../models';
import { AuthService } from './auth.service';

const URL_ME = `${environment.apiUrl}/auth/me`;
const ADMIN: UsuarioLogado = { sub: 1, usuario: 'admin', perfil: 'ADMINISTRADOR' };

function jwtCom(exp: number): string {
  return `cabecalho.${btoa(JSON.stringify({ sub: 1, exp }))}.assinatura`;
}

describe('AuthService', () => {
  let http: HttpTestingController;

  function criarServico(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('inicia a sessão salvando o token e carregando o usuário logado', async () => {
    const auth = criarServico();

    const sessao = auth.iniciarSessao('token-novo');
    http.expectOne(URL_ME).flush(ADMIN);
    await sessao;

    expect(auth.autenticado()).toBe(true);
    expect(auth.ehAdministrador()).toBe(true);
    expect(localStorage.getItem('viafacil.token')).toBe('token-novo');
  });

  it('restaura a sessão de um token salvo e válido', async () => {
    localStorage.setItem('viafacil.token', jwtCom(Date.now() / 1000 + 3600));
    const auth = criarServico();

    const restauracao = auth.restaurarSessao();
    http.expectOne(URL_ME).flush(ADMIN);
    await restauracao;

    expect(auth.usuario()).toEqual(ADMIN);
  });

  it('descarta um token vencido sem consultar a API', async () => {
    localStorage.setItem('viafacil.token', jwtCom(Date.now() / 1000 - 60));
    const auth = criarServico();

    await auth.restaurarSessao();

    http.expectNone(URL_ME);
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem('viafacil.token')).toBeNull();
  });

  it('descarta o token quando a API o rejeita', async () => {
    localStorage.setItem('viafacil.token', jwtCom(Date.now() / 1000 + 3600));
    const auth = criarServico();

    const restauracao = auth.restaurarSessao();
    http.expectOne(URL_ME).flush({ message: 'Token inválido' }, { status: 401, statusText: '' });
    await restauracao;

    expect(auth.autenticado()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('verifica perfis seguindo a regra de `GET /formularios`', async () => {
    const auth = criarServico();
    expect(auth.possuiPerfil([])).toBe(false);

    const sessao = auth.iniciarSessao('token');
    http.expectOne(URL_ME).flush({ ...ADMIN, perfil: 'MOTORISTA' });
    await sessao;

    expect(auth.possuiPerfil([])).toBe(true);
    expect(auth.possuiPerfil(['ADMINISTRADOR'])).toBe(false);
    expect(auth.possuiPerfil(['MOTORISTA', 'ADMINISTRADOR'])).toBe(true);
  });
});
