import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arquivoSqlite = join(raiz, 'backend', 'database.sqlite');

/** Ordem respeita as chaves estrangeiras: pai antes do filho. */
const TABELAS = ['pessoa', 'onibus', 'usuarios', 'rota', 'ocorrencia'];
const BOOLEANOS = new Set(['ativo']);

const url = lerVariavel('DATABASE_URL_UNPOOLED') ?? lerVariavel('DATABASE_URL');
if (!url) throw new Error('DATABASE_URL não encontrada em .env.local');

const sqlite = new DatabaseSync(arquivoSqlite, { readOnly: true });
const postgres = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await postgres.connect();

try {
  await postgres.query('BEGIN');
  await postgres.query(`TRUNCATE TABLE ${TABELAS.join(', ')}, posicoes RESTART IDENTITY CASCADE`);

  for (const tabela of TABELAS) {
    const linhas = sqlite.prepare(`SELECT * FROM "${tabela}"`).all();
    if (linhas.length === 0) {
      console.log(`${tabela}: 0`);
      continue;
    }

    const colunas = Object.keys(linhas[0]);
    const valores = [];
    const grupos = linhas.map((linha, indice) => {
      const marcas = colunas.map((coluna) => {
        valores.push(converter(coluna, linha[coluna]));
        return `$${valores.length}`;
      });
      void indice;
      return `(${marcas.join(', ')})`;
    });

    await postgres.query(
      `INSERT INTO "${tabela}" (${colunas.map((coluna) => `"${coluna}"`).join(', ')}) VALUES ${grupos.join(', ')}`,
      valores,
    );
    await postgres.query(
      `SELECT setval(pg_get_serial_sequence($1, 'id'), (SELECT MAX(id) FROM "${tabela}"))`,
      [tabela],
    );
    console.log(`${tabela}: ${linhas.length}`);
  }

  await postgres.query('COMMIT');
} catch (erro) {
  await postgres.query('ROLLBACK');
  throw erro;
} finally {
  await postgres.end();
}

function converter(coluna, valor) {
  if (valor === null || valor === undefined) return null;
  if (BOOLEANOS.has(coluna)) return valor === 1 || valor === true;
  return valor;
}

function lerVariavel(nome) {
  const texto = readFileSync(join(raiz, '.env.local'), 'utf8');
  const linha = texto.split(/\r?\n/).find((item) => item.startsWith(`${nome}=`));
  if (!linha) return undefined;
  return linha.slice(nome.length + 1).trim().replace(/^["']|["']$/g, '');
}
