import { QueryFailedError } from 'typeorm';

/** Postgres sinaliza violação de chave estrangeira com o código 23503. */
export function violouChaveEstrangeira(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const codigo = (error.driverError as { code?: string } | undefined)?.code;
  return codigo === '23503';
}
