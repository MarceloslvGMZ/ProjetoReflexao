import { QueryFailedError } from 'typeorm';

// O SQLite usa códigos diferentes conforme a regra (ex.: RESTRICT gera SQLITE_CONSTRAINT_TRIGGER),
// mas a mensagem é sempre a mesma.
export function violouChaveEstrangeira(error: unknown): boolean {
  return error instanceof QueryFailedError && error.message.includes('FOREIGN KEY constraint failed');
}
