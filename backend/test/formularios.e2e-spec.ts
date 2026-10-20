import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { criarApp } from './helpers/api.js';

describe('Formulários (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('descreve o formulário de cada caso de uso, sem exigir login', async () => {
    const resposta = await request(app.getHttpServer()).get('/formularios/onibus/criar').expect(200);

    expect(resposta.body).toMatchObject({
      recurso: 'onibus',
      acao: 'criar',
      metodo: 'POST',
      caminho: '/onibus',
      perfis: ['ADMINISTRADOR'],
    });
    expect(resposta.body.campos.map((c: { nome: string }) => c.nome)).toEqual([
      'placa',
      'modelo',
      'ano',
      'capacidade',
    ]);
    expect(resposta.body.campos[2]).toMatchObject({ nome: 'ano', tipo: 'numero', obrigatorio: true });
  });

  it('inclui seleções, referências e campos condicionais', async () => {
    const server = app.getHttpServer();

    const rota = await request(server).get('/formularios/rotas/atualizar').expect(200);
    expect(rota.body).toMatchObject({ metodo: 'PUT', caminho: '/rotas/:id' });
    const campos = Object.fromEntries(
      rota.body.campos.map((c: { nome: string }) => [c.nome, c]),
    );
    expect(campos.turno).toMatchObject({ tipo: 'selecao', opcoes: ['MANHA', 'TARDE', 'NOITE'] });
    expect(campos.onibusId).toMatchObject({
      tipo: 'referencia',
      referencia: { recurso: 'onibus', exibir: 'placa' },
    });
    expect(campos.ativo).toMatchObject({ tipo: 'booleano', obrigatorio: false });

    const pessoa = await request(server).get('/formularios/pessoas/criar').expect(200);
    expect(pessoa.body.campos.at(-1)).toMatchObject({
      nome: 'matricula',
      obrigatorio: false,
      obrigatorioSe: { campo: 'tipo', igual: 'ESTUDANTE' },
    });

    const ocorrencia = await request(server).get('/formularios/ocorrencias/criar').expect(200);
    expect(ocorrencia.body.perfis).toEqual([]);
  });

  it('lista todos os formulários descobertos', async () => {
    const resposta = await request(app.getHttpServer()).get('/formularios').expect(200);

    const chaves = resposta.body.map((f: { recurso: string; acao: string }) => `${f.recurso}/${f.acao}`);
    expect(chaves).toEqual(
      expect.arrayContaining([
        'auth/entrar',
        'auth/trocarSenha',
        'onibus/criar',
        'pessoas/atualizar',
        'usuarios/criar',
        'usuarios/atualizar',
        'ocorrencias/criar',
      ]),
    );
    expect(chaves).not.toContain('onibus/listar');
  });

  it('retorna 404 para formulário inexistente', async () => {
    await request(app.getHttpServer()).get('/formularios/onibus/voar').expect(404);
  });
});
