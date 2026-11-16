import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

/** Postgres fica fora do processo da API. O arquivo local do SQLite deixou de ser o banco. */
export function opcoesDoBanco(config: ConfigService): TypeOrmModuleOptions {
  const url = config.get<string>('DATABASE_URL_UNPOOLED') ?? config.get<string>('DATABASE_URL');
  if (!url) throw new Error('Defina DATABASE_URL com a conexão do Postgres');

  const local = url.includes('localhost') || url.includes('127.0.0.1');
  return {
    type: 'postgres',
    url,
    autoLoadEntities: true,
    synchronize: true,
    ssl: local ? false : { rejectUnauthorized: false },
  };
}
