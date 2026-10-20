import { BuscarPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { UsuarioRepository } from '../domain/usuario.repository.js';

export class BuscarUsuarioUseCase extends BuscarPorIdUseCase(UsuarioRepository, 'Usuário não encontrado') {}
