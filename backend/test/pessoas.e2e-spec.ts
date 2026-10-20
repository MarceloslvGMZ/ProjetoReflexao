import { INestApplication } from '@nestjs/common';
import { ClienteHttp, clienteAdmin, criarApp } from './helpers/api.js';

describe('Pessoas (e2e)', () => {
  let app: INestApplication;
  let api: ClienteHttp;

  beforeEach(async () => {
    app = await criarApp();
    api = await clienteAdmin(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const estudante = {
    nome: 'Maria',
    cpf: '529.982.247-25',
    tipo: 'ESTUDANTE',
    matricula: '2026001',
  };

  it('executa o CRUD completo', async () => {
    const criada = await api.post('/pessoas').send(estudante).expect(201);
    expect(criada.body).toMatchObject({ cpf: '52998224725', matricula: '2026001' });
    const id = criada.body.id;

    const lista = await api.get('/pessoas').expect(200);
    expect(lista.body).toContainEqual(criada.body);

    const atualizada = await api
      .put(`/pessoas/${id}`)
      .send({ ...estudante, nome: 'Maria Souza' })
      .expect(200);
    expect(atualizada.body.nome).toBe('Maria Souza');

    await api.delete(`/pessoas/${id}`).expect(204);
    await api.get(`/pessoas/${id}`).expect(404);
  });

  it('retorna 409 para CPF repetido', async () => {
    await api.post('/pessoas').send(estudante).expect(201);

    await api
      .post('/pessoas')
      .send({ ...estudante, matricula: '2026002' })
      .expect(409);
  });

  it('retorna 400 para CPF inválido e para tipo inexistente', async () => {
    await api.post('/pessoas').send({ ...estudante, cpf: '12345678900' }).expect(400);
    await api.post('/pessoas').send({ ...estudante, tipo: 'PROFESSOR' }).expect(400);
  });

  it('não remove a pessoa que possui usuário', async () => {
    const admins = await api.get('/usuarios').expect(200);

    await api.delete(`/pessoas/${admins.body[0].pessoaId}`).expect(409);
  });
});
