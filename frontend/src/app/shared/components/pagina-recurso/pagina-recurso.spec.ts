import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import type { ConfigRecurso } from '../../../core/state/config-recurso';
import { PaginaRecurso } from './pagina-recurso';

const config: ConfigRecurso = {
  recurso: 'onibus',
  titulo: 'Gestão de ônibus',
  descricao: 'Frota',
  rotuloNovo: 'Cadastrar ônibus',
  buscarEm: ['placa'],
};

describe('PaginaRecurso', () => {
  let fixture: ComponentFixture<PaginaRecurso>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PaginaRecurso);
  });

  afterEach(() => {
    http.match(() => true).forEach((requisicao) => requisicao.flush([]));
    http.verify();
  });

  it('busca a lista só depois que a configuração da página existe', async () => {
    const api = `${environment.apiUrl}/onibus`;
    http.expectNone(api);

    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();

    const pendentes = http.match(() => true);
    const lista = pendentes.find((requisicao) => requisicao.request.url === api);
    expect(lista).toBeTruthy();
    lista?.flush([{ id: 1, placa: 'ABC1D23', modelo: 'Torino', ano: 2020, capacidade: 44 }]);
    const formulario = {
      recurso: 'onibus',
      acao: 'criar',
      metodo: 'POST',
      caminho: '/onibus',
      perfis: [],
      campos: [{ nome: 'placa', rotulo: 'Placa', tipo: 'texto', obrigatorio: true }],
    };
    pendentes
      .filter((requisicao) => requisicao !== lista)
      .forEach((requisicao) => requisicao.flush(formulario));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ABC1D23');
  });
});