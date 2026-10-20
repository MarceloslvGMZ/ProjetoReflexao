import { ConflictError, DomainError, NotFoundError } from '../../../shared/domain/errors.js';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { PessoaRepository } from '../../pessoas/domain/pessoa.repository.js';
import { Rota } from '../domain/rota.js';
import { RotaRepository } from '../domain/rota.repository.js';

interface Repositorios {
  rotaRepository: RotaRepository;
  onibusRepository: OnibusRepository;
  pessoaRepository: PessoaRepository;
}

export async function validarVinculosDaRota(rota: Rota, repositorios: Repositorios) {
  const { rotaRepository, onibusRepository, pessoaRepository } = repositorios;

  if (!(await onibusRepository.buscarPorId(rota.onibusId))) {
    throw new NotFoundError('Ônibus não encontrado');
  }

  const motorista = await pessoaRepository.buscarPorId(rota.motoristaId);
  if (!motorista) throw new NotFoundError('Motorista não encontrado');
  if (motorista.tipo !== 'MOTORISTA') {
    throw new DomainError('A pessoa informada não é motorista');
  }

  if (!rota.ativo) return;

  const outrasDoTurno = (await rotaRepository.listarAtivasPorTurno(rota.turno)).filter(
    (outra) => outra.id !== rota.id,
  );
  if (outrasDoTurno.some((outra) => outra.onibusId === rota.onibusId)) {
    throw new ConflictError('Este ônibus já atende outra rota ativa neste turno');
  }
  if (outrasDoTurno.some((outra) => outra.motoristaId === rota.motoristaId)) {
    throw new ConflictError('Este motorista já atende outra rota ativa neste turno');
  }
}
