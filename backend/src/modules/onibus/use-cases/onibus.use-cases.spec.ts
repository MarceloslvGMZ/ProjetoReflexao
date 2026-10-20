import { InMemoryOnibusRepository } from '../../../../test/in-memory/in-memory-onibus.repository.js';
import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import { AtualizarOnibusUseCase } from './atualizar-onibus.use-case.js';
import { BuscarOnibusUseCase } from './buscar-onibus.use-case.js';
import { CriarOnibusUseCase } from './criar-onibus.use-case.js';
import { RemoverOnibusUseCase } from './remover-onibus.use-case.js';

const dados = { placa: 'ABC1234', modelo: 'Marcopolo', ano: 2020, capacidade: 44 };

describe('Casos de uso de Ônibus', () => {
  let repository: InMemoryOnibusRepository;

  beforeEach(() => {
    repository = new InMemoryOnibusRepository();
  });

  it('cria um ônibus', async () => {
    const onibus = await new CriarOnibusUseCase(repository).executar(dados);

    expect(onibus.id).toBe(1);
  });

  it('não cria ônibus com placa repetida, mesmo escrita de outro jeito', async () => {
    const criar = new CriarOnibusUseCase(repository);
    await criar.executar(dados);

    await expect(criar.executar({ ...dados, placa: 'abc-1234' })).rejects.toThrow(ConflictError);
  });

  it('não atualiza para a placa de outro ônibus', async () => {
    const criar = new CriarOnibusUseCase(repository);
    await criar.executar(dados);
    const outro = await criar.executar({ ...dados, placa: 'XYZ9876' });

    await expect(
      new AtualizarOnibusUseCase(repository).executar(outro.id!, dados),
    ).rejects.toThrow(ConflictError);
  });

  it('permite atualizar mantendo a própria placa', async () => {
    const onibus = await new CriarOnibusUseCase(repository).executar(dados);

    const atualizado = await new AtualizarOnibusUseCase(repository).executar(onibus.id!, {
      ...dados,
      capacidade: 50,
    });

    expect(atualizado.capacidade).toBe(50);
  });

  it('retorna NotFoundError para ônibus inexistente', async () => {
    await expect(new BuscarOnibusUseCase(repository).executar(99)).rejects.toThrow(NotFoundError);
    await expect(new AtualizarOnibusUseCase(repository).executar(99, dados)).rejects.toThrow(
      NotFoundError,
    );
    await expect(new RemoverOnibusUseCase(repository).executar(99)).rejects.toThrow(NotFoundError);
  });
});
