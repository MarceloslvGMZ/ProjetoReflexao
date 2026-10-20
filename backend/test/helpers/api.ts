import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

type Servidor = Parameters<typeof request>[0];

export const ADMIN = { usuario: 'admin', senha: 'Admin12345' };

export async function criarApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

export async function login(server: Servidor, credenciais: { usuario: string; senha: string }) {
  const resposta = await request(server).post('/auth/login').send(credenciais).expect(200);
  return resposta.body.accessToken as string;
}

/** Cliente HTTP que envia o token em todas as requisições. */
export function clienteComToken(server: Servidor, token: string) {
  const autorizacao = `Bearer ${token}`;
  return {
    get: (url: string) => request(server).get(url).set('Authorization', autorizacao),
    post: (url: string) => request(server).post(url).set('Authorization', autorizacao),
    put: (url: string) => request(server).put(url).set('Authorization', autorizacao),
    patch: (url: string) => request(server).patch(url).set('Authorization', autorizacao),
    delete: (url: string) => request(server).delete(url).set('Authorization', autorizacao),
  };
}

export type ClienteHttp = ReturnType<typeof clienteComToken>;

export async function clienteAdmin(app: INestApplication): Promise<ClienteHttp> {
  const server = app.getHttpServer();
  return clienteComToken(server, await login(server, ADMIN));
}
