import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { RecursoService } from '../api/recurso.service';
import { ReferenciasService } from '../formularios/referencias.service';
import { AvisosOperacao } from '../layout/avisos-operacao';
import { ToastService } from '../../shared/components/toast/toast.service';
import type { ConfigRecurso } from './config-recurso';
import { RecursoStore } from './recurso.store';

const config: ConfigRecurso = {
  recurso: 'onibus',
  titulo: 'Ônibus',
  descricao: '',
  rotuloNovo: 'Novo',
  buscarEm: ['placa'],
};

describe('RecursoStore', () => {
  let http: HttpTestingController;
  let store: RecursoStore;
  const termo = signal('');
  const registroId = signal<number | null>(null);

  beforeEach(() => {
    termo.set('');
    registroId.set(null);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    store = new RecursoStore(
      TestBed.inject(RecursoService),
      TestBed.inject(ToastService),
      TestBed.inject(ReferenciasService),
      TestBed.inject(AvisosOperacao),
      termo,
      registroId,
      () => config,
    );
  });

  afterEach(() => http.verify());

  it('carrega a lista e filtra pela busca', async () => {
    const carga = store.carregar();
    http.expectOne(`${environment.apiUrl}/onibus`).flush([
      { id: 1, placa: 'ABC1D23' },
      { id: 2, placa: 'XYZ9A87' },
    ]);
    await carga;

    expect(store.itens()).toHaveLength(2);
    termo.set('xyz');
    expect(store.filtrados().map((item) => item['id'])).toEqual([2]);
    registroId.set(1);
    termo.set('');
    expect(store.filtrados().map((item) => item['id'])).toEqual([1]);
  });

  it('exclui e recarrega a lista', async () => {
    store.pedirExclusao({ id: 4, placa: 'ABC1D23' });
    const exclusao = store.confirmarExclusao();
    http.expectOne({ method: 'DELETE', url: `${environment.apiUrl}/onibus/4` }).flush(null);
    const lista = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/onibus`));
    lista.flush([]);
    await exclusao;

    expect(store.confirmando()).toBeNull();
    expect(store.itens()).toEqual([]);
    expect(TestBed.inject(ToastService).itens()[0]?.texto).toBe('Registro excluído.');
  });
});
