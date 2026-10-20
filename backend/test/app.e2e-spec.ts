import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { criarApp } from './helpers/api.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET) é público', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });
});
