import { InMemoryOnibusRepository } from '../../../../test/in-memory/in-memory-onibus.repository.js';
import { InMemoryPessoaRepository } from '../../../../test/in-memory/in-memory-pessoa.repository.js';
import { InMemoryRotaRepository } from '../../../../test/in-memory/in-memory-rota.repository.js';
import { ConflictError, DomainError, NotFoundError } from '../../../shared/domain/errors.js';
import { Onibus } from '../../onibus/domain/onibus.js';
import { Pessoa } from '../../pessoas/domain/pessoa.js';
import { AtualizarRotaUseCase } from './atualizar-rota.use-case.js';
import { CriarRotaUseCase } from './criar-rota.use-case.js';

const rota = {
  nome: 'Centro - Campus',
  origem: 'Centro',
  destino: 'Campus',
  horarioSaidaIda: '06:30',
  horarioSaidaVolta: '12:15',
  turno: 'MANHA' as const,
  onibusId: 1,
  motoristaId: 1,
};

describe('Casos de uso de Rotas', () => {
  let rotaRepository: InMemoryRotaRepository;
  let onibusRepository: InMemoryOnibusRepository;
  let pessoaRepository: InMemoryPessoaRepository;
  let criar: CriarRotaUseCase;
  let atualizar: AtualizarRotaUseCase;

  beforeEach(async () => {
    rotaRepository = new InMemoryRotaRepository();
    onibusRepository = new InMemoryOnibusRepository();
    pessoaRepository = new InMemoryPessoaRepository();
    criar = new CriarRotaUseCase(rotaRepository, onibusRepository, pessoaRepository);
    atualizar = new AtualizarRotaUseCase(rotaRepository, onibusRepository, pessoaRepository);

    const onibus = { modelo: 'Marcopolo', ano: 2020, capacidade: 44 };
    await onibusRepository.salvar(Onibus.criar({ ...onibus, placa: 'ABC1234' })); // id 1
    await onibusRepository.salvar(Onibus.criar({ ...onibus, placa: 'XYZ9876' })); // id 2
    await pessoaRepository.salvar(
      Pessoa.criar({ nome: 'João', cpf: '11144477735', tipo: 'MOTORISTA' }),
    ); // id 1
    await pessoaRepository.salvar(
      Pessoa.criar({ nome: 'Pedro', cpf: '39053344705', tipo: 'MOTORISTA' }),
    ); // id 2
    await pessoaRepository.salvar(
      Pessoa.criar({ nome: 'Maria', cpf: '52998224725', tipo: 'ESTUDANTE', matricula: '1' }),
    ); // id 3
  });

  it('cria uma rota', async () => {
    expect((await criar.executar(rota)).id).toBe(1);
  });

  it('exige ônibus e motorista existentes', async () => {
    await expect(criar.executar({ ...rota, onibusId: 99 })).rejects.toThrow(NotFoundError);
    await expect(criar.executar({ ...rota, motoristaId: 99 })).rejects.toThrow(NotFoundError);
  });

  it('exige que o motorista seja do tipo MOTORISTA', async () => {
    await expect(criar.executar({ ...rota, motoristaId: 3 })).rejects.toThrow(DomainError);
  });

  it('não usa o mesmo ônibus em duas rotas ativas do mesmo turno', async () => {
    await criar.executar(rota);

    await expect(criar.executar({ ...rota, motoristaId: 2 })).rejects.toThrow(ConflictError);
  });

  it('não usa o mesmo motorista em duas rotas ativas do mesmo turno', async () => {
    await criar.executar(rota);

    await expect(criar.executar({ ...rota, onibusId: 2 })).rejects.toThrow(ConflictError);
  });

  it('permite o mesmo ônibus e motorista em outro turno', async () => {
    await criar.executar(rota);

    const noite = await criar.executar({
      ...rota,
      turno: 'NOITE',
      horarioSaidaIda: '18:00',
      horarioSaidaVolta: '22:30',
    });

    expect(noite.id).toBe(2);
  });

  it('ignora rotas inativas na checagem de turno', async () => {
    await criar.executar({ ...rota, ativo: false });

    expect((await criar.executar(rota)).id).toBe(2);
  });

  it('não reativa uma rota se o ônibus já estiver em uso no turno', async () => {
    const inativa = await criar.executar({ ...rota, ativo: false });
    await criar.executar(rota);

    await expect(atualizar.executar(inativa.id!, { ...rota, ativo: true })).rejects.toThrow(
      ConflictError,
    );
  });

  it('permite atualizar a própria rota sem conflitar com ela mesma', async () => {
    const criada = await criar.executar(rota);

    const atualizada = await atualizar.executar(criada.id!, { ...rota, nome: 'Nova' });

    expect(atualizada.nome).toBe('Nova');
  });

  it('retorna NotFoundError ao atualizar rota inexistente', async () => {
    await expect(atualizar.executar(99, rota)).rejects.toThrow(NotFoundError);
  });
});
