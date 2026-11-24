import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PosicoesRealtimeService } from '../../core/realtime/posicoes-realtime.service';
import { Transmitir } from './transmitir';

const onibus = [{ id: 3, placa: 'ABC1D23', modelo: 'Torino', ano: 2020, capacidade: 44 }];

describe('Transmitir', () => {
  let fixture: ComponentFixture<Transmitir>;
  let http: HttpTestingController;
  let elemento: HTMLElement;
  let clearWatch: ReturnType<typeof vi.fn>;
  let tempoReal: {
    conectar: ReturnType<typeof vi.fn>;
    enviarPosicao: ReturnType<typeof vi.fn>;
    encerrarPosicao: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    clearWatch = vi.fn();
    tempoReal = {
      conectar: vi.fn(),
      enviarPosicao: vi.fn().mockResolvedValue(false),
      encerrarPosicao: vi.fn().mockResolvedValue(false),
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: (sucesso: PositionCallback) => {
          sucesso({ coords: { latitude: -23.5, longitude: -46.6 } } as GeolocationPosition);
          return 4;
        },
        clearWatch,
      },
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PosicoesRealtimeService, useValue: tempoReal },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Transmitir);
    elemento = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  async function carregarOnibus(): Promise<void> {
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/onibus`))).flush(onibus);
    await fixture.whenStable();
    await vi.waitFor(() => expect(elemento.textContent).toContain('ABC1D23'));
  }

  it('pede permissão e envia a posição do ônibus escolhido', async () => {
    await carregarOnibus();

    elemento.querySelector('button')?.click();
    const envio = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/onibus/3/posicoes`));
    expect(envio.request.method).toBe('POST');
    expect(envio.request.body).toEqual({ latitude: -23.5, longitude: -46.6 });
    envio.flush({ onibusId: 3 });
    await vi.waitFor(() => expect(elemento.textContent).toContain('Enviado'));

    fixture.destroy();
    const fim = await vi.waitFor(() =>
      http.expectOne({ method: 'DELETE', url: `${environment.apiUrl}/onibus/3/posicoes` }),
    );
    fim.flush(null);
    expect(clearWatch).toHaveBeenCalledWith(4);
  });

  it('explica quando a permissão de localização é negada', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: (_sucesso: PositionCallback, erro: PositionErrorCallback) => {
          erro({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
            message: '',
          } as GeolocationPositionError);
          return 1;
        },
        clearWatch,
      },
    });

    await carregarOnibus();
    elemento.querySelector('button')?.click();
    await vi.waitFor(() => expect(elemento.textContent).toContain('O compartilhamento não começou'));
  });
});
