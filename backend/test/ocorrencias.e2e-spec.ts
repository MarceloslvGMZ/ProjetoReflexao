import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ClienteHttp, clienteAdmin, clienteComToken, criarApp, login } from './helpers/api.js';

describe('Ocorrências (e2e)', () => {
  let app: INestApplication;
  let admin: ClienteHttp;
  let maria: ClienteHttp;
  let pedro: ClienteHttp;
  let mariaId: number;
  let onibusId: number;
  let rotaId: number;
  let ocorrencia: Record<string, unknown>;

  async function criarEstudante(nome: string, cpf: string, matricula: string, usuario: string) {
    const pessoa = await admin
      .post('/pessoas')
      .send({ nome, cpf, tipo: 'ESTUDANTE', matricula })
      .expect(201);
    const criado = await admin
      .post('/usuarios')
      .send({ pessoaId: pessoa.body.id, usuario, senha: 'Senha12345' })
      .expect(201);
    const server = app.getHttpServer();
    const token = await login(server, { usuario, senha: 'Senha12345' });
    return { id: criado.body.id as number, api: clienteComToken(server, token) };
  }

  beforeEach(async () => {
    app = await criarApp();
    admin = await clienteAdmin(app);

    const onibus = await admin
      .post('/onibus')
      .send({ placa: 'ABC1234', modelo: 'Marcopolo', ano: 2020, capacidade: 44 })
      .expect(201);
    const motorista = await admin
      .post('/pessoas')
      .send({ nome: 'João', cpf: '11144477735', tipo: 'MOTORISTA' })
      .expect(201);
    const rota = await admin
      .post('/rotas')
      .send({
        nome: 'Centro - Campus',
        origem: 'Centro',
        destino: 'Campus',
        horarioSaidaIda: '06:30',
        horarioSaidaVolta: '12:15',
        turno: 'MANHA',
        onibusId: onibus.body.id,
        motoristaId: motorista.body.id,
      })
      .expect(201);
    onibusId = onibus.body.id;
    rotaId = rota.body.id;

    ({ id: mariaId, api: maria } = await criarEstudante('Maria', '52998224725', '1', 'maria'));
    ({ api: pedro } = await criarEstudante('Pedro', '39053344705', '2', 'pedro'));

    ocorrencia = {
      titulo: 'Pneu furado',
      descricao: 'Ônibus parou na BR',
      dataHora: '2026-01-10T07:15:00.000Z',
      onibusId,
      rotaId,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  it('registra a ocorrência com o usuário logado como autor', async () => {
    const criada = await maria.post('/ocorrencias').send(ocorrencia).expect(201);
    expect(criada.body).toMatchObject({ ...ocorrencia, id: 1, usuarioId: mariaId });

    await pedro.get('/ocorrencias').expect(200).expect([criada.body]);
    await pedro.get(`/ocorrencias?rotaId=${rotaId}`).expect(200).expect([criada.body]);
    await pedro.get('/ocorrencias?rotaId=99').expect(200).expect([]);
    await pedro.get('/ocorrencias/1').expect(200).expect(criada.body);
  });

  it('usa o momento atual quando a data não é enviada', async () => {
    const { dataHora: _, ...semData } = ocorrencia;
    const antes = Date.now();

    const criada = await maria.post('/ocorrencias').send(semData).expect(201);

    expect(new Date(criada.body.dataHora).getTime()).toBeGreaterThanOrEqual(antes - 1000);
  });

  it('valida os dados e os vínculos', async () => {
    await maria.post('/ocorrencias').send({ ...ocorrencia, usuarioId: 99 }).expect(400);
    await maria.post('/ocorrencias').send({ ...ocorrencia, dataHora: '2999-01-01T00:00:00Z' }).expect(400);
    await maria.post('/ocorrencias').send({ ...ocorrencia, rotaId: 99 }).expect(404);

    const outroOnibus = await admin
      .post('/onibus')
      .send({ placa: 'XYZ9876', modelo: 'Caio', ano: 2021, capacidade: 40 })
      .expect(201);
    await maria
      .post('/ocorrencias')
      .send({ ...ocorrencia, onibusId: outroOnibus.body.id })
      .expect(400);
  });

  it('só o autor ou um administrador altera ou remove', async () => {
    await maria.post('/ocorrencias').send(ocorrencia).expect(201);

    await pedro.put('/ocorrencias/1').send(ocorrencia).expect(403);
    await pedro.delete('/ocorrencias/1').expect(403);

    const atualizada = await maria
      .put('/ocorrencias/1')
      .send({ ...ocorrencia, titulo: 'Atraso' })
      .expect(200);
    expect(atualizada.body).toMatchObject({ titulo: 'Atraso', usuarioId: mariaId });

    await admin.delete('/ocorrencias/1').expect(204);
    await admin.get('/ocorrencias/1').expect(404);
  });

  it('não remove rota, ônibus nem usuário vinculados a uma ocorrência', async () => {
    await maria.post('/ocorrencias').send(ocorrencia).expect(201);

    await admin.delete(`/rotas/${rotaId}`).expect(409);
    await admin.delete(`/onibus/${onibusId}`).expect(409);
    await admin.delete(`/usuarios/${mariaId}`).expect(409);

    await admin.delete('/ocorrencias/1').expect(204);
    await admin.delete(`/usuarios/${mariaId}`).expect(204);
    await admin.delete(`/rotas/${rotaId}`).expect(204);
  });

  it('exige login', async () => {
    await request(app.getHttpServer()).get('/ocorrencias').expect(401);
  });
});
