import { ForbiddenError } from '../../../shared/domain/errors.js';
import type { Perfil } from '../../usuarios/domain/usuario.js';
import { Ocorrencia } from '../domain/ocorrencia.js';

/** Quem está fazendo a requisição. */
export interface Solicitante {
  id: number;
  perfil: Perfil;
}

export function garantirAutorOuAdministrador(ocorrencia: Ocorrencia, solicitante: Solicitante) {
  if (solicitante.perfil === 'ADMINISTRADOR') return;
  if (ocorrencia.usuarioId !== solicitante.id) {
    throw new ForbiddenError('Apenas o autor ou um administrador pode alterar esta ocorrência');
  }
}
