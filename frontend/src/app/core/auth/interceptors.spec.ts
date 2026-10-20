import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { erroInterceptor } from './erro.interceptor';

describe('interceptors de autenticação', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);

    const sessao = auth.iniciarSessao('meu-token');
    httpMock
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ sub: 1, usuario: 'admin', perfil: 'ADMINISTRADOR' });
    await sessao;
  });

  afterEach(() => httpMock.verify());

  it('envia o token para a API', () => {
    void firstValueFrom(http.get(`${environment.apiUrl}/onibus`));
    const req = httpMock.expectOne(`${environment.apiUrl}/onibus`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush([]);
  });

  it('não envia o token para outros domínios', () => {
    void firstValueFrom(http.get('https://fonts.googleapis.com/css2'));
    const req = httpMock.expectOne('https://fonts.googleapis.com/css2');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush('');
  });

  it('encerra a sessão e volta ao login quando a API responde 401', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const requisicao = firstValueFrom(http.get(`${environment.apiUrl}/rotas`));
    httpMock
      .expectOne(`${environment.apiUrl}/rotas`)
      .flush({ message: 'Token expirado' }, { status: 401, statusText: '' });
    await expect(requisicao).rejects.toBeTruthy();

    expect(auth.autenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('não derruba a sessão no 401 do próprio login', async () => {
    const requisicao = firstValueFrom(http.post(`${environment.apiUrl}/auth/login`, {}));
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ message: 'Usuário ou senha inválidos' }, { status: 401, statusText: '' });
    await expect(requisicao).rejects.toBeTruthy();

    expect(auth.autenticado()).toBe(true);
  });
});
