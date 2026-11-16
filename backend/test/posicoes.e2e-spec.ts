import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ClienteHttp, clienteAdmin, criarApp } from './helpers/api.js';

describe('Posições (e2e)', () => {
  let app: INestApplication;
  let api: ClienteHttp;

  beforeEach(async () => {
    app = await criarApp();
    api = await clienteAdmin(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const onibus = { placa: 'ABC1D23', modelo: 'Marcopolo', ano: 2020, capacidade: 44 };

  it('grava a última posição do ônibus e a devolve na listagem', async () => {
    await api.post('/onibus').send(onibus).expect(201);

    const criada = await api.post('/onibus/1/posicoes').send({ latitude: -23.5, longitude: -46.6 }).expect(200);
    expect(criada.body).toMatchObject({
      onibusId: 1,
      placa: 'ABC1D23',
      latitude: -23.5,
      longitude: -46.6,
      desatualizada: false,
    });

    const atualizada = await api.post('/onibus/1/posicoes').send({ latitude: -23.6, longitude: -46.7 }).expect(200);
    expect(atualizada.body.latitude).toBe(-23.6);

    const lista = await api.get('/posicoes').expect(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ onibusId: 1, placa: 'ABC1D23', latitude: -23.6, longitude: -46.7 });
  });

  it('rejeita ônibus inexistente e coordenada inválida', async () => {
    await api.post('/onibus/99/posicoes').send({ latitude: 0, longitude: 0 }).expect(404);
    await api.post('/onibus').send(onibus).expect(201);
    await api.post('/onibus/1/posicoes').send({ latitude: 120, longitude: 0 }).expect(400);
  });

  it('exige autenticação', async () => {
    await api.post('/onibus').send(onibus).expect(201);
    const server = app.getHttpServer();
    await request(server).get('/posicoes').expect(401);
    await request(server).post('/onibus/1/posicoes').send({ latitude: 0, longitude: 0 }).expect(401);
  });
});
