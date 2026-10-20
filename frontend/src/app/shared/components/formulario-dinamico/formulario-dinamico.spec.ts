import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { PESSOA_ATUALIZAR, PESSOA_CRIAR } from '../../../../testing/descricoes';
import { FormularioDinamico } from './formulario-dinamico';

const api = (caminho: string) => `${environment.apiUrl}${caminho}`;

describe('FormularioDinamico', () => {
  let fixture: ComponentFixture<FormularioDinamico>;
  let http: HttpTestingController;
  let elemento: HTMLElement;

  async function criar(entradas: Record<string, unknown>, descricao = PESSOA_CRIAR) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FormularioDinamico);
    elemento = fixture.nativeElement as HTMLElement;
    for (const [nome, valor] of Object.entries(entradas)) fixture.componentRef.setInput(nome, valor);

    const url = api(`/formularios/${descricao.recurso}/${descricao.acao}`);
    const requisicao = await vi.waitFor(() => http.expectOne(url));
    requisicao.flush(descricao);
    await fixture.whenStable();
  }

  function campo<T extends HTMLElement = HTMLInputElement>(rotulo: string): T | null {
    const label = [...elemento.querySelectorAll('label')].find((l) =>
      l.textContent?.trim().startsWith(rotulo),
    );
    return label ? elemento.querySelector<T>(`#${label.htmlFor}`) : null;
  }

  function digitar(rotulo: string, valor: string) {
    const input = campo(rotulo)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function selecionar(rotulo: string, indice: number) {
    const select = campo<HTMLSelectElement>(rotulo)!;
    select.value = select.options[indice].value;
    select.dispatchEvent(new Event('change'));
  }

  async function enviar() {
    elemento.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
  }

  afterEach(() => http.verify());

  it('monta os campos descritos pela API e mostra a matrícula só para estudantes', async () => {
    await criar({ recurso: 'pessoas', acao: 'criar' });

    expect(campo('Nome')).not.toBeNull();
    expect(campo('CPF')?.placeholder).toBe('Ex.: 529.982.247-25');
    expect(campo('Matrícula')).toBeNull();

    selecionar('Tipo', 2);
    await fixture.whenStable();
    expect(campo('Matrícula')).not.toBeNull();

    selecionar('Tipo', 1);
    await fixture.whenStable();
    expect(campo('Matrícula')).toBeNull();
  });

  it('não envia e mostra as validações quando há campos obrigatórios vazios', async () => {
    await criar({ recurso: 'pessoas', acao: 'criar' });

    await enviar();

    http.expectNone(api('/pessoas'));
    const erros = [...elemento.querySelectorAll('[role="alert"]')].map((e) => e.textContent?.trim());
    expect(erros).toEqual(['Campo obrigatório.', 'Campo obrigatório.', 'Campo obrigatório.']);
    expect(campo('Nome')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('envia para o método e caminho descritos e emite `salvo`', async () => {
    await criar({ recurso: 'pessoas', acao: 'criar' });
    const salvo = vi.fn();
    fixture.componentInstance.salvo.subscribe(salvo);

    digitar('Nome', 'Ana Souza');
    digitar('CPF', '529.982.247-25');
    selecionar('Tipo', 2);
    await fixture.whenStable();
    digitar('Matrícula', '2024001');
    await enviar();

    const requisicao = http.expectOne(api('/pessoas'));
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({
      nome: 'Ana Souza',
      cpf: '529.982.247-25',
      tipo: 'ESTUDANTE',
      matricula: '2024001',
    });
    requisicao.flush({ id: 1 });

    await vi.waitFor(() => expect(salvo).toHaveBeenCalledWith({ id: 1 }));
  });

  it('exibe os erros da API no campo correspondente ou no topo do formulário', async () => {
    await criar({ recurso: 'pessoas', acao: 'criar' });
    digitar('Nome', 'Ana');
    digitar('CPF', '111');
    selecionar('Tipo', 1);
    await enviar();

    http
      .expectOne(api('/pessoas'))
      .flush(
        { message: ['CPF inválido', 'Já existe uma pessoa com esse CPF'] },
        { status: 400, statusText: '' },
      );

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(campo('CPF')?.getAttribute('aria-invalid')).toBe('true');
    });
    expect(elemento.querySelector('[data-erros-gerais]')?.textContent).toContain(
      'Já existe uma pessoa com esse CPF',
    );
  });

  it('em edição, busca o registro, bloqueia os somente leitura e envia via PUT com o id', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FormularioDinamico);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('recurso', 'pessoas');
    fixture.componentRef.setInput('acao', 'atualizar');
    fixture.componentRef.setInput('id', 7);
    fixture.componentRef.setInput('somenteLeitura', ['tipo']);

    (await vi.waitFor(() => http.expectOne(api('/formularios/pessoas/atualizar')))).flush(
      PESSOA_ATUALIZAR,
    );
    http
      .expectOne(api('/pessoas/7'))
      .flush({ id: 7, nome: 'Rui', cpf: '52998224725', tipo: 'MOTORISTA', matricula: null });
    await fixture.whenStable();

    expect(campo('Nome')?.value).toBe('Rui');
    expect(campo<HTMLSelectElement>('Tipo')?.disabled).toBe(true);

    digitar('Nome', 'Rui Lima');
    await enviar();

    const requisicao = http.expectOne(api('/pessoas/7'));
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual({
      nome: 'Rui Lima',
      cpf: '52998224725',
      tipo: 'MOTORISTA',
    });
    requisicao.flush({});
  });
});
