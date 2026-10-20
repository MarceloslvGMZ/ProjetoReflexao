import { ListarUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { UsuarioRepository } from '../domain/usuario.repository.js';

export class ListarUsuarioUseCase extends ListarUseCase(UsuarioRepository) {}
