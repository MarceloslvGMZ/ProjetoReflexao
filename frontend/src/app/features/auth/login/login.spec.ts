import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { destinoAposLogin, Login } from './login';

describe('destinoAposLogin', () => {
  it('volta para a página pedida quando o caminho é interno', () => {
    expect(destinoAposLogin('/onibus')).toBe('/onibus');
    expect(destinoAposLogin('/ocorrencias?rotaId=1')).toBe('/ocorrencias?rotaId=1');
  });

  it('ignora destinos externos ou a própria tela de login', () => {
    expect(destinoAposLogin(null)).toBe('/dashboard');
    expect(destinoAposLogin('https://exemplo.com')).toBe('/dashboard');
    expect(destinoAposLogin('//exemplo.com')).toBe('/dashboard');
    expect(destinoAposLogin('/login')).toBe('/dashboard');
  });
});

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
  });

  afterEach(() => http.verify());

  it('entra com usuário e senha e segue para a visão geral', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const elemento = fixture.nativeElement as HTMLElement;

    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/formularios/auth/entrar`))).flush({
      recurso: 'auth',
      acao: 'entrar',
      metodo: 'POST',
      caminho: '/auth/login',
      perfis: [],
      campos: [
        { nome: 'usuario', rotulo: 'Usuário', tipo: 'texto', obrigatorio: true },
        { nome: 'senha', rotulo: 'Senha', tipo: 'senha', obrigatorio: true },
      ],
    });
    await fixture.whenStable();

    const usuario = elemento.querySelector<HTMLInputElement>('#formulario-1-usuario, [id$="-usuario"]');
    const senha = elemento.querySelector<HTMLInputElement>('[id$="-senha"]');
    expect(elemento.textContent).toContain('não é feito por e-mail');
    expect(usuario).not.toBeNull();
    usuario!.value = 'admin';
    usuario!.dispatchEvent(new Event('input'));
    senha!.value = 'GpsTransporte1234$';
    senha!.dispatchEvent(new Event('input'));
    elemento.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const login = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/auth/login`));
    expect(login.request.body).toEqual({ usuario: 'admin', senha: 'GpsTransporte1234$' });
    login.flush({ accessToken: 'token-da-sessao' });
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/auth/me`))).flush({
      sub: 1,
      usuario: 'admin',
      perfil: 'ADMINISTRADOR',
    });

    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith('/dashboard'));
  });
});
