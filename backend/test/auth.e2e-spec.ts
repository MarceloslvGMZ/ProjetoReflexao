import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, ClienteHttp, clienteAdmin, clienteComToken, criarApp, login } from './helpers/api.js';

describe('Usuários e autenticação (e2e)', () => {
  let app: INestApplication;
  let admin: ClienteHttp;
  let pessoaId: number;

  beforeEach(async () => {
    app = await criarApp();
    admin = await clienteAdmin(app);

    const estudante = await admin
      .post('/pessoas')
      .send({ nome: 'Ana', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: '2026010' })
      .expect(201);
    pessoaId = estudante.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('cria o administrador inicial pelo seed', async () => {
    const eu = await admin.get('/auth/me').expect(200);

    expect(eu.body).toMatchObject({ usuario: 'admin', perfil: 'ADMINISTRADOR' });
  });

  it('exige token nas rotas protegidas', async () => {
    const server = app.getHttpServer();

    await request(server).get('/onibus').expect(401);
    await request(server).get('/onibus').set('Authorization', 'Bearer token-falso').expect(401);
  });

  it('recusa login com senha errada', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...ADMIN, senha: 'errada123' })
      .expect(401);
  });

  it('cria usuário sem expor o hash e com perfil vindo da pessoa', async () => {
    const criado = await admin
      .post('/usuarios')
      .send({ pessoaId, usuario: 'Ana', senha: 'Senha1234' })
      .expect(201);

    expect(criado.body).toEqual({
      id: 2,
      pessoaId,
      usuario: 'ana',
      perfil: 'ESTUDANTE',
      ativo: true,
    });
  });

  it('garante usuário único por login e por pessoa', async () => {
    await admin.post('/usuarios').send({ pessoaId, usuario: 'ana', senha: 'Senha1234' }).expect(201);

    await admin.post('/usuarios').send({ pessoaId, usuario: 'outro', senha: 'Senha1234' }).expect(409);

    const outraPessoa = await admin
      .post('/pessoas')
      .send({ nome: 'João', cpf: '11144477735', tipo: 'MOTORISTA' })
      .expect(201);
    await admin
      .post('/usuarios')
      .send({ pessoaId: outraPessoa.body.id, usuario: 'ANA', senha: 'Senha1234' })
      .expect(409);
  });

  it('não aceita perfil enviado pelo cliente', async () => {
    await admin
      .post('/usuarios')
      .send({ pessoaId, usuario: 'ana', senha: 'Senha1234', perfil: 'ADMINISTRADOR' })
      .expect(400);
  });

  it('estudante consulta, mas não altera dados nem gerencia usuários', async () => {
    await admin.post('/usuarios').send({ pessoaId, usuario: 'ana', senha: 'Senha1234' }).expect(201);
    const server = app.getHttpServer();
    const ana = clienteComToken(server, await login(server, { usuario: 'ana', senha: 'Senha1234' }));

    await ana.get('/onibus').expect(200);
    await ana
      .post('/onibus')
      .send({ placa: 'ABC1234', modelo: 'Marcopolo', ano: 2020, capacidade: 44 })
      .expect(403);
    await ana.get('/usuarios').expect(403);
  });

  it('usuário desativado não consegue fazer login', async () => {
    const criado = await admin
      .post('/usuarios')
      .send({ pessoaId, usuario: 'ana', senha: 'Senha1234' })
      .expect(201);

    await admin.put(`/usuarios/${criado.body.id}`).send({ usuario: 'ana', ativo: false }).expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ usuario: 'ana', senha: 'Senha1234' })
      .expect(401);
  });

  it('troca a própria senha', async () => {
    await admin.post('/usuarios').send({ pessoaId, usuario: 'ana', senha: 'Senha1234' }).expect(201);
    const server = app.getHttpServer();
    const ana = clienteComToken(server, await login(server, { usuario: 'ana', senha: 'Senha1234' }));

    await ana.patch('/auth/senha').send({ senhaAtual: 'errada123', novaSenha: 'NovaSenha99' }).expect(400);
    await ana.patch('/auth/senha').send({ senhaAtual: 'Senha1234', novaSenha: 'NovaSenha99' }).expect(204);

    await login(server, { usuario: 'ana', senha: 'NovaSenha99' });
  });
});
