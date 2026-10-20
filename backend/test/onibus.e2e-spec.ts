import { INestApplication } from '@nestjs/common';
import { ClienteHttp, clienteAdmin, criarApp } from './helpers/api.js';

describe('Ônibus (e2e)', () => {
  let app: INestApplication;
  let api: ClienteHttp;

  beforeEach(async () => {
    app = await criarApp();
    api = await clienteAdmin(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const onibus = { placa: 'abc-1234', modelo: 'Marcopolo', ano: 2020, capacidade: 44 };

  it('executa o CRUD completo', async () => {
    const criado = await api.post('/onibus').send(onibus).expect(201);
    expect(criado.body).toMatchObject({ id: 1, placa: 'ABC1234' });

    await api.get('/onibus').expect(200).expect([criado.body]);
    await api.get('/onibus/1').expect(200).expect(criado.body);

    const atualizado = await api
      .put('/onibus/1')
      .send({ ...onibus, capacidade: 50 })
      .expect(200);
    expect(atualizado.body.capacidade).toBe(50);

    await api.delete('/onibus/1').expect(204);
    await api.get('/onibus/1').expect(404);
  });

  it('retorna 409 para placa repetida', async () => {
    await api.post('/onibus').send(onibus).expect(201);

    await api.post('/onibus').send(onibus).expect(409);
  });

  it('retorna 400 para regra de domínio violada', async () => {
    await api
      .post('/onibus')
      .send({ ...onibus, capacidade: 0 })
      .expect(400);
  });

  it('retorna 400 para corpo inválido ou com campos extras', async () => {
    await api.post('/onibus').send({ ...onibus, ano: '2020' }).expect(400);
    await api.post('/onibus').send({ ...onibus, cor: 'azul' }).expect(400);
  });
});
