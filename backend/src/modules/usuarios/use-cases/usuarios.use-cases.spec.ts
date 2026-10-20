import { FakeHashService } from '../../../../test/in-memory/fakes.js';
import { InMemoryPessoaRepository } from '../../../../test/in-memory/in-memory-pessoa.repository.js';
import { InMemoryUsuarioRepository } from '../../../../test/in-memory/in-memory-usuario.repository.js';
import { ConflictError, DomainError, NotFoundError } from '../../../shared/domain/errors.js';
import { Pessoa } from '../../pessoas/domain/pessoa.js';
import { AtualizarUsuarioUseCase } from './atualizar-usuario.use-case.js';
import { BuscarUsuarioUseCase } from './buscar-usuario.use-case.js';
import { CriarUsuarioUseCase } from './criar-usuario.use-case.js';
import { RemoverUsuarioUseCase } from './remover-usuario.use-case.js';

describe('Casos de uso de Usuários', () => {
  let pessoaRepository: InMemoryPessoaRepository;
  let usuarioRepository: InMemoryUsuarioRepository;
  let criar: CriarUsuarioUseCase;

  beforeEach(async () => {
    pessoaRepository = new InMemoryPessoaRepository();
    usuarioRepository = new InMemoryUsuarioRepository();
    criar = new CriarUsuarioUseCase(pessoaRepository, usuarioRepository, new FakeHashService());

    await pessoaRepository.salvar(
      Pessoa.criar({ nome: 'Maria', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: '1' }),
    ); // id 1
    await pessoaRepository.salvar(
      Pessoa.criar({ nome: 'João', cpf: '11144477735', tipo: 'MOTORISTA' }),
    ); // id 2
  });

  it('cria usuário com hash da senha e perfil copiado do tipo da pessoa', async () => {
    const usuario = await criar.executar({ pessoaId: 1, usuario: 'Maria', senha: 'Senha1234' });

    expect(usuario.usuario).toBe('maria');
    expect(usuario.senhaHash).toBe('hash:Senha1234');
    expect(usuario.perfil).toBe('ESTUDANTE');
  });

  it('exige pessoa existente', async () => {
    await expect(
      criar.executar({ pessoaId: 99, usuario: 'x123', senha: 'Senha1234' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('não cria dois usuários para a mesma pessoa', async () => {
    await criar.executar({ pessoaId: 1, usuario: 'maria', senha: 'Senha1234' });

    await expect(
      criar.executar({ pessoaId: 1, usuario: 'maria2', senha: 'Senha1234' }),
    ).rejects.toThrow(ConflictError);
  });

  it('não cria usuário com login repetido, mesmo com maiúsculas', async () => {
    await criar.executar({ pessoaId: 1, usuario: 'maria', senha: 'Senha1234' });

    await expect(
      criar.executar({ pessoaId: 2, usuario: 'MARIA', senha: 'Senha1234' }),
    ).rejects.toThrow(ConflictError);
  });

  it.each([
    ['senha curta', 'Ab1'],
    ['senha sem letras', '12345678'],
    ['senha sem números', 'SenhaSemNumero'],
  ])('rejeita %s', async (_caso, senha) => {
    await expect(criar.executar({ pessoaId: 1, usuario: 'maria', senha })).rejects.toThrow(
      DomainError,
    );
  });

  it('rejeita login fora do formato', async () => {
    await expect(
      criar.executar({ pessoaId: 1, usuario: 'ma', senha: 'Senha1234' }),
    ).rejects.toThrow(DomainError);
  });

  it('atualiza login e status mantendo o próprio login', async () => {
    const usuario = await criar.executar({ pessoaId: 1, usuario: 'maria', senha: 'Senha1234' });

    const atualizado = await new AtualizarUsuarioUseCase(usuarioRepository).executar(usuario.id!, {
      usuario: 'maria',
      ativo: false,
    });

    expect(atualizado.ativo).toBe(false);
  });

  it('não atualiza para o login de outro usuário', async () => {
    await criar.executar({ pessoaId: 1, usuario: 'maria', senha: 'Senha1234' });
    const joao = await criar.executar({ pessoaId: 2, usuario: 'joao', senha: 'Senha1234' });

    await expect(
      new AtualizarUsuarioUseCase(usuarioRepository).executar(joao.id!, {
        usuario: 'maria',
        ativo: true,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('retorna NotFoundError para usuário inexistente', async () => {
    await expect(new BuscarUsuarioUseCase(usuarioRepository).executar(99)).rejects.toThrow(
      NotFoundError,
    );
    await expect(new RemoverUsuarioUseCase(usuarioRepository).executar(99)).rejects.toThrow(
      NotFoundError,
    );
  });
});
