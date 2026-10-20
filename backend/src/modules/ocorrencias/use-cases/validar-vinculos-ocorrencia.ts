import { DomainError, NotFoundError } from '../../../shared/domain/errors.js';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { RotaRepository } from '../../rotas/domain/rota.repository.js';
import { Ocorrencia } from '../domain/ocorrencia.js';

interface Repositorios {
  rotaRepository: RotaRepository;
  onibusRepository: OnibusRepository;
}

export async function validarVinculosDaOcorrencia(
  ocorrencia: Ocorrencia,
  repositorios: Repositorios,
) {
  const { rotaRepository, onibusRepository } = repositorios;

  const rota = await rotaRepository.buscarPorId(ocorrencia.rotaId);
  if (!rota) throw new NotFoundError('Rota não encontrada');

  if (!(await onibusRepository.buscarPorId(ocorrencia.onibusId))) {
    throw new NotFoundError('Ônibus não encontrado');
  }

  if (rota.onibusId !== ocorrencia.onibusId) {
    throw new DomainError('O ônibus informado não é o ônibus da rota');
  }
}
