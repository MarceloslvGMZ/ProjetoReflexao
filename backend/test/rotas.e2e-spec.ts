import { INestApplication } from '@nestjs/common';
import { ClienteHttp, clienteAdmin, criarApp } from './helpers/api.js';

describe('Rotas (e2e)', () => {
  let app: INestApplication;
  let api: ClienteHttp;
  let onibusId: number;
  let motoristaId: number;
  let rota: Record<string, unknown>;

  beforeEach(async () => {
    app = await criarApp();
    api = await clienteAdmin(app);

    const onibus = await api
      .post('/onibus')
      .send({ placa: 'ABC1234', modelo: 'Marcopolo', ano: 2020, capacidade: 44 })
      .expect(201);
    const motorista = await api
      .post('/pessoas')
      .send({ nome: 'João', cpf: '11144477735', tipo: 'MOTORISTA' })
      .expect(201);
    onibusId = onibus.body.id;
    motoristaId = motorista.body.id;

    rota = {
      nome: 'Centro - Campus',
      origem: 'Centro',
      destino: 'Campus',
      horarioSaidaIda: '06:30',
      horarioSaidaVolta: '12:15',
      turno: 'MANHA',
      onibusId,
      motoristaId,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  it('executa o CRUD completo', async () => {
    const criada = await api.post('/rotas').send(rota).expect(201);
    expect(criada.body).toMatchObject({ id: 1, ativo: true, turno: 'MANHA' });

    await api.get('/rotas').expect(200).expect([criada.body]);

    const atualizada = await api
      .put('/rotas/1')
      .send({ ...rota, ativo: false })
      .expect(200);
    expect(atualizada.body.ativo).toBe(false);

    await api.delete('/rotas/1').expect(204);
    await api.get('/rotas/1').expect(404);
  });

  it('retorna 404 para ônibus inexistente e 400 para quem não é motorista', async () => {
    const estudante = await api
      .post('/pessoas')
      .send({ nome: 'Maria', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: '1' })
      .expect(201);

    await api.post('/rotas').send({ ...rota, onibusId: 99 }).expect(404);
    await api.post('/rotas').send({ ...rota, motoristaId: estudante.body.id }).expect(400);
  });

  it('retorna 409 para ônibus já usado no mesmo turno', async () => {
    const pedro = await api
      .post('/pessoas')
      .send({ nome: 'Pedro', cpf: '39053344705', tipo: 'MOTORISTA' })
      .expect(201);
    await api.post('/rotas').send(rota).expect(201);

    await api.post('/rotas').send({ ...rota, motoristaId: pedro.body.id }).expect(409);
  });

  it('não remove ônibus nem motorista vinculados a uma rota', async () => {
    await api.post('/rotas').send(rota).expect(201);

    await api.delete(`/onibus/${onibusId}`).expect(409);
    await api.delete(`/pessoas/${motoristaId}`).expect(409);

    await api.delete('/rotas/1').expect(204);
    await api.delete(`/onibus/${onibusId}`).expect(204);
    await api.delete(`/pessoas/${motoristaId}`).expect(204);
  });
});
