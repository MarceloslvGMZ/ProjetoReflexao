import { InMemoryOcorrenciaRepository } from '../../../../test/in-memory/in-memory-ocorrencia.repository.js';
import { InMemoryOnibusRepository } from '../../../../test/in-memory/in-memory-onibus.repository.js';
import { InMemoryRotaRepository } from '../../../../test/in-memory/in-memory-rota.repository.js';
import { InMemoryUsuarioRepository } from '../../../../test/in-memory/in-memory-usuario.repository.js';
import {
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/domain/errors.js';
import { Onibus } from '../../onibus/domain/onibus.js';
import { Rota } from '../../rotas/domain/rota.js';
import { Usuario } from '../../usuarios/domain/usuario.js';
import { AtualizarOcorrenciaUseCase } from './atualizar-ocorrencia.use-case.js';
import { CriarOcorrenciaUseCase } from './criar-ocorrencia.use-case.js';
import { ListarOcorrenciasUseCase } from './listar-ocorrencias.use-case.js';
import { RemoverOcorrenciaUseCase } from './remover-ocorrencia.use-case.js';

const ocorrencia = {
  titulo: 'Pneu furado',
  descricao: 'Ônibus parou na BR',
  dataHora: new Date('2026-01-10T07:15:00Z'),
  onibusId: 1,
  rotaId: 1,
};

const autor = { id: 1, perfil: 'ESTUDANTE' as const };
const outroEstudante = { id: 2, perfil: 'ESTUDANTE' as const };
const admin = { id: 3, perfil: 'ADMINISTRADOR' as const };

describe('Casos de uso de Ocorrências', () => {
  let ocorrenciaRepository: InMemoryOcorrenciaRepository;
  let usuarioRepository: InMemoryUsuarioRepository;
  let criar: CriarOcorrenciaUseCase;
  let listar: ListarOcorrenciasUseCase;
  let atualizar: AtualizarOcorrenciaUseCase;
  let remover: RemoverOcorrenciaUseCase;

  beforeEach(async () => {
    ocorrenciaRepository = new InMemoryOcorrenciaRepository();
    usuarioRepository = new InMemoryUsuarioRepository();
    const rotaRepository = new InMemoryRotaRepository();
    const onibusRepository = new InMemoryOnibusRepository();
    criar = new CriarOcorrenciaUseCase(
      ocorrenciaRepository,
      rotaRepository,
      onibusRepository,
      usuarioRepository,
    );
    listar = new ListarOcorrenciasUseCase(ocorrenciaRepository);
    atualizar = new AtualizarOcorrenciaUseCase(ocorrenciaRepository, rotaRepository, onibusRepository);
    remover = new RemoverOcorrenciaUseCase(ocorrenciaRepository);

    const onibus = { modelo: 'Marcopolo', ano: 2020, capacidade: 44 };
    await onibusRepository.salvar(Onibus.criar({ ...onibus, placa: 'ABC1234' })); // id 1
    await onibusRepository.salvar(Onibus.criar({ ...onibus, placa: 'XYZ9876' })); // id 2

    const rota = {
      nome: 'Centro - Campus',
      origem: 'Centro',
      destino: 'Campus',
      horarioSaidaIda: '06:30',
      horarioSaidaVolta: '12:15',
      turno: 'MANHA' as const,
      motoristaId: 1,
    };
    await rotaRepository.salvar(Rota.criar({ ...rota, onibusId: 1 })); // id 1
    await rotaRepository.salvar(Rota.criar({ ...rota, onibusId: 2, turno: 'TARDE' })); // id 2

    const usuario = { senhaHash: 'hash', perfil: 'ESTUDANTE' as const };
    await usuarioRepository.salvar(Usuario.criar({ ...usuario, pessoaId: 1, usuario: 'maria' })); // id 1
    await usuarioRepository.salvar(
      Usuario.criar({ ...usuario, pessoaId: 2, usuario: 'inativo', ativo: false }),
    ); // id 2
  });

  it('registra a ocorrência com o usuário logado como autor', async () => {
    const criada = await criar.executar(1, ocorrencia);

    expect(criada).toMatchObject({ id: 1, usuarioId: 1, rotaId: 1, onibusId: 1 });
  });

  it('não aceita usuário inexistente ou inativo', async () => {
    await expect(criar.executar(99, ocorrencia)).rejects.toThrow(UnauthorizedError);
    await expect(criar.executar(2, ocorrencia)).rejects.toThrow(UnauthorizedError);
  });

  it('exige rota e ônibus existentes', async () => {
    await expect(criar.executar(1, { ...ocorrencia, rotaId: 99 })).rejects.toThrow(NotFoundError);
    await expect(criar.executar(1, { ...ocorrencia, onibusId: 99 })).rejects.toThrow(NotFoundError);
  });

  it('exige que o ônibus seja o da rota', async () => {
    await expect(criar.executar(1, { ...ocorrencia, onibusId: 2 })).rejects.toThrow(DomainError);
  });

  it('lista filtrando e das mais recentes para as mais antigas', async () => {
    await criar.executar(1, ocorrencia);
    await criar.executar(1, {
      ...ocorrencia,
      rotaId: 2,
      onibusId: 2,
      dataHora: new Date('2026-01-11T07:15:00Z'),
    });

    expect((await listar.executar()).map((o) => o.id)).toEqual([2, 1]);
    expect((await listar.executar({ rotaId: 1 })).map((o) => o.id)).toEqual([1]);
  });

  it('só o autor ou um administrador altera ou remove', async () => {
    const criada = await criar.executar(1, ocorrencia);
    const id = criada.id!;

    await expect(atualizar.executar(id, outroEstudante, ocorrencia)).rejects.toThrow(ForbiddenError);
    await expect(remover.executar(id, outroEstudante)).rejects.toThrow(ForbiddenError);

    const atualizada = await atualizar.executar(id, autor, { ...ocorrencia, titulo: 'Atraso' });
    expect(atualizada.titulo).toBe('Atraso');

    await remover.executar(id, admin);
    expect(await ocorrenciaRepository.buscarPorId(id)).toBeNull();
  });

  it('retorna NotFoundError para ocorrência inexistente', async () => {
    await expect(atualizar.executar(99, admin, ocorrencia)).rejects.toThrow(NotFoundError);
    await expect(remover.executar(99, admin)).rejects.toThrow(NotFoundError);
  });
});
