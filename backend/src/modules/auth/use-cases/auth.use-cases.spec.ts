import { FakeHashService, FakeTokenService } from '../../../../test/in-memory/fakes.js';
import { InMemoryUsuarioRepository } from '../../../../test/in-memory/in-memory-usuario.repository.js';
import { DomainError, UnauthorizedError } from '../../../shared/domain/errors.js';
import { Usuario } from '../../usuarios/domain/usuario.js';
import { AlterarSenhaUseCase } from './alterar-senha.use-case.js';
import { LoginUseCase } from './login.use-case.js';

describe('Casos de uso de Auth', () => {
  const hash = new FakeHashService();
  let usuarioRepository: InMemoryUsuarioRepository;
  let login: LoginUseCase;

  beforeEach(async () => {
    usuarioRepository = new InMemoryUsuarioRepository();
    login = new LoginUseCase(usuarioRepository, hash, new FakeTokenService());

    await usuarioRepository.salvar(
      Usuario.criar({ pessoaId: 1, usuario: 'maria', senhaHash: 'hash:Senha1234', perfil: 'ESTUDANTE' }),
    ); // id 1
  });

  it('gera token com login e senha corretos, ignorando maiúsculas e espaços no login', async () => {
    expect(await login.executar({ usuario: ' Maria ', senha: 'Senha1234' })).toEqual({
      accessToken: 'token-do-usuario-1',
    });
  });

  it.each([
    ['senha errada', { usuario: 'maria', senha: 'errada123' }],
    ['usuário inexistente', { usuario: 'ninguem', senha: 'Senha1234' }],
    ['login fora do formato', { usuario: '!', senha: 'Senha1234' }],
  ])('recusa %s com UnauthorizedError', async (_caso, dados) => {
    await expect(login.executar(dados)).rejects.toThrow(UnauthorizedError);
  });

  it('recusa usuário inativo', async () => {
    const usuario = (await usuarioRepository.buscarPorId(1))!;
    usuario.atualizar({ usuario: 'maria', ativo: false });
    await usuarioRepository.salvar(usuario);

    await expect(login.executar({ usuario: 'maria', senha: 'Senha1234' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('troca a senha quando a senha atual confere', async () => {
    await new AlterarSenhaUseCase(usuarioRepository, hash).executar(1, {
      senhaAtual: 'Senha1234',
      novaSenha: 'NovaSenha99',
    });

    expect((await usuarioRepository.buscarPorId(1))!.senhaHash).toBe('hash:NovaSenha99');
  });

  it('não troca a senha se a senha atual estiver errada', async () => {
    await expect(
      new AlterarSenhaUseCase(usuarioRepository, hash).executar(1, {
        senhaAtual: 'errada123',
        novaSenha: 'NovaSenha99',
      }),
    ).rejects.toThrow(DomainError);
  });

  it('não troca para uma senha fraca', async () => {
    await expect(
      new AlterarSenhaUseCase(usuarioRepository, hash).executar(1, {
        senhaAtual: 'Senha1234',
        novaSenha: '123',
      }),
    ).rejects.toThrow(DomainError);
  });
});
