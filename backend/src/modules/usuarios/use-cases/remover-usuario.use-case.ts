import { RemoverPorIdUseCase } from '../../../shared/use-cases/crud.use-cases.js';
import { UsuarioRepository } from '../domain/usuario.repository.js';

export class RemoverUsuarioUseCase extends RemoverPorIdUseCase(UsuarioRepository, 'Usuário não encontrado') {}
