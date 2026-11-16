import { Injectable } from '@nestjs/common';
import { OnibusRepository } from '../../onibus/domain/onibus.repository.js';
import { PessoaRepository } from '../../pessoas/domain/pessoa.repository.js';
import { RotaRepository } from '../../rotas/domain/rota.repository.js';
import { posicaoDesatualizada } from '../domain/posicao.js';
import { PosicaoRepository } from '../domain/posicao.repository.js';
import { PosicaoDaFrota } from './registrar-posicao.use-case.js';

@Injectable()
export class ListarPosicoesUseCase {
  constructor(
    private readonly posicoes: PosicaoRepository,
    private readonly onibus: OnibusRepository,
    private readonly rotas: RotaRepository,
    private readonly pessoas: PessoaRepository,
  ) {}

  async executar(agora = new Date()): Promise<PosicaoDaFrota[]> {
    const [posicoes, frota, rotas, pessoas] = await Promise.all([
      this.posicoes.listar(),
      this.onibus.listar(),
      this.rotas.listar(),
      this.pessoas.listar(),
    ]);
    const veiculos = new Map(frota.map((veiculo) => [veiculo.id, veiculo]));
    const nomes = new Map(pessoas.map((pessoa) => [pessoa.id, pessoa.nome]));

    return posicoes.flatMap((posicao) => {
      const veiculo = veiculos.get(posicao.onibusId);
      if (!veiculo) return [];
      const ativas = rotas.filter((rota) => rota.ativo && rota.onibusId === posicao.onibusId);
      return [
        {
          onibusId: posicao.onibusId,
          placa: veiculo.placa,
          modelo: veiculo.modelo,
          rota: ativas.length > 0 ? ativas.map((rota) => rota.nome).join(' · ') : null,
          motorista:
            ativas.length > 0
              ? ativas
                  .map((rota) => nomes.get(rota.motoristaId))
                  .filter((nome): nome is string => !!nome)
                  .join(' · ') || null
              : null,
          latitude: posicao.latitude,
          longitude: posicao.longitude,
          atualizadoEm: posicao.atualizadoEm.toISOString(),
          desatualizada: posicaoDesatualizada(posicao.atualizadoEm, agora),
        },
      ];
    });
  }
}
