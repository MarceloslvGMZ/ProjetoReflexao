import { InMemoryPessoaRepository } from '../../../../test/in-memory/in-memory-pessoa.repository.js';
import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import { AtualizarPessoaUseCase } from './atualizar-pessoa.use-case.js';
import { BuscarPessoaUseCase } from './buscar-pessoa.use-case.js';
import { CriarPessoaUseCase } from './criar-pessoa.use-case.js';
import { RemoverPessoaUseCase } from './remover-pessoa.use-case.js';

const estudante = {
  nome: 'Maria',
  cpf: '52998224725',
  tipo: 'ESTUDANTE' as const,
  matricula: '2026001',
};

describe('Casos de uso de Pessoas', () => {
  let repository: InMemoryPessoaRepository;
  let criar: CriarPessoaUseCase;

  beforeEach(() => {
    repository = new InMemoryPessoaRepository();
    criar = new CriarPessoaUseCase(repository);
  });

  it('cria uma pessoa', async () => {
    expect((await criar.executar(estudante)).id).toBe(1);
  });

  it('não cria pessoa com CPF repetido, mesmo formatado de outro jeito', async () => {
    await criar.executar(estudante);

    await expect(
      criar.executar({ ...estudante, cpf: '529.982.247-25', matricula: '2026002' }),
    ).rejects.toThrow(ConflictError);
  });

  it('não cria estudante com matrícula repetida', async () => {
    await criar.executar(estudante);

    await expect(criar.executar({ ...estudante, cpf: '11144477735' })).rejects.toThrow(
      ConflictError,
    );
  });

  it('permite atualizar mantendo o próprio CPF e matrícula', async () => {
    const pessoa = await criar.executar(estudante);

    const atualizada = await new AtualizarPessoaUseCase(repository).executar(pessoa.id!, {
      ...estudante,
      nome: 'Maria Souza',
    });

    expect(atualizada.nome).toBe('Maria Souza');
  });

  it('não atualiza para o CPF de outra pessoa', async () => {
    await criar.executar(estudante);
    const outra = await criar.executar({ ...estudante, cpf: '11144477735', matricula: '2026002' });

    await expect(
      new AtualizarPessoaUseCase(repository).executar(outra.id!, {
        ...estudante,
        matricula: '2026002',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('retorna NotFoundError para pessoa inexistente', async () => {
    await expect(new BuscarPessoaUseCase(repository).executar(99)).rejects.toThrow(NotFoundError);
    await expect(new AtualizarPessoaUseCase(repository).executar(99, estudante)).rejects.toThrow(
      NotFoundError,
    );
    await expect(new RemoverPessoaUseCase(repository).executar(99)).rejects.toThrow(NotFoundError);
  });
});
